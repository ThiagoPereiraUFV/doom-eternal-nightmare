/**
 * Renderer System — Three.js 3D Edition
 * True 3D rendering with instanced geometry, 3D enemy models,
 * first-person weapon meshes, and dynamic lighting.
 * Following SRP — only rendering logic.
 */

import * as THREE from "three";
import { GameConfig } from "../config/GameConfig.js";
import { EnemyFactory } from "../entities/EnemyFactory.js";
import {
  EntityRegistry,
  ENTITY_CATEGORIES,
} from "../registry/EntityRegistry.js";
import { FriendlyBot } from "../entities/FriendlyBot.js";
import { MapRenderer } from "./MapRenderer.js";
import { BloodSystem } from "../systems/BloodSystem.js";
import { ShellSystem } from "../systems/ShellSystem.js";
import { ExplosionSystem } from "../systems/ExplosionSystem.js";
import { DeathAnimationSystem } from "../systems/DeathAnimationSystem.js";

export class Renderer {
  constructor(canvas, _weaponCanvas, _resourceManager) {
    this.canvas = canvas;
    this.aimFocusOverlay = document.getElementById("aimFocusOverlay");
    this._adsVisualState = { aiming: false, profile: null };

    // ─── WebGL Renderer ───────────────────────────────────────────
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.NoToneMapping;

    // ─── Main Scene ───────────────────────────────────────────────
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0a18, 0.06);

