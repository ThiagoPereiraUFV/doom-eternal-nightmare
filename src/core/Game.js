/**
 * Main Game Class
 * Coordinates all game systems
 * Following SRP - game loop and system coordination
 */

import { GameConfig } from "../config/GameConfig.js";
import { GameStateManager, GameStates } from "../managers/GameStateManager.js";
import { ResourceManager } from "../managers/ResourceManager.js";
import { EventManager } from "./EventManager.js";
import { InputManager } from "./InputManager.js";
import { TouchInputManager } from "./TouchInputManager.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { Renderer } from "./Renderer.js";
import { MenuModelViewer } from "./MenuModelViewer.js";
import { Player } from "../entities/Player.js";
import { EnemyFactory } from "../entities/EnemyFactory.js";
import { WeaponFactory } from "../weapons/WeaponFactory.js";
import { MapGenerator } from "../utils/MapGenerator.js";
import { FriendlyBot } from "../entities/FriendlyBot.js";
import { BotFollowState } from "../ai/BotFollowState.js";
import { BotSearchClearState } from "../ai/BotSearchClearState.js";
import { BotIdleState } from "../ai/BotIdleState.js";

export class Game {
  constructor() {
    // Get canvases
    this.canvas = document.getElementById("gameCanvas");
    this.weaponCanvas = document.getElementById("weaponCanvas");

    // Initialize managers (Singletons)
    this.stateManager = GameStateManager.getInstance();
    this.resourceManager = ResourceManager.getInstance();
    this.eventManager = new EventManager();
    this.audioSystem = AudioSystem.getInstance();

    // Initialize systems
    this.inputManager = new InputManager(this.canvas, this.eventManager);
    this.touchInputManager = new TouchInputManager(this.eventManager);
    this.renderer = new Renderer(
      this.canvas,
      this.weaponCanvas,
      this.resourceManager,
    );
    this.modelViewer = new MenuModelViewer(this.renderer);

    // Control type — auto-detected from device capabilities
    // Same media query used by CSS to show touch controls
    this.controlType = null;

    // Game state
    this.player = null;
    this.enemies = [];
    this.bots = [];
    this.map = null;
    this.bloodSplatters = [];
    this.enemiesKilled = 0;
    this.totalEnemies = 0;

    // Active bot command (shared across all bots)
    this.botCommand = GameConfig.BOT.COMMANDS.FOLLOW;

    // Shared bot state instances (stateless — same pattern as enemy AI states)
    this._botStates = {
      [GameConfig.BOT.COMMANDS.FOLLOW]: new BotFollowState(),
      [GameConfig.BOT.COMMANDS.SEARCH_CLEAR]: new BotSearchClearState(),
      [GameConfig.BOT.COMMANDS.STOP]: new BotIdleState(),
    };

    // Difficulty (default to MEDIUM)
    this.difficulty = GameConfig.DIFFICULTY.MEDIUM;

    // ADS (Aim Down Sights) state
    this._isAiming = false;
    this._touchAdsActive = false;

    // Timing
    this.lastFrameTime = 0;
    this.animationFrameId = null;

    // Setup event listeners
    this._setupEventListeners();

    // Start initialization
    this._initialize();
  }

