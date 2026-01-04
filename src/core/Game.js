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
import { AudioSystem } from "../systems/AudioSystem.js";
import { Renderer } from "./Renderer.js";
import { Player } from "../entities/Player.js";
import { EnemyFactory } from "../entities/EnemyFactory.js";
import { WeaponFactory } from "../weapons/WeaponFactory.js";
import { MapGenerator } from "../utils/MapGenerator.js";

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
    this.renderer = new Renderer(
      this.canvas,
      this.weaponCanvas,
      this.resourceManager,
    );

    // Game state
    this.player = null;
    this.enemies = [];
    this.map = null;
    this.bloodSplatters = [];
    this.enemiesKilled = 0;
    this.totalEnemies = 0;

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
    } catch (error) {
      this._updateLoadingScreen(0, "Error loading resources. Please refresh.");
    }
  }

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    // Start game button
    document.getElementById("startScreen").onclick = () => this.startGame();

    // Restart buttons
    document.getElementById("gameOverScreen").onclick = () =>
      this.restartGame();
    document.getElementById("victoryScreen").onclick = () => this.restartGame();

    // Mouse movement (setup once)
    document.addEventListener("mousemove", (e) => {
      if (document.pointerLockElement === this.canvas && this.player) {
        this.player.angle += e.movementX * 0.002;
      }
    });

    // Weapon switching
    this.eventManager.on("keydown", (key) => {
      if (key === "1") this.player?.switchWeapon(0);
      if (key === "2") this.player?.switchWeapon(1);
      if (key === "3") this.player?.switchWeapon(2);
      if (key === "q") this.player?.previousWeapon();
      if (key === "e") this.player?.nextWeapon();
      if (key === "r") this.player?.reload();
    });

    // Shooting via mousedown event
    this.eventManager.on("mousedown", (button) => {
      if (
        button === "left" &&
        this.stateManager.is(GameStates.PLAYING) &&
        this.player
      ) {
        this.player.shoot({
          enemies: this.enemies,
          map: this.map,
          audioSystem: this.audioSystem,
          eventManager: this.eventManager,
        });
      }
    });

    // Enemy events
    this.eventManager.on("enemyKilled", (enemy) => {
      this.enemiesKilled++;
      this._updateHUD();
      this.audioSystem.playSound("death");

      // Create blood splatter
      this._createBloodSplatter(enemy.x, enemy.y);

      // Check victory condition
      if (this.enemiesKilled >= this.totalEnemies) {
        this._handleVictory();
      }
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
  }

  /**
   * Start new game
   */
  startGame() {
    // Request pointer lock
    this.canvas.requestPointerLock();

    // Initialize game world
    this._initializeWorld();

    // Hide start screen
    document.getElementById("startScreen").style.display = "none";

    // Start game loop
    this.stateManager.setState(GameStates.PLAYING);
    this.audioSystem.startAmbience();
    this.lastFrameTime = performance.now();
    this._gameLoop();
  }

  /**
   * Restart game
   */
  restartGame() {
    // Hide end screens
    document.getElementById("gameOverScreen").classList.remove("show");
    document.getElementById("victoryScreen").classList.remove("show");

    // Reset state
    this.enemiesKilled = 0;
    this.bloodSplatters = [];

    // Restart
    this.startGame();
  }

  /**
   * Initialize game world
   * @private
   */
  _initializeWorld() {
    // Generate map
    const spawnX = GameConfig.PLAYER.SPAWN_X;
    const spawnY = GameConfig.PLAYER.SPAWN_Y;
    this.map = MapGenerator.generateSpawnMap(spawnX, spawnY);

    // Create player
    this.player = new Player(
      spawnX,
      spawnY,
      this.eventManager,
      this.audioSystem,
    );

    // Add weapons
    this.player.addWeapon(WeaponFactory.create("pistol"));
    this.player.addWeapon(WeaponFactory.create("shotgun"));
    this.player.addWeapon(WeaponFactory.create("rifle"));

    // Create enemies
    this._spawnEnemies();

    this._updateHUD();
  }

  /**
   * Spawn enemies
   * @private
   */
  _spawnEnemies() {
    this.enemies = [];
    const enemyCount = GameConfig.ENEMY.DEFAULT_SPAWN_COUNT;
    const types = Object.keys(GameConfig.ENEMY.TYPES);

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
          this.enemies.push(enemy);
        }
      }
    }

    this.totalEnemies = this.enemies.length;
  }

  /**
   * Main game loop
   * @private
   */
  _gameLoop = () => {
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

    // Continue loop
    this.animationFrameId = requestAnimationFrame(this._gameLoop);
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

    if (this.inputManager.isKeyPressed("w")) forward += 1;
    if (this.inputManager.isKeyPressed("s")) forward -= 1;
    if (this.inputManager.isKeyPressed("a")) strafe -= 1;
    if (this.inputManager.isKeyPressed("d")) strafe += 1;

    this.player.isSprinting = this.inputManager.isKeyPressed("shift");

    if (this.inputManager.isKeyPressed("arrowleft")) {
      this.player.rotate(-1);
    }
    if (this.inputManager.isKeyPressed("arrowright")) {
      this.player.rotate(1);
    }

    this.player.move(forward, strafe, this.map, deltaTime);
  }

  /**
   * Update enemies
   * @private
   */
  _updateEnemies(deltaTime) {
    for (const enemy of this.enemies) {
      if (!enemy.isDead) {
        enemy.update(this.player, this.map, deltaTime);
      }
    }
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

    document.getElementById("health").textContent = Math.floor(status.health);
    document.getElementById("stamina").textContent = Math.floor(status.stamina);

    if (status.weapon) {
      document.getElementById(
        "ammo",
      ).textContent = `${status.weapon.currentMagazine} / ${status.weapon.reserveAmmo}`;
      document.getElementById("weapon").textContent =
        status.weapon.name + (status.weapon.isReloading ? " (RELOADING)" : "");
    }

    const enemyCounter = document.getElementById("enemyCounter");
    if (enemyCounter) {
      enemyCounter.textContent = `${this.enemiesKilled} / ${this.totalEnemies}`;
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

    if (loadingBar) loadingBar.style.width = percentage + "%";
    if (loadingText) loadingText.textContent = text;
    if (loadingPercentage)
      loadingPercentage.textContent = Math.floor(percentage) + "%";
  }

  /**
   * Handle game over
   * @private
   */
  _handleGameOver() {
    this.stateManager.setState(GameStates.GAME_OVER);
    this.audioSystem.stopAmbience();
    document.exitPointerLock();

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
    document.exitPointerLock();

    setTimeout(() => {
      document.getElementById("victoryScreen").classList.add("show");
    }, 500);
  }
}

// Initialize game when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new Game();
  });
} else {
  new Game();
}

export default Game;