    // ─── First-Person Camera ──────────────────────────────────────
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.05,
      60,
    );
    this.camera.rotation.order = "YXZ";

    // ─── Weapon Scene (no fog, renders on top) ────────────────────
    this.weaponScene = new THREE.Scene();
    this.weaponCamera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.01,
      10,
    );

    // ─── Scene groups ─────────────────────────────────────────────
    this.enemiesGroup = new THREE.Group();
    this.scene.add(this.enemiesGroup);

    // ─── Friendly bot group ───────────────────────────────────────
    this.botsGroup = new THREE.Group();
    this.scene.add(this.botsGroup);

    // ─── Weapon model ─────────────────────────────────────────────
    this.weaponGroup = new THREE.Group();
    this.weaponScene.add(this.weaponGroup);
    this._currentWeaponType = null;

    // ─── Muzzle flash ─────────────────────────────────────────────
    this.muzzleFlashLight = new THREE.PointLight(0xff9922, 0, 5);
    this.muzzleFlashLight.position.set(0, 0, -0.5);
    this.weaponScene.add(this.muzzleFlashLight);

    // ─── Subsystems ───────────────────────────────────────────────
    this.mapRenderer = new MapRenderer(this.scene);
    this.bloodSystem = new BloodSystem(this.scene);
    this.shellSystem = new ShellSystem(this.scene);
    this.explosionSystem = new ExplosionSystem(this.scene);
    this.deathSystem = new DeathAnimationSystem(this.scene);

    // ─── Setup ────────────────────────────────────────────────────
    this._setupLighting();
    this._buildMaterials();

    window.addEventListener("resize", () => this._onResize());
  }

  // ═══════════════════════════════════════════════════════════════
  // Lighting
  // ═══════════════════════════════════════════════════════════════

  _setupLighting() {
    // Dungeon ambient — dim but visible
    this._ambientLight = new THREE.AmbientLight(0x334455, 1.2);
    this.scene.add(this._ambientLight);

    // Player flashlight — follows camera each frame
    this.playerLight = new THREE.SpotLight(
      0xfff0dd,
      3.5,
      18,
      Math.PI * 0.28,
      0.4,
      1.2,
    );
    this.playerLight.position.set(0, 0.5, 0);
    this.playerLight.target.position.set(0, 0.4, -1);
    this.scene.add(this.playerLight);
    this.scene.add(this.playerLight.target);

    this.weaponScene.add(new THREE.AmbientLight(0x666666, 1.2));
    const wDir = new THREE.DirectionalLight(0xffeedd, 1.6);
    wDir.position.set(1, 2, 2);
    this.weaponScene.add(wDir);
  }

  /**
   * Apply difficulty-based lighting settings.
   * @param {{ ambientIntensity: number, fogDensity: number, flashlightIntensity: number }} diff
   */
  applyDifficultyLighting(diff) {
    if (this._ambientLight) {
      this._ambientLight.intensity = diff.ambientIntensity;
    }
    if (this.scene.fog) {
      this.scene.fog.density = diff.fogDensity;
    }
    if (this.playerLight) {
      this.playerLight.intensity = diff.flashlightIntensity;
    }
  }

  /**
   * Smoothly zoom camera FOV for ADS / hip-fire.
   * @param {boolean} aiming - True = ADS, false = hip-fire
   */
  setADS(aiming, weapon = null) {
    const target = aiming ? (weapon?.render?.adsFOV ?? 42) : 75;
    if (Math.abs(this.camera.fov - target) > 0.2) {
      this.camera.fov += (target - this.camera.fov) * 0.18;
      this.camera.updateProjectionMatrix();
    }

    this._updateADSOverlay(aiming, target);
  }

  _updateADSOverlay(aiming, targetFov) {
    if (!this.aimFocusOverlay) {
      return;
    }

    const focusConfig = GameConfig.EFFECTS.ADS_FOCUS;
    const intensity = THREE.MathUtils.clamp(focusConfig.INTENSITY ?? 1, 0, 2);
    const normalizedZoom = THREE.MathUtils.clamp((75 - targetFov) / 53, 0, 1);
    const blur = THREE.MathUtils.lerp(
      focusConfig.BLUR_MIN,
      focusConfig.BLUR_MAX,
      normalizedZoom,
    );
    const clearRadius = THREE.MathUtils.lerp(
      focusConfig.CLEAR_RADIUS_MAX,
      focusConfig.CLEAR_RADIUS_MIN,
      normalizedZoom * intensity,
    );
    const feather = THREE.MathUtils.lerp(
      focusConfig.FEATHER_MIN,
      focusConfig.FEATHER_MAX,
      normalizedZoom,
    );
    const tintAlpha = THREE.MathUtils.lerp(
      focusConfig.TINT_MIN,
      focusConfig.TINT_MAX,
      normalizedZoom * intensity,
    );
    const profile = [
      blur.toFixed(1),
      clearRadius.toFixed(1),
      feather.toFixed(1),
      tintAlpha.toFixed(2),
    ].join(":");

    if (
      this._adsVisualState.aiming === aiming &&
      this._adsVisualState.profile === profile
    ) {
      return;
    }

    this._adsVisualState.aiming = aiming;
    this._adsVisualState.profile = profile;

    this.aimFocusOverlay.classList.toggle("active", aiming);
    this.aimFocusOverlay.style.setProperty(
      "--ads-focus-blur",
      `${blur.toFixed(1)}px`,
    );
    this.aimFocusOverlay.style.setProperty(
      "--ads-focus-clear-radius",
      `${clearRadius.toFixed(1)}%`,
    );
    this.aimFocusOverlay.style.setProperty(
      "--ads-focus-feather",
      `${feather.toFixed(1)}%`,
    );
    this.aimFocusOverlay.style.setProperty(
      "--ads-focus-tint",
      `rgba(6, 8, 14, ${tintAlpha.toFixed(2)})`,
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // Materials & Textures
  // ═══════════════════════════════════════════════════════════════

  _buildMaterials() {
    const lam = (hex, extra = {}) =>
      new THREE.MeshLambertMaterial({ color: hex, ...extra });
    const bas = (hex, extra = {}) =>
      new THREE.MeshBasicMaterial({ color: hex, ...extra });

    this._enemyMats = {
      demon: {
        body: lam(0xaa1100),
        head: lam(0xcc2200),
        eye: bas(0xff4400),
        horn: lam(0x330000),
      },
      zombie: {
        body: lam(0x445533),
        head: lam(0x556644),
        eye: bas(0xff0000),
        horn: lam(0x222222),
      },
      ghost: {
        body: new THREE.MeshLambertMaterial({
          color: 0x5599cc,
          transparent: true,
          opacity: 0.6,
          emissive: new THREE.Color(0x112233),
        }),
        head: lam(0x77bbee, { transparent: true, opacity: 0.65 }),
        eye: bas(0x00ffff, { transparent: true, opacity: 0.9 }),
        horn: lam(0x334455),
      },
      brute: {
        body: lam(0x664422),
        head: lam(0x775533),
        eye: bas(0xff2200),
        horn: lam(0x111111),
      },
    };

    // Friendly bot materials (green tinted marine)
    this._botMat = {
      armor: lam(0x2a5c2a),
      suit: lam(0x1e4020),
      visor: bas(0x00ffcc, { transparent: true, opacity: 0.85 }),
      detail: lam(0x4a8a4a),
    };

    this._wMat = {
      dark: lam(0x1c1c1c),
      scope: new THREE.MeshLambertMaterial({
        color: 0x1c1c1c,
        side: THREE.DoubleSide,
      }),
      metal: lam(0x38393b),
      bright: lam(0x8c9098),
      steel: lam(0xb0b8be),
      wood: lam(0x5c3317),
      tan: lam(0x8b7355),
      glass: new THREE.MeshLambertMaterial({
        color: 0x334466,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      }),
      rubber: lam(0x0f0f0f),
      red: bas(0xcc1100),
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // Blood System
  // ─────────────────────────────────────────────────────────────────

  /**
   * Spawn blood splatter at world position (called on enemy hit/death).
   * @param {number} wx - World X
   * @param {number} wy - World Y (map grid)
   * @param {number} intensity - 1 = hit, 3 = death
   */
  spawnBlood(wx, wy, intensity = 1) {
    this.bloodSystem.spawnBlood(wx, wy, intensity);
  }

  spawnShell(px, py, angle, shellConfig = {}) {
    this.shellSystem.spawnShell(px, py, angle, shellConfig);
  }

  spawnExplosion(wx, wy) {
    this.explosionSystem.spawnExplosion(wx, wy);
  }

  startDeathAnimation(mesh) {
    this.deathSystem.start(mesh);
  }

  // ═══════════════════════════════════════════════════════════════
  // Map Geometry
  // ═══════════════════════════════════════════════════════════════

  /**
   * Build instanced 3D geometry from a 2D tile map.
   * Call once after map generation / regeneration.
   * @param {number[][]} map
   */
  buildMap(map) {
    this.mapRenderer.build(map);
  }

  // ═══════════════════════════════════════════════════════════════
  // Enemy 3D Models
  // ═══════════════════════════════════════════════════════════════

  /**
   * Return material set for the given enemy type.
   * Falls back to the demon materials for unknown types.
   * New enemy types get their materials from their EntityRegistry config
   * (config.getMaterials()) so Renderer doesn't need to be updated.
   */
  _getEnemyMats(type) {
    if (!this._enemyMats[type]) {
      const config = EntityRegistry.getConfig(ENTITY_CATEGORIES.ENEMY, type);
      if (config?.getMaterials) {
        this._enemyMats[type] = config.getMaterials();
      } else {
        return this._enemyMats.demon;
      }
    }
    return this._enemyMats[type];
  }

  _createEnemyMesh(enemy) {
    const g = new THREE.Group();
    const mats = this._getEnemyMats(enemy.type);
    enemy.createMesh(g, mats);
    g.userData.hitFlashTimer = 0;
    return g;
  }

  _clonePreviewMaterials(group) {
    group.traverse((child) => {
      if (!child.isMesh || !child.material) {
        return;
      }

      if (Array.isArray(child.material)) {
        child.material = child.material.map((material) => material.clone());
        return;
      }

      child.material = child.material.clone();
    });

    return group;
  }

  // ═══════════════════════════════════════════════════════════════
  // Weapon 3D Models
  // ═══════════════════════════════════════════════════════════════

  _populateWeaponGroup(group, weapon) {
    group.clear();
    if (weapon && typeof weapon.buildModel === "function") {
      weapon.buildModel(group, this._wMat);
    } else {
      // Fallback: plain box
      const m = this._wMat;
      const geo = new THREE.BoxGeometry(0.08, 0.05, 0.3);
      group.add(new THREE.Mesh(geo, m.metal));
    }
  }

  _buildWeaponModel(weapon) {
    this._populateWeaponGroup(this.weaponGroup, weapon);

    const gunBuildCfg = weapon?.render || {};
    const [baseX, baseY, baseZ] = gunBuildCfg.basePosition ?? [
      0.14, -0.14, -0.33,
    ];
    const baseRotationY = gunBuildCfg.baseRotationY ?? -0.06;
    this.weaponGroup.position.set(baseX, baseY, baseZ);
    this.weaponGroup.rotation.y = baseRotationY;

    this._currentWeaponType = (weapon?.name ?? "").toLowerCase();
  }

  // ═══════════════════════════════════════════════════════════════
  // Enemy Mesh Management
  // ═══════════════════════════════════════════════════════════════

  _updateEnemyMeshes(enemies, t) {
    for (const enemy of enemies) {
      if (enemy.isDead) {
        if (enemy.mesh) {
          this.deathSystem.start(enemy.mesh);
          enemy.removeMesh(this.enemiesGroup);
        }
        continue;
      }
      if (!enemy.mesh) {
        const mats = this._getEnemyMats(enemy.type);
        enemy.spawnMesh(this.enemiesGroup, mats);
      }
      enemy.updateMesh(this.camera.position.x, this.camera.position.z, t);
    }
  }

  createEnemyPreview(type) {
    const mats = this._getEnemyMats(type);
    const tmp = EnemyFactory.create(type, 0, 0);
    const root = new THREE.Group();
    tmp.spawnMesh(root, mats);
    return this._clonePreviewMaterials(tmp.mesh);
  }

  createWeaponPreview(weapon) {
    const previewGroup = new THREE.Group();
    this._populateWeaponGroup(previewGroup, weapon);
    return this._clonePreviewMaterials(previewGroup);
  }

  createBotPreview(weaponType = "pistol") {
    const bot = new FriendlyBot(0, 0);
    bot.weaponType = weaponType;
    const root = new THREE.Group();
    bot.createMesh(root, this._botMat);
    // Show only the requested weapon sub-mesh
    if (root.userData.weapons) {
      for (const [key, wMesh] of Object.entries(root.userData.weapons)) {
        wMesh.visible = key === weaponType;
      }
    }
    return this._clonePreviewMaterials(root);
  }

  // ═══════════════════════════════════════════════════════════════
  // Friendly Bot Mesh Management
  // ═══════════════════════════════════════════════════════════════

  _updateBotMeshes(bots, t) {
    for (const bot of bots) {
      if (bot.isDead) {
        if (bot.mesh) {
          this.deathSystem.start(bot.mesh);
          bot.removeMesh(this.botsGroup);
        }
        continue;
      }
      if (!bot.mesh) {
        bot.spawnMesh(this.botsGroup, this._botMat);
      }
      bot.updateMesh(t);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Public Render API  (preserves original Game.js interface)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Render the full 3D world.
   * @param {Player}   player
   * @param {Enemy[]}  enemies
   * @param {number[][]} _map      — kept for API compat; geometry built via buildMap()
   * @param {Array}    _splatters  — placeholder
   */
  renderWorld(player, enemies, _map, _splatters = [], bots = []) {
    const t = performance.now() / 1000;

    // Sync camera to player
    // angle=0 → facing +X → rotation.y must be -PI/2
    // angle=PI/2 → facing +Z → rotation.y must be -PI
    // Formula: rotation.y = -PI/2 - player.angle
    this.camera.position.set(player.x, 1.0, player.y);
    this.camera.rotation.y = -Math.PI / 2 - player.angle;
    this.camera.rotation.x = player.pitch;

    // Move flashlight with player — follow both yaw and pitch.
    if (this.playerLight) {
      const pitchCos = Math.cos(player.pitch);
      const dx = Math.cos(player.angle) * pitchCos;
      const dy = Math.sin(player.pitch);
      const dz = Math.sin(player.angle) * pitchCos;
      this.playerLight.position.set(player.x, 1.0, player.y);
      this.playerLight.target.position.set(
        player.x + dx * 8,
        1.0 + dy * 8,
        player.y + dz * 8,
      );
      this.playerLight.target.updateMatrixWorld();
    }

    this._updateEnemyMeshes(enemies, t);
    this._updateBotMeshes(bots, t);

    // Update particle systems
    const dt = Math.min(1 / 30, t - (this._lastT || t));
    this._lastT = t;
    this.bloodSystem.update(dt);
    this.shellSystem.update(dt);
    this.explosionSystem.update(dt);
    this.deathSystem.update(t);

    // Flicker torch lights
    this.mapRenderer.updateLights(t);

    // Main world render
    this.renderer.render(this.scene, this.camera);

    // Weapon render on top (depth clear preserves z-ordering)
    this.renderer.autoClear = false;
    this.renderer.clearDepth();
    this.renderer.render(this.weaponScene, this.weaponCamera);
    this.renderer.autoClear = true;
  }

  /**
   * Update weapon model and animate bob / recoil / reload.
   * @param {Player} player
   */
  renderWeapon(player) {
    const weapon = player.currentWeapon;
    if (!weapon) {
      return;
    }

    const ltype = (weapon.name ?? "").toLowerCase();
    if (ltype !== this._currentWeaponType) {
      this._buildWeaponModel(weapon);
    }

    const t = performance.now() / 1000;
    const aiming = !!player.isAiming;
    const bob =
      typeof player.headBob === "number" ? Math.sin(player.headBob) : 0;
    const recoil =
      typeof player.recoilOffset === "number" ? player.recoilOffset : 0;

    const gunRenderCfg = weapon.render || {};
    const [bx, by, bz] = gunRenderCfg.basePosition ?? [0.14, -0.14, -0.33];
    const [ax, ay, az] = aiming
      ? (gunRenderCfg.adsOffset ?? [0, 0, 0])
      : [0, 0, 0];
    const hipYRot = gunRenderCfg.baseRotationY ?? -0.06;
    const aimYRot = (gunRenderCfg.adsRotation ?? hipYRot) * 0.2;
    const yRot = aiming ? aimYRot : hipYRot;

    // ── Reload animation ─────────────────────────────────────────
    // reloadTime is in ms; reloadStartTime is Date.now() epoch ms
    let reloadOffsetY = 0;
    let reloadTiltZ = 0;
    let reloadTiltX = 0;
    let reloadOffsetZ = 0;

    if (weapon.isReloading && weapon.reloadTime > 0) {
      const elapsed = Date.now() - weapon.reloadStartTime; // ms
      const progress = Math.min(elapsed / weapon.reloadTime, 1.0); // 0 → 1

      // Phase 0–35 %: weapon drops + tilts (eject / mag out)
      // Phase 35–65 %: held low and tilted (magazine swap)
      // Phase 65–100 %: rises back + un-tilts and snaps (chamber)
      const easeIn = (x) => x * x;
      const easeOut = (x) => 1 - (1 - x) * (1 - x);

      if (progress < 0.35) {
        const p = easeIn(progress / 0.35);
        reloadOffsetY = -0.22 * p;
        reloadTiltZ = 0.55 * p; // tilt weapon outward
        reloadOffsetZ = 0.06 * p; // pull slightly toward player
        reloadTiltX = 0.3 * p; // angle barrel down
      } else if (progress < 0.65) {
        reloadOffsetY = -0.22;
        reloadTiltZ = 0.55;
        reloadOffsetZ = 0.06;
        reloadTiltX = 0.3;
      } else {
        const p = easeOut((progress - 0.65) / 0.35);
        reloadOffsetY = -0.22 * (1 - p);
        reloadTiltZ = 0.55 * (1 - p);
        reloadOffsetZ = 0.06 * (1 - p);
        reloadTiltX = 0.3 * (1 - p);
        // Overshoot snap at the very end
        if (p > 0.85) {
          const snap = Math.sin(((p - 0.85) / 0.15) * Math.PI) * 0.04;
          reloadOffsetY += snap;
        }
      }
    }

    // ── Apply all transforms ─────────────────────────────────────
    const bobStrength = aiming ? 0.25 : 1.0;
    this.weaponGroup.position.set(
      bx + ax + Math.cos(t * 3) * bob * 0.006 * bobStrength,
      by + ay + Math.sin(t * 6) * bob * 0.01 * bobStrength + reloadOffsetY,
      bz + az + recoil * 0.05 + reloadOffsetZ,
    );
    this.weaponGroup.rotation.x = recoil * 0.12 + reloadTiltX;
    this.weaponGroup.rotation.y = yRot;
    this.weaponGroup.rotation.z =
      Math.sin(t * 3) * bob * 0.015 * bobStrength + reloadTiltZ;
  }

  /**
   * Briefly flash the muzzle light on weapon fire.
   * @param {Object} [weapon] - Weapon instance with render/audio metadata
   */
  triggerMuzzleFlash(weapon) {
    const muzzleConfig = weapon?.render?.muzzleFlash || {};
    const intensity = muzzleConfig.intensity ?? 5.0;
    const color = muzzleConfig.color ?? 0xff9922;
    const duration = muzzleConfig.duration ?? 0.09;

    this.muzzleFlashLight.color.setHex(color);
    this.muzzleFlashLight.intensity = intensity;
    setTimeout(() => {
      this.muzzleFlashLight.intensity = 0;
    }, duration * 1000);
  }

  _onResize() {
    const w = window.innerWidth,
      h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.weaponCamera.aspect = w / h;
    this.weaponCamera.updateProjectionMatrix();
  }
}