  /**
   * Initialize game
   * @private
   */
  async _initialize() {
    this.stateManager.setState(GameStates.LOADING);

    try {
      // Load resources
      await this.resourceManager.loadResources((progress, text) => {
        this._updateLoadingScreen(progress, text);
      });

      // Hide loading, show start screen
      setTimeout(() => {
        document.getElementById("loadingScreen").style.display = "none";
        const startScreen = document.getElementById("startScreen");
        startScreen.classList.remove("hidden");
        startScreen.style.display = "flex";

        this.stateManager.setState(GameStates.MENU);
      }, 500);
    } catch {}
  }

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    // Helper: bind both click and touchstart for mobile compatibility
    const _bindTap = (el, fn) => {
      if (!el) {
        return;
      }
      el.onclick = fn;
      el.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          fn();
        },
        { passive: false },
      );
    };

    // Start game button — directly starts game, controls are auto-detected
    const startBtn = document.getElementById("start-btn");
    const modelViewerOpen = document.getElementById("model-viewer-open");
    if (startBtn) {
      _bindTap(startBtn, () => this.startGame());
    } else {
      // Fallback: tap anywhere on start screen, but NOT on diff buttons or controls card
      const startScreen = document.getElementById("startScreen");
      if (startScreen) {
        startScreen.onclick = (e) => {
          if (
            e.target.closest(
              ".diff-btn, .controls-card, #controls-desktop, #controls-touch",
            )
          ) {
            return;
          }
          this.startGame();
        };
        startScreen.addEventListener(
          "touchstart",
          (e) => {
            if (
              e.target.closest(
                ".diff-btn, .controls-card, #controls-desktop, #controls-touch",
              )
            ) {
              return;
            }
            e.preventDefault();
            this.startGame();
          },
          { passive: false },
        );
      }
    }

    if (modelViewerOpen) {
      _bindTap(modelViewerOpen, () => this.openModelViewer());
    }

    _bindTap(document.getElementById("model-viewer-close"), () =>
      this.closeModelViewer(),
    );
    _bindTap(document.getElementById("model-viewer-prev"), () =>
      this.modelViewer.previous(),
    );
    _bindTap(document.getElementById("model-viewer-next"), () =>
      this.modelViewer.next(),
    );
    _bindTap(document.getElementById("model-viewer-tab-enemies"), () =>
      this.setModelViewerCategory("enemies"),
    );
    _bindTap(document.getElementById("model-viewer-tab-weapons"), () =>
      this.setModelViewerCategory("weapons"),
    );
    _bindTap(document.getElementById("model-viewer-tab-characters"), () =>
      this.setModelViewerCategory("characters"),
    );

    // Restart buttons
    _bindTap(document.getElementById("gameOverScreen"), () =>
      this.restartGame(),
    );
    _bindTap(document.getElementById("victoryScreen"), () =>
      this.restartGame(),
    );

    // Mouse movement (setup once)
    document.addEventListener("mousemove", (e) => {
      if (
        this.controlType === "keyboard" &&
        document.pointerLockElement === this.canvas &&
        this.player
      ) {
        this.player.look(
          e.movementX * GameConfig.INPUT.MOUSE_SENSITIVITY,
          -e.movementY * GameConfig.INPUT.MOUSE_SENSITIVITY,
        );
      }
    });

    // Pause menu buttons
    const pauseResume = document.getElementById("pause-resume");
    const pauseExit = document.getElementById("pause-exit");
    if (pauseResume) {
      _bindTap(pauseResume, () => this.resumeGame());
    }
    if (pauseExit) {
      _bindTap(pauseExit, () => this.exitToMenu());
    }

    // ── Touch buttons (mobile) — from #touch-controls set ───────────
    const touchFire = document.getElementById("touch-fire");
    if (touchFire) {
      // touchstart = first shot; holding is handled by _updatePlayer auto-fire loop
      touchFire.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          this._touchFireActive = true;
          if (this.stateManager.is(GameStates.PLAYING) && this.player) {
            this._doShoot();
          }
        },
        { passive: false },
      );
      touchFire.addEventListener(
        "touchend",
        () => {
          this._touchFireActive = false;
        },
        { passive: true },
      );
      touchFire.addEventListener(
        "touchcancel",
        () => {
          this._touchFireActive = false;
        },
        { passive: true },
      );
    }

    // ADS toggle — tap once to enable, tap again to disable (persists)
    const touchAds = document.getElementById("touch-ads");
    if (touchAds) {
      touchAds.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          this._touchAdsActive = !this._touchAdsActive;
          this._isAiming = this._touchAdsActive;
          if (this._touchAdsActive) {
            this._applyAimAssist();
          }
          touchAds.classList.toggle("active", this._touchAdsActive);
          this._syncCrosshair();
        },
        { passive: false },
      );
    }

    const touchReload = document.getElementById("touch-reload");
    if (touchReload) {
      touchReload.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.player?.reload();
        },
        { passive: false },
      );
    }

    // Weapon prev/next buttons (touch)
    const touchPrev = document.getElementById("touch-prev-weapon");
    if (touchPrev) {
      touchPrev.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.player?.previousWeapon();
        },
        { passive: false },
      );
    }
    const touchNext = document.getElementById("touch-next-weapon");
    if (touchNext) {
      touchNext.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.player?.nextWeapon();
        },
        { passive: false },
      );
    }

    // Bot command touch buttons
    const bindBotCmd = (id, cmd) => {
      const el = document.getElementById(id);
      if (!el) {
        return;
      }
      el.onclick = () => this._issueBotCommand(cmd);
      el.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          this._issueBotCommand(cmd);
        },
        { passive: false },
      );
    };
    bindBotCmd("touch-bot-follow", GameConfig.BOT.COMMANDS.FOLLOW);
    bindBotCmd("touch-bot-search", GameConfig.BOT.COMMANDS.SEARCH_CLEAR);
    bindBotCmd("touch-bot-stop", GameConfig.BOT.COMMANDS.STOP);

    // Weapon switching and pause
    this.eventManager.on("keydown", (key) => {
      const lowerKey = key.toLowerCase();

      if (lowerKey === "p") {
        this.togglePause();
        return;
      }

      if (this.stateManager.is(GameStates.PAUSED)) {
        return;
      }

      if (lowerKey === "1") {
        this.player?.switchWeapon(0);
      }
      if (lowerKey === "2") {
        this.player?.switchWeapon(1);
      }
      if (lowerKey === "3") {
        this.player?.switchWeapon(2);
      }
      if (lowerKey === "4") {
        this.player?.switchWeapon(3);
      }
      if (lowerKey === "5") {
        this.player?.switchWeapon(4);
      }
      if (lowerKey === "6") {
        this.player?.switchWeapon(5);
      }
      if (lowerKey === "7") {
        this.player?.switchWeapon(6);
      }
      if (lowerKey === "q") {
        this.player?.previousWeapon();
      }
      if (lowerKey === "e") {
        this.player?.nextWeapon();
      }
      if (lowerKey === "r") {
        this.player?.reload();
      }
      // Bot commands
      if (lowerKey === "z") {
        this._issueBotCommand(GameConfig.BOT.COMMANDS.FOLLOW);
      }
      if (lowerKey === "x") {
        this._issueBotCommand(GameConfig.BOT.COMMANDS.SEARCH_CLEAR);
      }
      if (lowerKey === "c") {
        this._issueBotCommand(GameConfig.BOT.COMMANDS.STOP);
      }
    });

    // Shooting via mousedown event (semi-auto weapons)
    this.eventManager.on("mousedown", (button) => {
      if (!this.stateManager.is(GameStates.PLAYING) || !this.player) {
        return;
      }
      if (button === "left") {
        // Always fire on the initial press regardless of weapon type
        this._doShoot();
      }
      if (button === "right") {
        this._isAiming = true;
        this._applyAimAssist();
        this._syncCrosshair();
      }
    });

    this.eventManager.on("mouseup", (button) => {
      if (button === "right") {
        this._isAiming = false;
        this._syncCrosshair();
      }
    });

    // Enemy events
    this.eventManager.on("enemyDamaged", ({ enemy }) => {
      enemy.triggerHitFlash?.();
      this.audioSystem.playSound("enemy_hurt");
    });

    this.eventManager.on("enemyKilled", (enemy) => {
      this.enemiesKilled++;
      this._updateHUD();
      this.audioSystem.playSound("death");

      // 2D blood splatter overlay only
      this._createBloodSplatter(enemy.x, enemy.y);

      // Check victory condition
      if (this.enemiesKilled >= this.totalEnemies) {
        this._handleVictory();
      }
    });

    // Explosion event (grenade launcher)
    this.eventManager.on("explosion", ({ x, y }) => {
      this.renderer.spawnExplosion?.(x, y);
      this.audioSystem.playSound("explosion");
    });

    // Player events
    this.eventManager.on("playerDied", () => {
      this._handleGameOver();
    });

    // Weapon events
    this.eventManager.on("weaponChanged", () => {
      this._updateHUD();
    });

    this.eventManager.on("reloadStarted", () => {
      this._updateHUD();
    });

    this.eventManager.on("reloadCompleted", () => {
      this._updateHUD();
    });

    this.eventManager.on("weaponFired", ({ weapon, angle }) => {
      if (!weapon || !weapon.shell) {
        return;
      }
      this.renderer.spawnShell?.(
        this.player.x,
        this.player.y,
        angle,
        weapon.shell,
      );
    });

    // Pointer lock change — auto-pause when the browser releases pointer lock
    // (e.g. user pressed Escape) while the game is still running.
    document.addEventListener("pointerlockchange", () => {
      if (
        this.controlType === "keyboard" &&
        document.pointerLockElement !== this.canvas &&
        this.stateManager.is(GameStates.PLAYING)
      ) {
        this.pauseGame();
      }
    });

    // Portrait-mode detection: pause game when device rotates to portrait,
    // resume when it rotates back to landscape (touch devices only).
    const portraitQuery = window.matchMedia(
      "(orientation: portrait) and (hover: none) and (pointer: coarse)",
    );
    const handleOrientationChange = (e) => {
      if (e.matches) {
        // Entered portrait — pause if currently playing
        if (this.stateManager.is(GameStates.PLAYING)) {
          this._pausedByOrientation = true;
          this.pauseGame();
        }
      } else {
        // Returned to landscape — resume only if we were the ones who paused
        if (this._pausedByOrientation && this.stateManager.is(GameStates.PAUSED)) {
          this._pausedByOrientation = false;
          this.resumeGame();
        }
      }
    };
    portraitQuery.addEventListener("change", handleOrientationChange);
  }

  /**
   * Start new game — show 5-second mission briefing first
   */
  startGame() {
    this.closeModelViewer();

    // Read selected difficulty from UI
    const sel = document.querySelector(".diff-btn.selected");
    const diffId = (sel?.dataset?.diff ?? "medium").toUpperCase();
    this.difficulty =
      GameConfig.DIFFICULTY[diffId] ?? GameConfig.DIFFICULTY.MEDIUM;

    // Hide start screen and show briefing
    document.getElementById("startScreen").style.display = "none";
    this._showMissionBriefing();
  }

  /**
   * Show the 5-second mission briefing overlay, then launch the game.
   * @private
   */
  _showMissionBriefing() {
    const screen = document.getElementById("missionBriefingScreen");
    const countdownEl = document.getElementById("briefingCountdown");
    const skipBtn = document.getElementById("briefingSkip");

    if (!screen) {
      // Fallback: start immediately if briefing element is missing
      this._startGameActual();
      return;
    }

    screen.classList.remove("hidden");

    let remaining = 5;
    let launched = false;
    if (countdownEl) {
      countdownEl.textContent = remaining;
    }

    const launch = async () => {
      if (launched) {
        return;
      }
      launched = true;
      clearInterval(tick);
      screen.classList.add("hidden");
      if (skipBtn) {
        skipBtn.onclick = null;
        skipBtn.removeEventListener("touchstart", onSkipTouch);
      }
      await this._startGameActual();
    };

    const tick = setInterval(() => {
      remaining -= 1;
      if (countdownEl) {
        countdownEl.textContent = remaining;
      }
      if (remaining <= 0) {
        launch();
      }
    }, 1000);

    const onSkipTouch = (e) => {
      e.preventDefault();
      launch();
    };
    if (skipBtn) {
      skipBtn.onclick = launch;
      skipBtn.addEventListener("touchstart", onSkipTouch, { passive: false });
    }
  }

  /**
   * Actually initialise and run the game after the briefing.
   * @private
   */
  async _startGameActual() {
    // Auto-detect control type from device capabilities
    this.controlType = this._detectControlType();

    // Resume audio context (required for browser autoplay policies)
    this.audioSystem.resume();

    // Request pointer lock for keyboard controls — must be inside a user gesture.
    // Try immediately first (works if called directly from a gesture, e.g. skip button).
    // Fall back to a one-time handler for the next click/keydown if the context was lost.
    if (this.controlType === "keyboard") {
      const requestLock = () => {
        this.canvas.requestPointerLock();
      };
      const immediateResult = this.canvas.requestPointerLock();
      if (immediateResult instanceof Promise) {
        immediateResult.catch(() => {
          this.canvas.addEventListener("click", requestLock, { once: true });
          document.addEventListener("keydown", requestLock, { once: true });
        });
      }
    }

    // Enable touch controls for touch mode
    if (this.controlType === "touch") {
      this.touchInputManager.enable();
      // Show the #touch-controls set (fire, ads, reload, prev/next weapon)
      const tc = document.getElementById("touch-controls");
      if (tc) {
        tc.classList.add("active");
      }
      // Reset ADS toggle state
      this._touchAdsActive = false;
      this._isAiming = false;
      const adsBtn = document.getElementById("touch-ads");
      if (adsBtn) {
        adsBtn.classList.remove("active");
      }
    }

    // Initialize game world
    await this._initializeWorld();

    // Start game loop
    this.stateManager.setState(GameStates.PLAYING);
    this.audioSystem.startAmbience();
    this.audioSystem.startMusic();
    this.lastFrameTime = performance.now();
    this._gameLoop();
  }

  /**
   * Detect control type from device capabilities
   * @private
   */
  _detectControlType() {
    return window.matchMedia("(hover: none) and (pointer: coarse)").matches
      ? "touch"
      : "keyboard";
  }

  /**
   * Restart game
   */
  restartGame() {
    this.closeModelViewer();

    // Hide end screens
    document.getElementById("gameOverScreen").classList.remove("show");
    document.getElementById("victoryScreen").classList.remove("show");
    document.getElementById("pauseMenu").classList.remove("show");

    // Hide touch controls
    const tc = document.getElementById("touch-controls");
    if (tc) {
      tc.classList.remove("active");
    }

    // Reset state
    this.enemiesKilled = 0;
    this.bloodSplatters = [];
    this.bots = [];
    this.controlType = null;
    // Hide bot UI
    const botPanel = document.getElementById("bot-status-panel");
    if (botPanel) {
      botPanel.style.display = "none";
    }
    const botTouchCmds = document.getElementById("bot-touch-commands");
    if (botTouchCmds) {
      botTouchCmds.style.display = "none";
    }

    // Show start screen again
    const startScreen = document.getElementById("startScreen");
    if (startScreen) {
      startScreen.style.display = "flex";
    }
  }

  /**
   * Toggle pause state
   */
  togglePause() {
    if (this.stateManager.is(GameStates.PLAYING)) {
      this.pauseGame();
    } else if (this.stateManager.is(GameStates.PAUSED)) {
      this.resumeGame();
    }
  }

  /**
   * Pause the game
   */
  pauseGame() {
    if (!this.stateManager.is(GameStates.PLAYING)) {
      return;
    }

    this.stateManager.setState(GameStates.PAUSED);
    this.audioSystem.stopMusic();
    const pauseMenu = document.getElementById("pauseMenu");
    pauseMenu.style.display = "flex";
    pauseMenu.classList.add("show");

    if (this.controlType === "keyboard") {
      document.exitPointerLock();
    }
  }

  /**
   * Resume the game
   */
  resumeGame() {
    if (!this.stateManager.is(GameStates.PAUSED)) {
      return;
    }

    const pauseMenu = document.getElementById("pauseMenu");
    pauseMenu.classList.remove("show");
    pauseMenu.style.display = "none";
    this.stateManager.setState(GameStates.PLAYING);
    this.audioSystem.startMusic();

    if (this.controlType === "keyboard") {
      this.canvas.requestPointerLock().catch(() => {
        // If the gesture context was lost, re-request on next interaction
        const requestLock = () => {
          this.canvas.requestPointerLock();
        };
        this.canvas.addEventListener("click", requestLock, { once: true });
        document.addEventListener("keydown", requestLock, { once: true });
      });
    }

    this.lastFrameTime = performance.now(); // Reset frame time to prevent jump
  }

  /**
   * Exit to main menu
   */
  exitToMenu() {
    // Stop game loop
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Stop audio
    this.audioSystem.stopAmbience();
    this.audioSystem.stopMusic();

    // Hide pause menu
    const pauseMenu = document.getElementById("pauseMenu");
    pauseMenu.classList.remove("show");
    pauseMenu.style.display = "none";

    // Disable touch controls
    this.touchInputManager.disable();
    const tc = document.getElementById("touch-controls");
    if (tc) {
      tc.classList.remove("active");
    }

    // Exit pointer lock
    if (this.controlType === "keyboard") {
      document.exitPointerLock();
    }

    // Show start screen
    const startScreen = document.getElementById("startScreen");
    startScreen.classList.remove("hidden");
    startScreen.style.display = "flex";
    this.closeModelViewer();

    // Reset game state
    this.stateManager.setState(GameStates.MENU);
    this.enemiesKilled = 0;
    this.bloodSplatters = [];
    this.player = null;
    this.enemies = [];
    this.bots = [];
    this.controlType = null;
    // Hide bot UI
    const botPanel = document.getElementById("bot-status-panel");
    if (botPanel) {
      botPanel.style.display = "none";
    }
    const botTouchCmds = document.getElementById("bot-touch-commands");
    if (botTouchCmds) {
      botTouchCmds.style.display = "none";
    }
  }

  /**
   * Initialize game world
   * @private
   */
  async _initializeWorld() {
    const diff = this.difficulty;

    // Generate map with difficulty-adjusted maze complexity
    const spawnX = GameConfig.PLAYER.SPAWN_X;
    const spawnY = GameConfig.PLAYER.SPAWN_Y;
    this.map = MapGenerator.generateSpawnMap(spawnX, spawnY, {
      fillRatio: diff.fillRatio,
      smoothIterations: diff.smoothIterations,
    });

    // Create player with difficulty-adjusted stats
    this.player = new Player(
      spawnX,
      spawnY,
      this.eventManager,
      this.audioSystem,
    );
    this.player.health = diff.maxHealth;
    this.player.maxHealth = diff.maxHealth;
    this.player.stamina = diff.maxStamina;
    this.player.maxStamina = diff.maxStamina;

    // Initialize factories before creating any instances
    await EnemyFactory.init();
    await WeaponFactory.init();

    // Add weapons — only those allowed by difficulty
    const ammoMult = diff.ammoMultiplier;
    const availableGuns = diff.availableGuns;
    for (const type of availableGuns) {
      try {
        const weapon = await WeaponFactory.create(type);
        weapon.reserveAmmo = Math.round((weapon.reserveAmmo ?? 30) * ammoMult);
        this.player.addWeapon(weapon);
      } catch (error) {
        console.warn(`WeaponFactory could not create weapon '${type}':`, error);
      }
    }

    // Create enemies
    this._spawnEnemies();

    // Create friendly bots
    this.botCommand = GameConfig.BOT.COMMANDS.FOLLOW;
    this._spawnBots();

    // Build 3D map geometry from tile data
    this.renderer.buildMap(this.map);

    // Apply difficulty lighting
    this.renderer.applyDifficultyLighting(diff);

    this._updateHUD();
  }

  /**
   * Spawn enemies
   * @private
   */
  _spawnEnemies() {
    this.enemies = [];
    const diff = this.difficulty;
    const enemyCount = diff.enemyCount;
    const types = EnemyFactory.getTypes();

    for (let i = 0; i < enemyCount; i++) {
      const pos = MapGenerator.findRandomEmptyPosition(
        this.map,
        GameConfig.ENEMY.SPAWN_MIN_OFFSET,
        GameConfig.ENEMY.SPAWN_MIN_OFFSET,
      );

      if (pos) {
        const dist = Math.sqrt(
          Math.pow(pos.x - this.player.x, 2) +
            Math.pow(pos.y - this.player.y, 2),
        );

        if (dist > GameConfig.ENEMY.MIN_PLAYER_DISTANCE) {
          const type =
            types[Math.floor(Math.random() * types.length)].toLowerCase();
          const enemy = EnemyFactory.create(type, pos.x, pos.y);
          // Scale enemy stats by difficulty
          enemy.health = Math.round(enemy.maxHealth * diff.enemyHealthMult);
          enemy.maxHealth = enemy.health;
          enemy.speed = enemy.speed * diff.enemySpeedMult;
          enemy.damage = diff.enemyDamage;
          this.enemies.push(enemy);
        }
      }
    }

    this.totalEnemies = this.enemies.length;
  }

  /**
   * Spawn friendly bots near the player based on difficulty botCount.
   * @private
   */
  _spawnBots() {
    this.bots = [];
    const count = this.difficulty.botCount ?? 0;
    if (count <= 0) {
      this._updateBotHUD();
      return;
    }

    const followState = this._botStates[GameConfig.BOT.COMMANDS.FOLLOW];
    for (let i = 0; i < count; i++) {
      // Spread bots in a small arc around the player's back
      const offsetAngle =
        this.player.angle + Math.PI + (i - (count - 1) / 2) * 0.7;
      const dist = 1.5 + i * 0.5;
      const bx = this.player.x + Math.cos(offsetAngle) * dist;
      const by = this.player.y + Math.sin(offsetAngle) * dist;

      const bot = new FriendlyBot(bx, by);
      bot.setCommand(GameConfig.BOT.COMMANDS.FOLLOW, followState);
      this.bots.push(bot);
    }
    this._updateBotHUD();
  }

  /**
   * Main game loop
   * @private
   */
  _gameLoop = () => {
    // Continue loop even when paused
    this.animationFrameId = requestAnimationFrame(this._gameLoop);

    if (!this.stateManager.is(GameStates.PLAYING)) {
      return;
    }

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;

    // Update
    this._update(deltaTime);

    // Render
    this._render();
  };

  /**
   * Update game state
   * @private
   */
  _update(deltaTime) {
    // Update player
    this._updatePlayer(deltaTime);

    // Update enemies
    this._updateEnemies(deltaTime);

    // Update friendly bots
    this._updateBots(deltaTime);

    // Update player systems
    this.player.update(deltaTime);

    // Update HUD
    this._updateHUD();
  }

  /**
   * Update player movement
   * @private
   */
  _updatePlayer(deltaTime) {
    let forward = 0;
    let strafe = 0;

    if (this.controlType === "keyboard") {
      // Keyboard controls
      if (this.inputManager.isKeyPressed("w")) {
        forward += 1;
      }
      if (this.inputManager.isKeyPressed("s")) {
        forward -= 1;
      }
      if (this.inputManager.isKeyPressed("a")) {
        strafe -= 1;
      }
      if (this.inputManager.isKeyPressed("d")) {
        strafe += 1;
      }

      this.player.isSprinting = this.inputManager.isKeyPressed("shift");

      if (this.inputManager.isKeyPressed("arrowleft")) {
        this.player.rotate(-1);
      }
      if (this.inputManager.isKeyPressed("arrowright")) {
        this.player.rotate(1);
      }
    } else if (this.controlType === "touch") {
      // Touch controls
      const movement = this.touchInputManager.getMovement();
      forward = movement.forward;
      strafe = movement.strafe;

      // Handle look delta from touch
      const lookDelta = this.touchInputManager.getLookDelta();
      if (lookDelta.x !== 0 || lookDelta.y !== 0) {
        this.player.look(
          lookDelta.x * GameConfig.INPUT.TOUCH_SENSITIVITY,
          -lookDelta.y * GameConfig.INPUT.TOUCH_SENSITIVITY,
        );
      }

      // Sprint is always off for touch (can be added as button if needed)
      this.player.isSprinting = false;
    }

    this.player.move(forward, strafe, this.map, deltaTime);

    // ── Auto-fire for auto weapons only ──────────────────────────
    const weapon = this.player.currentWeapon;
    if (weapon?.fireType === "auto") {
      const leftHeld = this.inputManager.isMouseButtonPressed("left");
      const touchHeld = !!this._touchFireActive;
      if (leftHeld || touchHeld) {
        this._doShoot();
      }
    }

    // ── Auto reload ──────────────────────────────────────────────
    if (
      this.difficulty.autoReload &&
      weapon &&
      weapon.currentMagazine === 0 &&
      !weapon.isReloading &&
      weapon.reserveAmmo > 0
    ) {
      this.player.reload();
    }

    // ── ADS ─────────────────────────────────────────────────────
    const aimingNow =
      this._isAiming ||
      this.inputManager.isMouseButtonPressed("right") ||
      !!this._touchAdsActive;
    if (aimingNow !== this._lastAimState) {
      this._isAiming = aimingNow;
      if (this.player) {
        this.player.isAiming = aimingNow;
      }
      this._syncCrosshair();
      this._lastAimState = aimingNow;
    }
    if (this.player) {
      this.player.isAiming = aimingNow;
    }
    this.renderer.setADS(this._isAiming, this.player?.currentWeapon);
  }

  /**
   * Fire the current weapon once, trigger muzzle flash.
   * @private
   */
  _doShoot() {
    if (!this.stateManager.is(GameStates.PLAYING) || !this.player) {
      return;
    }
    const result = this.player.shoot({
      enemies: this.enemies,
      map: this.map,
      audioSystem: this.audioSystem,
      eventManager: this.eventManager,
    });
    if (result?.success) {
      this.renderer.triggerMuzzleFlash(this.player.currentWeapon);
      this._flashCrosshair();
    }
  }

  /**
   * Snap player angle toward the nearest alive enemy within a ±30° cone.
   * Only fires when difficulty.aimAssist is true.
   * @private
   */
  _applyAimAssist() {
    if (!this.difficulty?.aimAssist || !this.player || !this.enemies?.length) {
      return;
    }

    const AIM_ASSIST_CONE = Math.PI / 6; // ±30°
    let bestEnemy = null;
    let bestAngleDelta = AIM_ASSIST_CONE;

    for (const enemy of this.enemies) {
      if (enemy.isDead) {
        continue;
      }
      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const angleToEnemy = Math.atan2(dy, dx);
      let delta = angleToEnemy - this.player.angle;
      // Normalize to [-π, π]
      while (delta > Math.PI) {
        delta -= 2 * Math.PI;
      }
      while (delta < -Math.PI) {
        delta += 2 * Math.PI;
      }
      if (Math.abs(delta) < Math.abs(bestAngleDelta)) {
        bestAngleDelta = delta;
        bestEnemy = enemy;
      }
    }

    if (bestEnemy !== null) {
      this.player.angle += bestAngleDelta;
    }
  }

  /**
   * Briefly flash the crosshair white on hit.
   * @private
   */
  _flashCrosshair() {
    const el = document.getElementById("crosshair");
    if (!el) {
      return;
    }
    el.classList.add("hit-flash");
    clearTimeout(this._crosshairFlashTimer);
    this._crosshairFlashTimer = setTimeout(() => {
      el.classList.remove("hit-flash");
    }, 60);
  }

  /**
   * Sync crosshair CSS class with current aim state.
   * @private
   */
  _syncCrosshair() {
    const el = document.getElementById("crosshair");
    if (!el) {
      return;
    }
    el.classList.toggle("ads", !!this._isAiming);
  }

  /**
   * Update enemies
   * @private
   */
  _updateEnemies(deltaTime) {
    const livingBots = this.bots.filter((b) => !b.isDead);
    for (const enemy of this.enemies) {
      if (!enemy.isDead) {
        enemy.update(this.player, this.map, deltaTime, livingBots);
      }
    }
  }

  /**
   * Update friendly bots.
   * @private
   */
  _updateBots(deltaTime) {
    let changed = false;
    for (const bot of this.bots) {
      if (!bot.isDead) {
        // Inject systems so states can fire events and play sounds
        bot.eventManager = this.eventManager;
        bot.audioSystem = this.audioSystem;
        bot.update(this.player, this.enemies, this.map, deltaTime);
      } else if (!bot._deathHandled) {
        bot._deathHandled = true;
        changed = true;
      }
    }
    if (changed) {
      this._updateBotHUD();
    }
  }

  /**
   * Issue a command to all living bots.
   * @param {string} command - One of GameConfig.BOT.COMMANDS
   * @private
   */
  _issueBotCommand(command) {
    const validCommands = Object.values(GameConfig.BOT.COMMANDS);
    if (!validCommands.includes(command)) {
      return;
    }
    this.botCommand = command;
    const stateObject = this._botStates[command];
    for (const bot of this.bots) {
      if (!bot.isDead) {
        bot.setCommand(command, stateObject);
      }
    }
    this._updateBotHUD();
  }

  async openModelViewer() {
    const screen = document.getElementById("modelViewerScreen");
    if (!screen) {
      return;
    }

    screen.classList.remove("hidden");
    screen.classList.add("show");
    this._syncModelViewerTabs();
    await this.modelViewer.open();
  }

  closeModelViewer() {
    const screen = document.getElementById("modelViewerScreen");
    if (!screen) {
      return;
    }

    this.modelViewer.close();
    screen.classList.remove("show");
    screen.classList.add("hidden");
  }

  async setModelViewerCategory(category) {
    await this.modelViewer.setCategory(category);
    this._syncModelViewerTabs();
  }

  _syncModelViewerTabs() {
    const enemyTab = document.getElementById("model-viewer-tab-enemies");
    const weaponTab = document.getElementById("model-viewer-tab-weapons");
    const charTab = document.getElementById("model-viewer-tab-characters");

    enemyTab?.classList.toggle(
      "active",
      this.modelViewer.category === "enemies",
    );
    weaponTab?.classList.toggle(
      "active",
      this.modelViewer.category === "weapons",
    );
    charTab?.classList.toggle(
      "active",
      this.modelViewer.category === "characters",
    );
  }

  /**
   * Render game
   * @private
   */
  _render() {
    this.renderer.renderWorld(
      this.player,
      this.enemies,
      this.map,
      this.bloodSplatters,
      this.bots,
    );
    this.renderer.renderWeapon(this.player);
  }

  /**
   * Create blood splatter effect
   * @private
   */
  _createBloodSplatter(x, y) {
    if (this.bloodSplatters.length >= GameConfig.EFFECTS.MAX_BLOOD_SPLATTERS) {
      this.bloodSplatters.shift();
    }

    this.bloodSplatters.push({
      x,
      y,
      size: 0.05 + Math.random() * 0.1,
      opacity: 0.6 + Math.random() * 0.4,
    });
  }

  /**
   * Update HUD
   * @private
   */
  _updateHUD() {
    const status = this.player.getStatus();

    // Update text
    document.getElementById("health").textContent = Math.floor(status.health);
    document.getElementById("stamina").textContent = Math.floor(status.stamina);

    // Update bars
    const healthBar = document.getElementById("health-bar");
    if (healthBar) {
      healthBar.style.width = `${Math.max(0, Math.min(100, status.health))}%`;
    }

    const staminaBar = document.getElementById("stamina-bar");
    if (staminaBar) {
      staminaBar.style.width = `${Math.max(0, Math.min(100, status.stamina))}%`;
    }

    if (status.weapon) {
      document.getElementById("ammo").textContent =
        `${status.weapon.currentMagazine} / ${status.weapon.reserveAmmo}`;
      document.getElementById("weapon").textContent =
        status.weapon.name + (status.weapon.isReloading ? " (RELOADING)" : "");
    }

    const enemyCounter = document.getElementById("enemyCounter");
    if (enemyCounter) {
      enemyCounter.textContent = `${this.enemiesKilled} / ${this.totalEnemies}`;
    }

    this._updateBotHUD();
  }

  /**
   * Refresh the bot status panel in the HUD.
   * @private
   */
  _updateBotHUD() {
    const panel = document.getElementById("bot-status-panel");
    const touchCmds = document.getElementById("bot-touch-commands");

    // Hide panel if no bots
    if (!this.bots || this.bots.length === 0) {
      if (panel) {
        panel.style.display = "none";
      }
      if (touchCmds) {
        touchCmds.style.display = "none";
      }
      return;
    }

    if (panel) {
      panel.style.display = "";
    }
    if (touchCmds) {
      touchCmds.style.display = "";
    }

    // Command badge
    const cmdBadge = document.getElementById("bot-command-badge");
    if (cmdBadge) {
      const labels = {
        [GameConfig.BOT.COMMANDS.FOLLOW]: "FOLLOW ME",
        [GameConfig.BOT.COMMANDS.SEARCH_CLEAR]: "SEARCH & CLEAR",
        [GameConfig.BOT.COMMANDS.STOP]: "STOP",
      };
      cmdBadge.textContent = labels[this.botCommand] ?? this.botCommand;
    }

    // Squad dots — one dot per bot, filled=alive, dim=dead
    const dotsEl = document.getElementById("bot-dots");
    if (dotsEl) {
      dotsEl.innerHTML = "";
      this.bots.forEach((bot) => {
        const dot = document.createElement("span");
        dot.className = "bot-dot" + (bot.isDead ? " bot-dead" : "");
        dot.textContent = bot.isDead ? "○" : "●";
        dotsEl.appendChild(dot);
      });
    }
  }

  /**
   * Update loading screen
   * @private
   */
  _updateLoadingScreen(percentage, text) {
    const loadingBar = document.getElementById("loadingBar");
    const loadingText = document.getElementById("loadingText");
    const loadingPercentage = document.getElementById("loadingPercentage");

    if (loadingBar) {
      loadingBar.style.width = percentage + "%";
    }
    if (loadingText) {
      loadingText.textContent = text;
    }
    if (loadingPercentage) {
      loadingPercentage.textContent = Math.floor(percentage) + "%";
    }
  }

  /**
   * Handle game over
   * @private
   */
  _handleGameOver() {
    this.stateManager.setState(GameStates.GAME_OVER);
    this.audioSystem.stopAmbience();
    this.audioSystem.stopMusic();

    if (this.controlType === "keyboard") {
      document.exitPointerLock();
    }

    this.touchInputManager.disable();
    const tcOver = document.getElementById("touch-controls");
    if (tcOver) {
      tcOver.classList.remove("active");
    }

    setTimeout(() => {
      document.getElementById("gameOverScreen").classList.add("show");
    }, 500);
  }

  /**
   * Handle victory
   * @private
   */
  _handleVictory() {
    this.stateManager.setState(GameStates.VICTORY);
    this.audioSystem.stopAmbience();
    this.audioSystem.stopMusic();

    if (this.controlType === "keyboard") {
      document.exitPointerLock();
    }

    this.touchInputManager.disable();
    const tcVic = document.getElementById("touch-controls");
    if (tcVic) {
      tcVic.classList.remove("active");
    }

    setTimeout(() => {
      document.getElementById("victoryScreen")?.classList.add("show");
    }, 500);
  }
}

// Initialize game when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.game = new Game();
  });
} else {
  window.game = new Game();
}

export default Game;
