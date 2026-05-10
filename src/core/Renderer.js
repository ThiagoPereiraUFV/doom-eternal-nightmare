/**
 * Renderer System — Three.js 3D Edition
 * True 3D rendering with instanced geometry, 3D enemy models,
 * first-person weapon meshes, and dynamic lighting.
 * Following SRP — only rendering logic.
 */

import * as THREE from "three";
import GameConfig from "../config/GameConfig.js";

export class Renderer {
  constructor(canvas, _weaponCanvas, _resourceManager) {
    this.canvas = canvas;

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
    this.mapGroup = new THREE.Group();
    this.scene.add(this.mapGroup);

    this.enemiesGroup = new THREE.Group();
    this.scene.add(this.enemiesGroup);

    // ─── Enemy mesh tracking ──────────────────────────────────────
    this.enemyMeshes = new Map(); // enemy.id -> THREE.Group

    // ─── Death animation tracking ──────────────────────────────────
    this._dyingEnemies = []; // {mesh, startTime, duration}

    // ─── Blood particle system ─────────────────────────────────────
    this._bloodParticles = [];  // {mesh, vel, life, maxLife}
    this._bloodPoolGroup = new THREE.Group();
    this.scene.add(this._bloodPoolGroup);

    // ─── Shell casing system ───────────────────────────────────────
    this._shells = []; // {mesh, vel, angVel, life, maxLife, bounced}

    // ─── Explosion effects ─────────────────────────────────────────
    this._explosionParticles = [];

    // ─── Weapon model ─────────────────────────────────────────────
    this.weaponGroup = new THREE.Group();
    this.weaponScene.add(this.weaponGroup);
    this._currentWeaponType = null;

    // ─── Wall torch lights ────────────────────────────────────────
    this._wallLights = [];

    // ─── Muzzle flash ─────────────────────────────────────────────
    this.muzzleFlashLight = new THREE.PointLight(0xff9922, 0, 4);
    this.muzzleFlashLight.position.set(0, 0, -0.5);
    this.weaponScene.add(this.muzzleFlashLight);

    // ─── Plasma muzzle flash (blue) ────────────────────────────────
    this.plasmaMuzzleLight = new THREE.PointLight(0x00aaff, 0, 5);
    this.plasmaMuzzleLight.position.set(0, 0, -0.5);
    this.weaponScene.add(this.plasmaMuzzleLight);

    // ─── Setup ────────────────────────────────────────────────────
    this._setupLighting();
    this._buildMaterials();
    this._initBloodPool();

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
    this.playerLight = new THREE.SpotLight(0xfff0dd, 3.5, 18, Math.PI * 0.28, 0.4, 1.2);
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
  setADS(aiming) {
    const target = aiming ? 42 : 75;
    if (Math.abs(this.camera.fov - target) > 0.2) {
      this.camera.fov += (target - this.camera.fov) * 0.18;
      this.camera.updateProjectionMatrix();
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Materials & Textures
  // ═══════════════════════════════════════════════════════════════

  _buildMaterials() {
    // MeshBasicMaterial — always full texture color, no lighting math needed
    this._wallMats = {
      concrete: new THREE.MeshBasicMaterial({ map: this._wallTex("concrete") }),
      brick:    new THREE.MeshBasicMaterial({ map: this._wallTex("brick") }),
      metal:    new THREE.MeshBasicMaterial({ map: this._wallTex("metal") }),
      stone:    new THREE.MeshBasicMaterial({ map: this._wallTex("stone") }),
    };
    this._floorMat = new THREE.MeshBasicMaterial({ map: this._floorTex() });
    this._ceilMat  = new THREE.MeshBasicMaterial({ color: 0x1a1a28 });

    const lam = (hex, extra = {}) =>
      new THREE.MeshLambertMaterial({ color: hex, ...extra });
    const bas = (hex, extra = {}) =>
      new THREE.MeshBasicMaterial({ color: hex, ...extra });

    this._enemyMats = {
      demon: {
        body: lam(0xaa1100), head: lam(0xcc2200),
        eye:  bas(0xff4400), horn: lam(0x330000),
      },
      zombie: {
        body: lam(0x445533), head: lam(0x556644),
        eye:  bas(0xff0000), horn: lam(0x222222),
      },
      ghost: {
        body: new THREE.MeshLambertMaterial({
          color: 0x5599cc, transparent: true, opacity: 0.6,
          emissive: new THREE.Color(0x112233),
        }),
        head: lam(0x77bbee, { transparent: true, opacity: 0.65 }),
        eye:  bas(0x00ffff, { transparent: true, opacity: 0.9 }),
        horn: lam(0x334455),
      },
      brute: {
        body: lam(0x664422), head: lam(0x775533),
        eye:  bas(0xff2200), horn: lam(0x111111),
      },
    };

    this._wMat = {
      dark:     lam(0x1c1c1c),          // polymer frame / receiver
      metal:    lam(0x38393b),          // blued steel / iron
      bright:   lam(0x8c9098),          // stainless / bare barrel
      steel:    lam(0xb0b8be),          // polished steel / muzzle crown
      wood:     lam(0x5c3317),          // walnut stock
      tan:      lam(0x8b7355),          // desert tan / furniture
      glass:    new THREE.MeshLambertMaterial({
        color: 0x334466, transparent: true, opacity: 0.7,
      }),
      rubber:   lam(0x0f0f0f),          // grip panels / stippling
      red:      bas(0xcc1100),          // laser / dot
    };
  }

  _initBloodPool() {
    // Pre-build blood/shell materials for reuse
    this._bloodMat = new THREE.MeshBasicMaterial({ color: 0x880000, side: THREE.FrontSide });
    this._bloodDarkMat = new THREE.MeshBasicMaterial({ color: 0x440000, side: THREE.FrontSide });
    this._shellMat = new THREE.MeshLambertMaterial({ color: 0xd4a020 });
    this._shellSpentMat = new THREE.MeshLambertMaterial({ color: 0x8a6010 });
    this._plasmaSphereMat = new THREE.MeshBasicMaterial({ color: 0x00ccff, transparent: true, opacity: 0.9 });
    this._explosionMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.85 });
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
    const count = Math.round(8 * intensity + Math.random() * 6 * intensity);
    for (let i = 0; i < count; i++) {
      const size = 0.04 + Math.random() * 0.08 * intensity;
      const geo = Math.random() < 0.5
        ? new THREE.SphereGeometry(size, 4, 4)
        : new THREE.BoxGeometry(size, size * 0.4, size);
      const mat = Math.random() < 0.6 ? this._bloodMat : this._bloodDarkMat;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        wx + (Math.random() - 0.5) * 0.3,
        0.45 + Math.random() * 0.3,
        wy + (Math.random() - 0.5) * 0.3,
      );
      const speed = 0.04 + Math.random() * 0.12 * intensity;
      const hAngle = Math.random() * Math.PI * 2;
      const vAngle = Math.PI * 0.2 + Math.random() * Math.PI * 0.6;
      this.scene.add(mesh);
      this._bloodParticles.push({
        mesh,
        vel: new THREE.Vector3(
          Math.cos(hAngle) * Math.sin(vAngle) * speed,
          Math.cos(vAngle) * speed * 0.8,
          Math.sin(hAngle) * Math.sin(vAngle) * speed,
        ),
        life: 0,
        maxLife: 1.5 + Math.random() * 1.5,
        stuck: false,
      });
    }

    // Blood pool on floor
    this._spawnBloodPool(wx, wy, intensity);

    // Wall splatter: random sprays
    if (intensity >= 2) {
      this._spawnWallSplatter(wx, wy, intensity);
    }
  }

  _spawnBloodPool(wx, wy, intensity) {
    const geo = new THREE.CircleGeometry(0.1 + Math.random() * 0.15 * intensity, 8);
    const pool = new THREE.Mesh(geo, this._bloodDarkMat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(wx + (Math.random() - 0.5) * 0.4, 0.01, wy + (Math.random() - 0.5) * 0.4);
    this._bloodPoolGroup.add(pool);
    // Grow the pool over time
    pool.userData.targetScale = 0.8 + intensity * 0.6;
    pool.scale.set(0.1, 0.1, 0.1);
  }

  _spawnWallSplatter(wx, wy, intensity) {
    const count = Math.round(4 * intensity);
    for (let i = 0; i < count; i++) {
      const geo = new THREE.PlaneGeometry(0.08 + Math.random() * 0.12, 0.06 + Math.random() * 0.1);
      const splat = new THREE.Mesh(geo, this._bloodMat);
      // Place on a nearby wall face at random height
      const side = Math.floor(Math.random() * 4);
      const offsets = [[0.5, 0, 0], [-0.5, 0, 0], [0, 0, 0.5], [0, 0, -0.5]];
      const rotations = [[0, Math.PI / 2, 0], [0, -Math.PI / 2, 0], [0, 0, 0], [0, Math.PI, 0]];
      const [ox, , oz] = offsets[side];
      const [rx, ry, rz] = rotations[side];
      splat.position.set(wx + ox, 0.2 + Math.random() * 0.6, wy + oz);
      splat.rotation.set(rx, ry, rz);
      this._bloodPoolGroup.add(splat);
    }
  }

  _updateBloodParticles(dt) {
    const gravity = -0.25;
    const toRemove = [];

    for (let i = 0; i < this._bloodParticles.length; i++) {
      const p = this._bloodParticles[i];
      p.life += dt;

      if (p.stuck) {
        // Blood pools grow
        if (p.mesh.userData.growPool) {
          p.mesh.scale.multiplyScalar(1 + dt * 0.5);
          if (p.mesh.scale.x > p.mesh.userData.maxScale) { p.mesh.userData.growPool = false; }
        }
        // Fade after a while
        if (p.life > p.maxLife) {
          toRemove.push(i);
          this.scene.remove(p.mesh);
        }
        continue;
      }

      p.vel.y += gravity * dt;
      p.mesh.position.add(p.vel.clone().multiplyScalar(dt * 60));

      if (p.mesh.position.y <= 0.01) {
        p.mesh.position.y = 0.01;
        p.mesh.rotation.x = -Math.PI / 2;
        p.stuck = true;
        p.life = 0;
        p.maxLife = 8 + Math.random() * 10;
        p.mesh.userData.growPool = true;
        p.mesh.userData.maxScale = 2 + Math.random();
      }
    }

    // Remove in reverse order
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this._bloodParticles.splice(toRemove[i], 1);
    }

    // Grow blood pools
    for (const child of this._bloodPoolGroup.children) {
      if (child.userData.targetScale && child.scale.x < child.userData.targetScale) {
        const s = child.scale.x + dt * 0.4;
        child.scale.set(Math.min(s, child.userData.targetScale), Math.min(s, child.userData.targetScale), 1);
      }
    }

    // Limit total blood particles for performance
    if (this._bloodParticles.length > 200) {
      const excess = this._bloodParticles.splice(0, this._bloodParticles.length - 200);
      for (const p of excess) { this.scene.remove(p.mesh); }
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Shell Casing System
  // ─────────────────────────────────────────────────────────────────

  /**
   * Eject a shell casing from the weapon position.
   * @param {number} px - Player world X
   * @param {number} py - Player world Y
   * @param {number} angle - Player facing angle
   * @param {'pistol'|'rifle'|'shotgun'} shellType
   */
  spawnShell(px, py, angle, shellType = "pistol") {
    const isRifle = shellType === "rifle";
    const isShotgun = shellType === "shotgun";
    const r = isShotgun ? 0.018 : 0.011;
    const h = isShotgun ? 0.07 : isRifle ? 0.055 : 0.04;
    const geo = new THREE.CylinderGeometry(r, r * 0.85, h, 8);
    const mat = Math.random() < 0.5 ? this._shellMat : this._shellSpentMat;
    const mesh = new THREE.Mesh(geo, mat);

    // Spawn near camera right side
    const ejAngle = angle + Math.PI / 2;
    mesh.position.set(px + Math.cos(ejAngle) * 0.2, 0.5, py + Math.sin(ejAngle) * 0.2);

    // Random eject velocity (right + up + slightly forward)
    const speed = 0.08 + Math.random() * 0.06;
    this.scene.add(mesh);
    this._shells.push({
      mesh,
      vel: new THREE.Vector3(
        Math.cos(ejAngle) * speed + (Math.random() - 0.5) * 0.03,
        0.06 + Math.random() * 0.04,
        Math.sin(ejAngle) * speed + (Math.random() - 0.5) * 0.03,
      ),
      angVel: new THREE.Vector3(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 15,
      ),
      life: 0,
      maxLife: 4 + Math.random() * 3,
      bounces: 0,
      bounced: false,
    });
  }

  _updateShells(dt) {
    const gravity = -0.4;
    const toRemove = [];

    for (let i = 0; i < this._shells.length; i++) {
      const s = this._shells[i];
      s.life += dt;

      if (s.bounced && s.vel.length() < 0.005) {
        if (s.life > s.maxLife) {
          toRemove.push(i);
          this.scene.remove(s.mesh);
        }
        continue;
      }

      s.vel.y += gravity * dt;
      s.mesh.position.add(s.vel.clone().multiplyScalar(dt * 60));
      s.mesh.rotation.x += s.angVel.x * dt;
      s.mesh.rotation.y += s.angVel.y * dt;
      s.mesh.rotation.z += s.angVel.z * dt;

      if (s.mesh.position.y <= 0.015) {
        s.mesh.position.y = 0.015;
        if (s.bounces < 3) {
          s.vel.y = Math.abs(s.vel.y) * (0.3 + Math.random() * 0.25);
          s.vel.x *= 0.6;
          s.vel.z *= 0.6;
          s.angVel.multiplyScalar(0.5);
          s.bounces++;
          s.bounced = true;
        } else {
          s.vel.set(0, 0, 0);
          s.bounced = true;
        }
      }
    }

    for (let i = toRemove.length - 1; i >= 0; i--) {
      this._shells.splice(toRemove[i], 1);
    }

    // Limit shells for performance
    if (this._shells.length > 60) {
      const excess = this._shells.splice(0, this._shells.length - 60);
      for (const s of excess) { this.scene.remove(s.mesh); }
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Explosion Effect
  // ─────────────────────────────────────────────────────────────────

  spawnExplosion(wx, wy) {
    const count = 20;
    for (let i = 0; i < count; i++) {
      const size = 0.08 + Math.random() * 0.18;
      const geo = new THREE.SphereGeometry(size, 4, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: i < count / 2 ? 0xff6600 : 0xffcc00,
        transparent: true, opacity: 0.9,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(wx + (Math.random() - 0.5) * 0.5, 0.3 + Math.random() * 0.6, wy + (Math.random() - 0.5) * 0.5);
      const speed = 0.08 + Math.random() * 0.15;
      const ang = Math.random() * Math.PI * 2;
      this.scene.add(mesh);
      this._explosionParticles.push({
        mesh, mat,
        vel: new THREE.Vector3(Math.cos(ang) * speed, 0.05 + Math.random() * 0.1, Math.sin(ang) * speed),
        life: 0, maxLife: 0.6 + Math.random() * 0.3,
      });
    }
    // Large flash point light
    const flash = new THREE.PointLight(0xff8800, 8, 12);
    flash.position.set(wx, 0.5, wy);
    this.scene.add(flash);
    setTimeout(() => this.scene.remove(flash), 200);
  }

  _updateExplosions(dt) {
    const toRemove = [];
    for (let i = 0; i < this._explosionParticles.length; i++) {
      const p = this._explosionParticles[i];
      p.life += dt;
      const ratio = p.life / p.maxLife;
      p.vel.y -= 0.15 * dt;
      p.mesh.position.add(p.vel.clone().multiplyScalar(dt * 60));
      p.mat.opacity = Math.max(0, 0.9 - ratio * 0.9);
      if (p.life >= p.maxLife) {
        toRemove.push(i);
        this.scene.remove(p.mesh);
      }
    }
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this._explosionParticles.splice(toRemove[i], 1);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Death animations
  // ─────────────────────────────────────────────────────────────────

  /**
   * Start a death-fall animation for an enemy mesh.
   * @param {THREE.Group} mesh
   */
  startDeathAnimation(mesh) {
    if (!mesh) { return; }
    this._dyingEnemies.push({
      mesh,
      startTime: performance.now() / 1000,
      duration: 1.2,
      startY: mesh.position.y,
      rotDir: Math.random() < 0.5 ? 1 : -1,
      rotAxis: Math.random() < 0.5 ? 'x' : 'z',
    });
  }

  _updateDeathAnimations(t) {
    const toRemove = [];
    for (let i = 0; i < this._dyingEnemies.length; i++) {
      const d = this._dyingEnemies[i];
      const elapsed = t - d.startTime;
      const progress = Math.min(elapsed / d.duration, 1.0);
      const ease = progress * progress;

      d.mesh.position.y = d.startY - ease * 0.55;
      d.mesh.rotation[d.rotAxis] = d.rotDir * ease * (Math.PI / 2);
      // Flatten to ground
      if (progress >= 1.0) {
        toRemove.push(i);
        this.scene.remove(d.mesh);
      }
    }
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this._dyingEnemies.splice(toRemove[i], 1);
    }
  }

  _wallTex(type) {
    const S = 256;
    const cv = document.createElement("canvas");
    cv.width = cv.height = S;
    const ctx = cv.getContext("2d");
    const bases = { concrete: "#5a5a5a", brick: "#8b4513", metal: "#445566", stone: "#565548" };
    ctx.fillStyle = bases[type];
    ctx.fillRect(0, 0, S, S);

    if (type === "brick") {
      const bh = 28, bw = 56;
      for (let row = 0; row < S / bh; row++) {
        const off = (row % 2) * (bw / 2);
        ctx.strokeStyle = "rgba(35,15,5,0.9)";
        ctx.lineWidth = 3;
        for (let col = -1; col <= S / bw + 1; col++)
          { ctx.strokeRect(col * bw + off + 1.5, row * bh + 1.5, bw - 3, bh - 3); }
      }
      ctx.globalCompositeOperation = "multiply";
      for (let row = 0; row < S / bh; row++) {
        const off = (row % 2) * (bw / 2);
        for (let col = -1; col <= S / bw + 1; col++) {
          const v = 0.8 + Math.random() * 0.4;
          ctx.fillStyle = `rgba(${~~(255 * v)},${~~(150 * v)},${~~(80 * v)},0.5)`;
          ctx.fillRect(col * bw + off + 2, row * bh + 2, bw - 4, bh - 4);
        }
      }
      ctx.globalCompositeOperation = "source-over";
    } else if (type === "concrete") {
      ctx.strokeStyle = "rgba(0,0,0,0.18)"; ctx.lineWidth = 1;
      for (let i = 0; i < 50; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * S, Math.random() * S);
        ctx.lineTo(Math.random() * S, Math.random() * S);
        ctx.stroke();
      }
    } else if (type === "metal") {
      ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 2;
      for (let y = 0; y <= S; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(S, y); ctx.stroke(); }
      for (let x = 0; x <= S; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, S); ctx.stroke(); }
      ctx.fillStyle = "rgba(180,190,210,0.7)";
      for (let y = 32; y < S; y += 64)
        { for (let x = 32; x < S; x += 64) {
          ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
        } }
    } else if (type === "stone") {
      ctx.strokeStyle = "rgba(20,18,10,0.9)"; ctx.lineWidth = 3;
      for (let row = 0; row < 7; row++) {
        const off = (row % 2) * 34;
        for (let col = -1; col < 6; col++)
          { ctx.strokeRect(col * 54 + off + 3, row * 40 + 3, 48, 34); }
      }
    }

    const id = ctx.getImageData(0, 0, S, S);
    for (let i = 0; i < id.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 22;
      id.data[i]   = Math.max(0, Math.min(255, id.data[i]   + n));
      id.data[i+1] = Math.max(0, Math.min(255, id.data[i+1] + n));
      id.data[i+2] = Math.max(0, Math.min(255, id.data[i+2] + n));
    }
    ctx.putImageData(id, 0, 0);
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  _floorTex() {
    const S = 256;
    const cv = document.createElement("canvas");
    cv.width = cv.height = S;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#2a2a28";
    ctx.fillRect(0, 0, S, S);
    const ts = 64;
    ctx.strokeStyle = "rgba(0,0,0,0.65)"; ctx.lineWidth = 2;
    for (let y = 0; y < S; y += ts)
      { for (let x = 0; x < S; x += ts)
        { ctx.strokeRect(x + 1, y + 1, ts - 2, ts - 2); } }
    const id = ctx.getImageData(0, 0, S, S);
    for (let i = 0; i < id.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 16;
      id.data[i] = id.data[i+1] = id.data[i+2] =
        Math.max(0, Math.min(255, id.data[i] + n));
    }
    ctx.putImageData(id, 0, 0);
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
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
    this.mapGroup.clear();
    for (const { light } of this._wallLights) { this.scene.remove(light); }
    this._wallLights = [];

    const rows = map.length;
    const cols = map[0].length;
    const WALL_H = 1.0;
    const typeNames = ["", "concrete", "brick", "metal", "stone"];

    // Floor
    const floorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(cols, rows),
      this._floorMat,
    );
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(cols / 2, 0, rows / 2);
    floorMesh.receiveShadow = true;
    this.mapGroup.add(floorMesh);

    // Ceiling
    const ceilMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(cols, rows),
      this._ceilMat,
    );
    ceilMesh.rotation.x = Math.PI / 2;
    ceilMesh.position.set(cols / 2, WALL_H, rows / 2);
    this.mapGroup.add(ceilMesh);

    // Collect wall instances per type
    const buckets = { concrete: [], brick: [], metal: [], stone: [] };
    const dummy = new THREE.Object3D();

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tile = map[row][col];
        if (!tile) { continue; }
        const name = typeNames[tile] || "concrete";
        buckets[name].push({ col, row });

        // Torch lights on ~3 % of walls
        if (Math.random() < 0.03) {
          const palette = [0xff6600, 0xff4400, 0xff8800, 0xffaa00];
          const color = palette[Math.floor(Math.random() * palette.length)];
          const light = new THREE.PointLight(color, 1.4, 5.5);
          light.position.set(col + 0.5, WALL_H * 0.6, row + 0.5);
          this.scene.add(light);
          this._wallLights.push({ light, base: 1.4 });
        }
      }
    }

    const baseGeo = new THREE.BoxGeometry(1, WALL_H, 1);
    for (const [typeName, walls] of Object.entries(buckets)) {
      if (!walls.length) { continue; }
      const instanced = new THREE.InstancedMesh(
        baseGeo,
        this._wallMats[typeName],
        walls.length,
      );
      instanced.castShadow = true;
      instanced.receiveShadow = true;
      walls.forEach(({ col, row }, i) => {
        dummy.position.set(col + 0.5, WALL_H / 2, row + 0.5);
        dummy.updateMatrix();
        instanced.setMatrixAt(i, dummy.matrix);
      });
      instanced.instanceMatrix.needsUpdate = true;
      this.mapGroup.add(instanced);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Enemy 3D Models
  // ═══════════════════════════════════════════════════════════════

  _createEnemyMesh(enemy) {
    const g = new THREE.Group();
    const mats = this._enemyMats[enemy.type] ?? this._enemyMats.demon;
    const { body: bM, head: hM, eye: eM, horn: hornM } = mats;

    const box = (w, h, d, mat, px, py, pz, rx = 0, ry = 0, rz = 0) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(px, py, pz);
      m.rotation.set(rx, ry, rz);
      m.castShadow = true;
      g.add(m);
      return m;
    };
    const sphere = (r, mat, px, py, pz, segs = 10) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, segs, segs), mat);
      m.position.set(px, py, pz);
      m.castShadow = true;
      g.add(m);
      return m;
    };
    const cone = (r, h, mat, px, py, pz, rx = 0, ry = 0, rz = 0) => {
      const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 8), mat);
      m.position.set(px, py, pz);
      m.rotation.set(rx, ry, rz);
      g.add(m);
      return m;
    };

    if (enemy.type === "ghost") {
      // Detailed ghost: ethereal form with trailing wisp tails
      const body = sphere(0.26, bM, 0, 0.65, 0, 12);
      // Face features
      sphere(0.07, eM, -0.1, 0.70, 0.22);
      sphere(0.07, eM,  0.1, 0.70, 0.22);
      sphere(0.04, eM, -0.05, 0.63, 0.24);
      sphere(0.04, eM,  0.05, 0.63, 0.24);
      sphere(0.03, eM,  0.00, 0.63, 0.25); // mouth
      // Trailing body segments
      const seg1 = sphere(0.2, bM, 0, 0.42, 0, 10);
      const seg2 = sphere(0.14, bM, 0, 0.24, 0, 8);
      const seg3 = sphere(0.08, bM, 0, 0.11, 0, 6);
      // Arm wisps
      const wL = sphere(0.1, bM,  -0.34, 0.55, 0.05, 7);
      const wR = sphere(0.1, bM,   0.34, 0.55, 0.05, 7);
      const wL2 = sphere(0.07, bM, -0.44, 0.50, 0.08, 6);
      const wR2 = sphere(0.07, bM,  0.44, 0.50, 0.08, 6);
      g.userData.animate = (t) => {
        body.position.y = 0.65 + Math.sin(t * 1.8) * 0.1;
        seg1.position.y = 0.42 + Math.sin(t * 1.8 + 0.3) * 0.08;
        seg2.position.y = 0.24 + Math.sin(t * 1.8 + 0.6) * 0.06;
        seg3.position.y = 0.11 + Math.sin(t * 1.8 + 0.9) * 0.04;
        wL.position.set( -0.34 + Math.sin(t * 2.2) * 0.08, 0.55 + Math.cos(t * 2.2) * 0.06, 0.05);
        wR.position.set(  0.34 + Math.sin(t * 2.2 + 1) * 0.08, 0.55 + Math.cos(t * 2.2 + 1) * 0.06, 0.05);
        wL2.position.set(-0.44 + Math.sin(t * 2.6) * 0.1, 0.50 + Math.cos(t * 2.6) * 0.08, 0.08);
        wR2.position.set( 0.44 + Math.sin(t * 2.6 + 1) * 0.1, 0.50 + Math.cos(t * 2.6 + 1) * 0.08, 0.08);
        // Pulsing opacity
        if (bM.transparent) { bM.opacity = 0.5 + Math.sin(t * 2.2) * 0.15; }
      };

    } else if (enemy.type === "brute") {
      // Massive detailed brute: huge torso, thick limbs, hunched
      // Torso - multi-part for muscle definition
      box(0.70, 0.45, 0.48, bM,   0,     0.68, 0);   // lower torso
      box(0.64, 0.42, 0.44, bM,   0,     1.04, 0);   // upper torso
      box(0.58, 0.22, 0.40, hM,   0,     1.36, 0);   // neck/trap area
      // Pecs
      box(0.30, 0.16, 0.18, bM,  -0.2,  1.08, -0.22);
      box(0.30, 0.16, 0.18, bM,   0.2,  1.08, -0.22);
      // Head - massive and brutish
      sphere(0.26, hM,  0, 1.68, 0, 12);
      sphere(0.18, hM,  0, 1.55, 0.18, 10); // jaw protrusion
      // Eyes deep set
      sphere(0.07, eM, -0.12, 1.72, 0.20, 8);
      sphere(0.07, eM,  0.12, 1.72, 0.20, 8);
      // Brow ridge
      box(0.38, 0.06, 0.08, hornM, 0, 1.80, 0.16);
      // Horns - curved with multiple segments
      cone(0.06, 0.28, hornM, -0.22, 1.92, 0.04,  0, 0, -0.35);
      cone(0.04, 0.14, hornM, -0.34, 2.08, 0.02,  0, 0, -0.55);
      cone(0.06, 0.28, hornM,  0.22, 1.92, 0.04,  0, 0,  0.35);
      cone(0.04, 0.14, hornM,  0.34, 2.08, 0.02,  0, 0,  0.55);
      // Arms - massive, angled outward
      const aUpperL = box(0.28, 0.55, 0.28, bM, -0.56, 0.96, 0, 0, 0,  0.28);
      const aForeL  = box(0.24, 0.48, 0.24, bM, -0.70, 0.52, 0, 0, 0,  0.15);
      const handL   = sphere(0.16, bM, -0.78, 0.24, 0, 7);
      const aUpperR = box(0.28, 0.55, 0.28, bM,  0.56, 0.96, 0, 0, 0, -0.28);
      const aForeR  = box(0.24, 0.48, 0.24, bM,  0.70, 0.52, 0, 0, 0, -0.15);
      const handR   = sphere(0.16, bM,  0.78, 0.24, 0, 7);
      // Legs - thick, short
      const lL = box(0.30, 0.52, 0.30, bM, -0.24, 0.26, 0);
      const lR = box(0.30, 0.52, 0.30, bM,  0.24, 0.26, 0);
      // Feet
      box(0.30, 0.10, 0.38, bM, -0.24, 0.02, -0.06);
      box(0.30, 0.10, 0.38, bM,  0.24, 0.02, -0.06);
      // Spinal ridge bumps
      for (let i = 0; i < 5; i++) {
        sphere(0.05, hornM, 0, 0.70 + i * 0.14, -0.24, 6);
      }
      g.userData.animate = (t) => {
        lL.rotation.x = Math.sin(t * 2.8) * 0.38;
        lR.rotation.x = Math.sin(t * 2.8 + Math.PI) * 0.38;
        aUpperL.rotation.x = Math.sin(t * 2.8 + Math.PI) * 0.22;
        aUpperR.rotation.x = Math.sin(t * 2.8) * 0.22;
        aForeL.rotation.x = Math.sin(t * 2.8) * 0.18;
        aForeR.rotation.x = Math.sin(t * 2.8 + Math.PI) * 0.18;
        handL.position.y = 0.24 + Math.sin(t * 2.8 + 0.5) * 0.04;
        handR.position.y = 0.24 + Math.sin(t * 2.8 + Math.PI + 0.5) * 0.04;
      };

    } else if (enemy.type === "zombie") {
      // Detailed zombie: ragged clothes, visible wounds, lopsided walk
      // Torso: tattered clothing layered look
      box(0.36, 0.62, 0.24, bM,   0,   0.50, 0);    // main body
      box(0.30, 0.20, 0.18, hM,   0,   0.82, 0.02); // shirt collar area
      box(0.38, 0.12, 0.26, bM,   0,   0.32, 0);    // belt/waist
      // Wound detail (darker patch)
      box(0.14, 0.10, 0.04, hornM, -0.08, 0.58, -0.12);
      // Head with rotted features
      sphere(0.22, hM, 0, 0.95, 0, 10);
      sphere(0.15, bM, 0, 0.85, 0.14, 8);  // sunken cheek
      // Jaw detail
      box(0.18, 0.07, 0.14, hornM, 0, 0.78, 0.16);
      // Eyes sunken
      sphere(0.048, eM, -0.09, 0.98, 0.18, 7);
      sphere(0.048, eM,  0.09, 0.98, 0.18, 7);
      // Exposed skull patches
      sphere(0.05, hornM, -0.16, 1.04, -0.06, 5);
      sphere(0.04, hornM,  0.18, 1.06, -0.04, 5);
      // Arms: one outstretched, one hanging
      const aUpperL = box(0.14, 0.52, 0.14, bM, -0.28, 0.62, 0.14, -0.9, 0, 0);
      const aForeL  = box(0.12, 0.45, 0.12, bM, -0.28, 0.98, 0.38, -0.95, 0, 0.05);
      sphere(0.09, bM, -0.28, 1.20, 0.52, 6);
      const aUpperR = box(0.14, 0.52, 0.14, bM,  0.28, 0.58, 0.04, 0.12, 0, 0.05);
      const aForeR  = box(0.12, 0.45, 0.12, bM,  0.28, 0.18, 0.04, 0.06, 0, 0);
      sphere(0.09, bM, 0.28, -0.06, 0.04, 6);
      // Legs: lopsided
      const lL = box(0.16, 0.50, 0.16, bM, -0.12, 0.25, 0);
      const lR = box(0.16, 0.50, 0.16, bM,  0.12, 0.25, 0);
      // Feet with visible bones
      box(0.14, 0.06, 0.22, bM, -0.12, 0.01, -0.04);
      box(0.14, 0.06, 0.22, bM,  0.12, 0.01, -0.04);
      sphere(0.045, hornM, -0.12, 0.06, -0.14, 5);  // toe bone
      sphere(0.045, hornM,  0.12, 0.06, -0.14, 5);
      g.userData.animate = (t) => {
        lL.rotation.x = Math.sin(t * 2.8) * 0.32;
        lR.rotation.x = Math.sin(t * 2.8 + Math.PI) * 0.32;
        // Lopsided gait: zombie lurches
        aUpperL.rotation.x = -0.9 + Math.sin(t * 2.8) * 0.25;
        aForeL.rotation.x  = -0.95 + Math.sin(t * 2.8 + 0.4) * 0.2;
        aUpperR.rotation.x = 0.12 + Math.sin(t * 2.8 + Math.PI) * 0.1;
        aForeR.rotation.x  = 0.06 + Math.sin(t * 2.8 + Math.PI + 0.3) * 0.08;
      };

    } else {
      // ── Demon (default) ── More detailed: muscular, clawed, menacing
      // Abdomen
      box(0.42, 0.30, 0.32, bM,  0, 0.32, 0);
      // Main torso - wider at chest
      box(0.48, 0.42, 0.36, bM,  0, 0.60, 0);
      // Chest muscle definition
      box(0.20, 0.18, 0.14, bM, -0.16, 0.66, -0.18);
      box(0.20, 0.18, 0.14, bM,  0.16, 0.66, -0.18);
      // Shoulders - wide and spiked
      sphere(0.16, bM, -0.36, 0.84, 0, 8);
      sphere(0.16, bM,  0.36, 0.84, 0, 8);
      // Shoulder spikes
      cone(0.05, 0.18, hornM, -0.40, 0.98, 0, 0, 0, -0.4);
      cone(0.05, 0.18, hornM,  0.40, 0.98, 0, 0, 0,  0.4);
      // Head - angular and demonic
      sphere(0.22, hM, 0, 1.06, 0, 10);
      box(0.26, 0.10, 0.22, hM, 0, 0.92, 0.10); // heavy jaw
      // Snout
      box(0.16, 0.10, 0.14, hM, 0, 0.94, 0.20);
      // Eyes - glowing with orbital ridge
      box(0.20, 0.04, 0.06, hornM, 0, 1.12, 0.18); // brow ridge
      sphere(0.055, eM, -0.09, 1.08, 0.21, 8);
      sphere(0.055, eM,  0.09, 1.08, 0.21, 8);
      // Horns - branched
      cone(0.05, 0.22, hornM, -0.14, 1.22, 0, 0, 0, -0.4);
      cone(0.04, 0.12, hornM, -0.22, 1.36, 0, 0, 0, -0.6);
      cone(0.05, 0.22, hornM,  0.14, 1.22, 0, 0, 0,  0.4);
      cone(0.04, 0.12, hornM,  0.22, 1.36, 0, 0, 0,  0.6);
      // Spine ridge
      for (let i = 0; i < 4; i++) {
        cone(0.04, 0.12, hornM, 0, 0.40 + i * 0.16, -0.18, -0.4);
      }
      // Arms with forearm + hand
      const aUpperL = box(0.18, 0.44, 0.18, bM, -0.36, 0.64, 0);
      const aForeL  = box(0.16, 0.38, 0.16, bM, -0.36, 0.28, 0);
      const clawL1  = box(0.04, 0.14, 0.04, hornM, -0.30, 0.06, -0.06, -0.3);
      const clawL2  = box(0.04, 0.14, 0.04, hornM, -0.36, 0.05, -0.08, -0.3);
      const clawL3  = box(0.04, 0.14, 0.04, hornM, -0.42, 0.06, -0.06, -0.3);
      const aUpperR = box(0.18, 0.44, 0.18, bM,  0.36, 0.64, 0);
      const aForeR  = box(0.16, 0.38, 0.16, bM,  0.36, 0.28, 0);
      const clawR1  = box(0.04, 0.14, 0.04, hornM,  0.30, 0.06, -0.06, -0.3);
      const clawR2  = box(0.04, 0.14, 0.04, hornM,  0.36, 0.05, -0.08, -0.3);
      const clawR3  = box(0.04, 0.14, 0.04, hornM,  0.42, 0.06, -0.06, -0.3);
      // Legs with digitigrade stance
      const lL = box(0.20, 0.44, 0.20, bM, -0.18, 0.28, 0.04);
      const lR = box(0.20, 0.44, 0.20, bM,  0.18, 0.28, 0.04);
      // Lower legs angled back
      const llL = box(0.16, 0.30, 0.16, bM, -0.18, 0.06, 0.10, 0.5);
      const llR = box(0.16, 0.30, 0.16, bM,  0.18, 0.06, 0.10, 0.5);
      // Feet/claws
      box(0.18, 0.05, 0.28, bM, -0.18, -0.04, 0.04);
      box(0.18, 0.05, 0.28, bM,  0.18, -0.04, 0.04);
      g.userData.animate = (t) => {
        lL.rotation.x = Math.sin(t * 4.5) * 0.44;
        lR.rotation.x = Math.sin(t * 4.5 + Math.PI) * 0.44;
        llL.rotation.x = 0.5 + Math.sin(t * 4.5) * 0.22;
        llR.rotation.x = 0.5 + Math.sin(t * 4.5 + Math.PI) * 0.22;
        aUpperL.rotation.x = Math.sin(t * 4.5 + Math.PI) * 0.32;
        aUpperR.rotation.x = Math.sin(t * 4.5) * 0.32;
        aForeL.rotation.x  = Math.sin(t * 4.5 + 0.5) * 0.2;
        aForeR.rotation.x  = Math.sin(t * 4.5 + Math.PI + 0.5) * 0.2;
        // Claw rattle
        const clawSwing = Math.sin(t * 9) * 0.08;
        clawL1.rotation.x = -0.3 + clawSwing;
        clawL2.rotation.x = -0.3 + clawSwing * 0.8;
        clawL3.rotation.x = -0.3 + clawSwing * 1.2;
        clawR1.rotation.x = -0.3 - clawSwing;
        clawR2.rotation.x = -0.3 - clawSwing * 0.8;
        clawR3.rotation.x = -0.3 - clawSwing * 1.2;
      };
    }

    g.userData.hitFlashTimer = 0;
    return g;
  }

  // ═══════════════════════════════════════════════════════════════
  // Weapon 3D Models
  // ═══════════════════════════════════════════════════════════════

  _buildWeaponModel(type) {
    this.weaponGroup.clear();
    const m = this._wMat;

    // Helper: add a BoxGeometry mesh to weaponGroup
    const addBox = (w, h, d, mat, px, py, pz, rx = 0, ry = 0, rz = 0) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      mesh.position.set(px, py, pz);
      mesh.rotation.set(rx, ry, rz);
      this.weaponGroup.add(mesh);
      return mesh;
    };
    // Helper: add a CylinderGeometry mesh (rx rotates barrel to horizontal)
    const addCyl = (rt, rb, h, mat, px, py, pz, rx = 0) => {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(rt, rb, h, 12),
        mat,
      );
      mesh.position.set(px, py, pz);
      mesh.rotation.x = rx;
      this.weaponGroup.add(mesh);
      return mesh;
    };

    const ltype = (type ?? "").toLowerCase();

    // ─── PISTOL — Glock-style polymer striker pistol ───────────────
    if (ltype === "pistol") {
      // Slide: flat-top, wider than frame, runs full length
      addBox(0.072, 0.052, 0.310, m.metal,  0,        0.006,  -0.018);
      // Slide serration grooves (rear half — visible grip ridges)
      addBox(0.076, 0.056, 0.004, m.dark,   0,        0.006,   0.085);
      addBox(0.076, 0.056, 0.004, m.dark,   0,        0.006,   0.065);
      addBox(0.076, 0.056, 0.004, m.dark,   0,        0.006,   0.045);
      // Barrel — stainless, protruding forward of slide
      addCyl(0.019, 0.019, 0.095, m.steel,  0,        0.003,  -0.218, Math.PI / 2);
      // Barrel bushing collar ring
      addCyl(0.026, 0.026, 0.009, m.bright, 0,        0.003,  -0.176, Math.PI / 2);
      // Frame / receiver — polymer, slightly narrower and lower
      addBox(0.062, 0.036, 0.260, m.dark,   0,       -0.034,  -0.005);
      // Dust cover (forward frame section below barrel)
      addBox(0.060, 0.024, 0.044, m.dark,   0,       -0.034,  -0.140);
      // Trigger guard — thin loop approximation
      addBox(0.058, 0.007, 0.082, m.dark,   0,       -0.057,   0.018);  // bottom rail
      addBox(0.058, 0.024, 0.007, m.dark,   0,       -0.047,  -0.022);  // front vertical
      // Trigger — small finger-shaped tab
      addBox(0.008, 0.022, 0.013, m.bright, 0,       -0.048,   0.013);
      // Grip — backstrap angled rearward
      addBox(0.058, 0.116, 0.090, m.rubber, 0,       -0.111,   0.091,  0.20);
      // Magazine floor plate (protrudes slightly below grip)
      addBox(0.052, 0.008, 0.072, m.metal,  0,       -0.172,   0.086,  0.20);
      // Front sight post
      addBox(0.006, 0.013, 0.005, m.steel,  0,        0.038,  -0.175);
      // Rear sight U-notch
      addBox(0.024, 0.009, 0.005, m.steel,  0,        0.036,   0.085);

    // ─── SHOTGUN — Mossberg 500 pump-action ───────────────────────
    } else if (ltype === "shotgun") {
      // Main barrel — single wide bore tube
      addCyl(0.034, 0.034, 0.640, m.bright, 0,        0.040,  -0.260, Math.PI / 2);
      // Barrel rib (flat sight rib on top of barrel)
      addBox(0.012, 0.006, 0.640, m.steel,  0,        0.074,  -0.260);
      // Front bead sight (tiny sphere approximated as small box)
      addBox(0.012, 0.012, 0.012, m.steel,  0,        0.082,  -0.580);
      // Magazine tube (below barrel, runs most of barrel length)
      addCyl(0.022, 0.022, 0.530, m.metal,  0,        0.006,  -0.205, Math.PI / 2);
      // Pump forend — wider, textured section on magazine tube
      addCyl(0.030, 0.030, 0.130, m.wood,   0,        0.006,  -0.310, Math.PI / 2);
      addBox(0.064, 0.030, 0.120, m.wood,   0,        0.005,  -0.310);  // flat bottom grip surface
      // Receiver — the action housing
      addBox(0.100, 0.096, 0.200, m.dark,   0,        0.010,   0.030);
      // Ejection port (bright slit on right of receiver)
      addBox(0.006, 0.038, 0.090, m.bright, 0.052,    0.022,   0.018);
      // Safety button on top of receiver
      addBox(0.018, 0.010, 0.018, m.metal,  0,        0.062,   0.010);
      // Stock — straight Monte Carlo style
      addBox(0.076, 0.076, 0.310, m.wood,   0,        0.006,   0.235, -0.07);
      // Recoil pad (rubber end of stock)
      addBox(0.078, 0.082, 0.014, m.rubber, 0,        0.005,   0.394, -0.07);
      // Trigger guard + trigger
      addBox(0.060, 0.008, 0.090, m.metal,  0,       -0.046,   0.050);
      addBox(0.010, 0.026, 0.012, m.metal,  0,       -0.040,   0.042);

    // ─── RIFLE — AR-15 / M4 carbine ──────────────────────────────
    } else if (ltype === "rifle") {
      // Barrel — free-floating, government profile (thicker at chamber)
      addCyl(0.018, 0.016, 0.560, m.bright, 0,        0.010,  -0.430, Math.PI / 2);
      addCyl(0.022, 0.018, 0.060, m.bright, 0,        0.010,  -0.180, Math.PI / 2);  // barrel step
      // Flash hider / A2 birdcage (3 slots)
      addCyl(0.024, 0.024, 0.044, m.metal,  0,        0.010,  -0.685, Math.PI / 2);
      addBox(0.006, 0.050, 0.044, m.dark,   0,        0.010,  -0.685);  // slot cut
      // Handguard — M-LOK / KeyMod profile (5-sided approximation)
      addBox(0.058, 0.058, 0.300, m.dark,   0,        0.010,  -0.270);
      addBox(0.062, 0.014, 0.300, m.metal,  0,        0.042,  -0.270);  // top rail
      addBox(0.062, 0.014, 0.300, m.dark,   0,       -0.042,  -0.270);  // bottom rail
      // M-LOK slots (decorative cuts)
      addBox(0.064, 0.010, 0.030, m.metal,  0,        0.010,  -0.200);
      addBox(0.064, 0.010, 0.030, m.metal,  0,        0.010,  -0.310);
      // Upper receiver — flat top with Picatinny rail
      addBox(0.068, 0.062, 0.200, m.dark,   0,        0.010,   0.000);
      addBox(0.072, 0.012, 0.200, m.metal,  0,        0.048,   0.000);  // top rail
      // Charging handle (small T-handle at rear of upper)
      addBox(0.042, 0.016, 0.020, m.metal,  0,        0.050,   0.090);
      addBox(0.008, 0.032, 0.008, m.metal,  0,        0.058,   0.090);  // T-part
      // Carry handle / rear iron sight (low profile BUIS)
      addBox(0.030, 0.030, 0.032, m.metal,  0,        0.072,  -0.005);
      addBox(0.006, 0.012, 0.005, m.steel,  0,        0.090,  -0.005);  // aperture
      // Lower receiver
      addBox(0.068, 0.058, 0.160, m.dark,   0,       -0.026,   0.025);
      // Trigger guard
      addBox(0.060, 0.007, 0.080, m.metal,  0,       -0.062,   0.055);
      addBox(0.060, 0.024, 0.007, m.metal,  0,       -0.052,   0.019);
      // Pistol grip — A2 style, angled
      addBox(0.046, 0.110, 0.072, m.rubber, 0,       -0.096,   0.072,  0.20);
      // Magazine — 30-round STANAG, slight forward tilt
      addBox(0.050, 0.140, 0.072, m.dark,   0,       -0.096,  -0.018, -0.05);
      addBox(0.052, 0.010, 0.064, m.metal,  0,       -0.168,  -0.018, -0.05);  // mag floor plate
      // Buffer tube / stock — collapsible
      addBox(0.044, 0.044, 0.200, m.metal,  0,       -0.008,   0.135);
      // Stock — 6-position collapsible style
      addBox(0.072, 0.072, 0.120, m.dark,   0,       -0.006,   0.230);
      addBox(0.076, 0.014, 0.120, m.rubber, 0,       -0.038,   0.230);  // cheekweld
      // Front sight post (gas block / FSB style)
      addBox(0.018, 0.018, 0.018, m.metal,  0,        0.010,  -0.420);
      addBox(0.006, 0.016, 0.005, m.steel,  0,        0.025,  -0.420);  // post

    // ─── SMG — MP5-style compact submachine gun ───────────────────
    } else if (ltype === "smg") {
      // Barrel — short, slightly threaded end
      addCyl(0.014, 0.014, 0.220, m.bright, 0,  0.006, -0.220, Math.PI / 2);
      addCyl(0.018, 0.018, 0.022, m.metal,  0,  0.006, -0.332, Math.PI / 2); // end cap
      // Upper receiver
      addBox(0.058, 0.058, 0.230, m.dark,   0,  0.012,  0.000);
      addBox(0.062, 0.010, 0.230, m.metal,  0,  0.044,  0.000); // top rail
      // Charging handle
      addBox(0.016, 0.016, 0.020, m.metal,  0,  0.052,  0.055);
      // Front sight tower
      addBox(0.010, 0.032, 0.012, m.metal,  0,  0.044, -0.210);
      addBox(0.004, 0.010, 0.004, m.steel,  0,  0.060, -0.210);
      // Rear diopter sight
      addBox(0.022, 0.014, 0.010, m.metal,  0,  0.044,  0.090);
      // Lower receiver
      addBox(0.056, 0.044, 0.200, m.dark,   0, -0.020,  0.010);
      // Trigger group
      addBox(0.052, 0.008, 0.070, m.metal,  0, -0.050,  0.042);
      addBox(0.010, 0.022, 0.010, m.bright, 0, -0.044,  0.034);
      // Handguard — polymer ribbed
      addBox(0.048, 0.048, 0.140, m.dark,   0, -0.008, -0.140);
      addBox(0.050, 0.010, 0.140, m.metal,  0,  0.028, -0.140); // rib top
      // Magazine — box mag, forward-tilted
      addBox(0.044, 0.130, 0.058, m.dark,   0, -0.074, -0.044, -0.08);
      addBox(0.046, 0.008, 0.050, m.metal,  0, -0.136, -0.044, -0.08);
      // Stock — folding polymer
      addBox(0.040, 0.040, 0.180, m.dark,   0, -0.005,  0.170);
      addBox(0.042, 0.038, 0.060, m.rubber, 0, -0.005,  0.270);
      // Pistol grip
      addBox(0.044, 0.095, 0.066, m.rubber, 0, -0.072,  0.068,  0.18);
      addBox(0.046, 0.008, 0.058, m.metal,  0, -0.120,  0.064,  0.18);

    // ─── SNIPER — Bolt-action precision rifle (Remington 700 style) ───
    } else if (ltype === "sniper") {
      // Long heavy barrel with fluted profile
      addCyl(0.018, 0.015, 0.720, m.bright, 0,  0.014, -0.520, Math.PI / 2);
      addCyl(0.024, 0.020, 0.080, m.bright, 0,  0.014, -0.180, Math.PI / 2); // barrel step near receiver
      // Muzzle brake — slotted
      addCyl(0.026, 0.026, 0.050, m.metal,  0,  0.014, -0.876, Math.PI / 2);
      addBox(0.006, 0.036, 0.050, m.dark,   0,  0.014, -0.876); // slot
      // Barrel flutes (visual)
      for (let fi = 0; fi < 5; fi++) {
        addBox(0.006, 0.022, 0.560, m.metal, 0, 0.014 + Math.sin(fi * 1.26) * 0.012, -0.460);
      }
      // Receiver — large action body
      addBox(0.078, 0.082, 0.240, m.dark,   0,  0.016,  0.010);
      addBox(0.082, 0.012, 0.240, m.metal,  0,  0.064,  0.010); // flat top rail
      // Scope base rings
      addBox(0.090, 0.018, 0.036, m.metal,  0,  0.074, -0.050);
      addBox(0.090, 0.018, 0.036, m.metal,  0,  0.074,  0.060);
      // Scope body — large magnification scope
      addCyl(0.030, 0.030, 0.310, m.dark,   0,  0.100,  0.005, Math.PI / 2);
      addCyl(0.024, 0.024, 0.120, m.dark,   0,  0.100, -0.190, Math.PI / 2); // objective bell
      addCyl(0.034, 0.034, 0.080, m.dark,   0,  0.100, -0.240, Math.PI / 2); // obj bell flare
      addCyl(0.024, 0.024, 0.080, m.dark,   0,  0.100,  0.200, Math.PI / 2); // eyepiece
      addCyl(0.028, 0.028, 0.036, m.dark,   0,  0.100,  0.245, Math.PI / 2); // eyepiece flare
      // Turrets on scope
      addCyl(0.012, 0.012, 0.032, m.metal,  0,  0.130,  0.002, 0);          // elevation
      addCyl(0.012, 0.012, 0.032, m.metal,  0,  0.100,  0.002, 0, Math.PI / 2); // windage
      // Bolt handle — round knob
      addBox(0.010, 0.062, 0.010, m.metal,  0.044, 0.048,  0.030);
      addCyl(0.016, 0.016, 0.020, m.metal,  0.044, 0.014,  0.030);
      // Trigger guard
      addBox(0.062, 0.008, 0.090, m.metal,  0, -0.050,  0.060);
      addBox(0.062, 0.026, 0.008, m.metal,  0, -0.040,  0.022);
      // Trigger
      addBox(0.008, 0.026, 0.010, m.bright, 0, -0.046,  0.054);
      // Stock — walnut classic stock
      addBox(0.068, 0.072, 0.340, m.wood,   0, -0.010,  0.250, -0.04);
      // Pistol grip area of stock
      addBox(0.060, 0.100, 0.100, m.wood,   0, -0.066,  0.092,  0.14);
      // Monte Carlo comb
      addBox(0.066, 0.040, 0.180, m.wood,   0,  0.024,  0.310, -0.03);
      // Recoil pad
      addBox(0.070, 0.082, 0.018, m.rubber, 0, -0.010,  0.424, -0.04);
      // Forend / handstop
      addBox(0.058, 0.058, 0.220, m.wood,   0, -0.008, -0.260);
      // Swivel studs
      addBox(0.010, 0.020, 0.010, m.metal,  0, -0.038, -0.120);
      addBox(0.010, 0.020, 0.010, m.metal,  0, -0.040,  0.180);
      // Front sight (flip-up BUIS)
      addBox(0.020, 0.022, 0.010, m.metal,  0,  0.080, -0.840);

    // ─── GRENADE LAUNCHER — M79 thumper style ────────────────────
    } else if (ltype === "grenade_launcher") {
      // Barrel — wide bore, break-action
      addCyl(0.040, 0.038, 0.480, m.bright, 0,  0.020, -0.310, Math.PI / 2);
      // Barrel rib
      addBox(0.010, 0.008, 0.480, m.steel,  0,  0.062, -0.310);
      // Muzzle flare (wide open bore)
      addCyl(0.046, 0.040, 0.020, m.bright, 0,  0.020, -0.550, Math.PI / 2);
      // Receiver / action body
      addBox(0.100, 0.100, 0.200, m.dark,   0,  0.020,  0.042);
      // Hinge pin and barrel latch
      addCyl(0.010, 0.010, 0.106, m.metal,  0,  0.020, -0.062, 0, Math.PI / 2);
      addBox(0.040, 0.024, 0.024, m.metal,  0,  0.066, -0.040);
      // Sight ramp
      addBox(0.020, 0.060, 0.010, m.metal,  0,  0.082, -0.280);
      addBox(0.006, 0.014, 0.005, m.steel,  0,  0.098, -0.280);
      // Trigger guard
      addBox(0.068, 0.008, 0.090, m.metal,  0, -0.044,  0.052);
      addBox(0.068, 0.026, 0.008, m.metal,  0, -0.034,  0.018);
      // Trigger
      addBox(0.010, 0.030, 0.010, m.bright, 0, -0.040,  0.044);
      // Stock — short, pistol-grip
      addBox(0.078, 0.084, 0.290, m.wood,   0,  0.014,  0.242, -0.06);
      addBox(0.080, 0.084, 0.018, m.rubber, 0,  0.014,  0.397, -0.06);
      // Pistol grip — large for single shot control
      addBox(0.058, 0.120, 0.086, m.rubber, 0, -0.076,  0.078,  0.24);
      addBox(0.060, 0.010, 0.078, m.metal,  0, -0.138,  0.076,  0.24);
      // Forend
      addBox(0.070, 0.080, 0.160, m.wood,   0,  0.020, -0.210);
      // Extra: grenade shell visible in chamber (partially)
      addCyl(0.038, 0.038, 0.060, new THREE.MeshLambertMaterial({ color: 0x556633 }),
             0, 0.020, -0.040, Math.PI / 2);

    // ─── PLASMA GUN — Sci-fi energy weapon ───────────────────────
    } else if (ltype === "plasma") {
      // Main body — sleek futuristic housing
      addBox(0.090, 0.080, 0.380, m.dark,   0,  0.004,  0.000);
      // Side panels — energy cell indicators
      addBox(0.010, 0.068, 0.280, new THREE.MeshLambertMaterial({ color: 0x001133 }),
             -0.050, 0.004, -0.040);
      addBox(0.010, 0.068, 0.280, new THREE.MeshLambertMaterial({ color: 0x001133 }),
              0.050, 0.004, -0.040);
      // Plasma emitter barrel — glowing coil
      addCyl(0.030, 0.026, 0.200, m.dark,   0,  0.004, -0.290, Math.PI / 2);
      addCyl(0.034, 0.034, 0.020, m.dark,   0,  0.004, -0.392, Math.PI / 2); // emitter lip
      // Plasma coil rings (glowing blue)
      const plasmaRingMat = new THREE.MeshBasicMaterial({ color: 0x00aaff });
      for (let ri = 0; ri < 4; ri++) {
        addCyl(0.036, 0.036, 0.006, plasmaRingMat, 0, 0.004, -0.200 - ri * 0.040, Math.PI / 2);
      }
      // Energy core — central glowing orb area
      addBox(0.070, 0.060, 0.100, new THREE.MeshLambertMaterial({ color: 0x003366 }),
             0,  0.004,  0.060);
      // Power cell bulge
      addCyl(0.028, 0.028, 0.080, new THREE.MeshLambertMaterial({ color: 0x0044aa }),
             0,  0.004,  0.050, 0);
      // Top rail / sighting bar
      addBox(0.010, 0.012, 0.360, m.metal,  0,  0.048,  0.000);
      // Rear targeting reticle
      addBox(0.030, 0.014, 0.008, m.metal,  0,  0.048,  0.168);
      // Pistol grip — angular
      addBox(0.050, 0.110, 0.072, m.rubber, 0, -0.072,  0.090,  0.16);
      addBox(0.052, 0.010, 0.064, m.dark,   0, -0.128,  0.088,  0.16);
      // Trigger guard
      addBox(0.058, 0.008, 0.084, m.dark,   0, -0.046,  0.058);
      addBox(0.010, 0.026, 0.010, new THREE.MeshBasicMaterial({ color: 0x0088ff }),
             0, -0.044,  0.050); // glowing trigger
      // Side status LEDs
      const ledMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
      addBox(0.004, 0.008, 0.008, ledMat, -0.046, 0.028, 0.100);
      addBox(0.004, 0.008, 0.008, ledMat, -0.046, 0.028, 0.060);
      addBox(0.004, 0.008, 0.008, ledMat, -0.046, 0.028, 0.020);
      addBox(0.004, 0.008, 0.008, new THREE.MeshBasicMaterial({ color: 0xff4400 }),
             -0.046, 0.028, -0.020); // red warning LED

    }

    const gunBuildCfg = GameConfig.WEAPON_3D.GUNS[ltype] || {};
    const [baseX, baseY, baseZ] = gunBuildCfg.BASE_POSITION ?? [0.14, -0.14, -0.33];
    const baseRotationY = gunBuildCfg.BASE_ROTATION_Y ?? -0.06;
    this.weaponGroup.position.set(baseX, baseY, baseZ);
    this.weaponGroup.rotation.y = baseRotationY;

    this._currentWeaponType = ltype;
  }

  // ═══════════════════════════════════════════════════════════════
  // Enemy Mesh Management
  // ═══════════════════════════════════════════════════════════════

  _updateEnemyMeshes(enemies, t) {
    const alive = new Set();

    for (const enemy of enemies) {
      if (enemy.isDead) {
        // Trigger death animation for newly dead enemies
        if (this.enemyMeshes.has(enemy.id)) {
          const mesh = this.enemyMeshes.get(enemy.id);
          this.enemyMeshes.delete(enemy.id);
          this.enemiesGroup.remove(mesh);
          this.startDeathAnimation(mesh);
        }
        continue;
      }
      alive.add(enemy.id);

      if (!this.enemyMeshes.has(enemy.id)) {
        const mesh = this._createEnemyMesh(enemy);
        this.enemiesGroup.add(mesh);
        this.enemyMeshes.set(enemy.id, mesh);
      }

      const mesh = this.enemyMeshes.get(enemy.id);
      mesh.position.set(enemy.x, 0, enemy.y);
      // Always face the camera (billboard-style Y rotation)
      mesh.lookAt(this.camera.position.x, 0, this.camera.position.z);
      if (mesh.userData.animate) { mesh.userData.animate(t); }

      // Hit flash: briefly turn red when recently damaged
      if (mesh.userData.hitFlashTimer > 0) {
        mesh.userData.hitFlashTimer -= 0.016;
        const intensity = Math.min(1, mesh.userData.hitFlashTimer * 5);
        mesh.traverse((child) => {
          if (child.isMesh && child.material && child.material.emissive) {
            child.material.emissive.setRGB(intensity * 0.8, 0, 0);
          }
        });
      } else if (mesh.userData.hitFlashTimer < 0) {
        mesh.userData.hitFlashTimer = 0;
        mesh.traverse((child) => {
          if (child.isMesh && child.material && child.material.emissive) {
            child.material.emissive.setRGB(0, 0, 0);
          }
        });
      }
    }

    for (const [id, mesh] of this.enemyMeshes) {
      if (!alive.has(id)) {
        this.enemiesGroup.remove(mesh);
        this.enemyMeshes.delete(id);
      }
    }
  }

  /**
   * Trigger a hit flash on an enemy mesh (called from Game on enemyDamaged).
   * @param {string|number} enemyId
   */
  triggerHitFlash(enemyId) {
    const mesh = this.enemyMeshes.get(enemyId);
    if (mesh) { mesh.userData.hitFlashTimer = 0.25; }
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
  renderWorld(player, enemies, _map, _splatters = []) {
    const t = performance.now() / 1000;

    // Sync camera to player
    // angle=0 → facing +X → rotation.y must be -PI/2
    // angle=PI/2 → facing +Z → rotation.y must be -PI
    // Formula: rotation.y = -PI/2 - player.angle
    this.camera.position.set(player.x, 0.5, player.y);
    this.camera.rotation.y = -Math.PI / 2 - player.angle;
    this.camera.rotation.x = 0;

    // Move flashlight with player — forward dir = (cos(angle), 0, sin(angle))
    if (this.playerLight) {
      const dx = Math.cos(player.angle);
      const dz = Math.sin(player.angle);
      this.playerLight.position.set(player.x, 0.5, player.y);
      this.playerLight.target.position.set(
        player.x + dx * 8,
        0.4,
        player.y + dz * 8,
      );
      this.playerLight.target.updateMatrixWorld();
    }

    this._updateEnemyMeshes(enemies, t);

    // Update particle systems
    const dt = Math.min(1 / 30, (t - (this._lastT || t)));
    this._lastT = t;
    this._updateBloodParticles(dt);
    this._updateShells(dt);
    this._updateExplosions(dt);
    this._updateDeathAnimations(t);

    // Flicker torch lights
    for (const { light, base } of this._wallLights) {
      light.intensity =
        base +
        Math.sin(t * 7 + light.position.x * 17 + light.position.z * 5) * 0.35;
    }

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
    if (!weapon) { return; }

    const ltype = (weapon.name ?? "").toLowerCase();
    if (ltype !== this._currentWeaponType) {
      this._buildWeaponModel(weapon.name);
    }

    const t      = performance.now() / 1000;
    const aiming = !!player.isAiming;
    const bob    = typeof player.headBob      === "number" ? Math.sin(player.headBob) : 0;
    const recoil = typeof player.recoilOffset === "number" ? player.recoilOffset      : 0;

    const gunCfg = GameConfig.WEAPON_3D.GUNS[ltype] || {};
    const [bx, by, bz] = gunCfg.BASE_POSITION ?? [0.14, -0.14, -0.33];
    const [ax, ay, az] = aiming ? gunCfg.ADS_OFFSET ?? [0, 0, 0] : [0, 0, 0];
    const hipYRot = gunCfg.BASE_ROTATION_Y ?? -0.06;
    const aimYRot = (gunCfg.ADS_ROTATION ?? hipYRot) * 0.2;
    const yRot = aiming ? aimYRot : hipYRot;

    // ── Reload animation ─────────────────────────────────────────
    // reloadTime is in ms; reloadStartTime is Date.now() epoch ms
    let reloadOffsetY   = 0;
    let reloadTiltZ     = 0;
    let reloadTiltX     = 0;
    let reloadOffsetZ   = 0;

    if (weapon.isReloading && weapon.reloadTime > 0) {
      const elapsed  = Date.now() - weapon.reloadStartTime;          // ms
      const progress = Math.min(elapsed / weapon.reloadTime, 1.0);   // 0 → 1

      // Phase 0–35 %: weapon drops + tilts (eject / mag out)
      // Phase 35–65 %: held low and tilted (magazine swap)
      // Phase 65–100 %: rises back + un-tilts and snaps (chamber)
      const easeIn  = (x) => x * x;
      const easeOut = (x) => 1 - (1 - x) * (1 - x);

      if (progress < 0.35) {
        const p = easeIn(progress / 0.35);
        reloadOffsetY = -0.22 * p;
        reloadTiltZ   =  0.55 * p;   // tilt weapon outward
        reloadOffsetZ =  0.06 * p;   // pull slightly toward player
        reloadTiltX   =  0.3  * p;   // angle barrel down
      } else if (progress < 0.65) {
        reloadOffsetY = -0.22;
        reloadTiltZ   =  0.55;
        reloadOffsetZ =  0.06;
        reloadTiltX   =  0.3;
      } else {
        const p = easeOut((progress - 0.65) / 0.35);
        reloadOffsetY = -0.22 * (1 - p);
        reloadTiltZ   =  0.55  * (1 - p);
        reloadOffsetZ =  0.06  * (1 - p);
        reloadTiltX   =  0.3   * (1 - p);
        // Overshoot snap at the very end
        if (p > 0.85) {
          const snap = Math.sin((p - 0.85) / 0.15 * Math.PI) * 0.04;
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
    this.weaponGroup.rotation.z = Math.sin(t * 3) * bob * 0.015 * bobStrength + reloadTiltZ;
  }

  /**
   * Briefly flash the muzzle light on weapon fire.
   * @param {string} [weaponName] - weapon type for color selection
   */
  triggerMuzzleFlash(weaponName) {
    const lname = (weaponName ?? "").toLowerCase();
    if (lname === "plasma") {
      this.plasmaMuzzleLight.intensity = 6.0;
      setTimeout(() => { this.plasmaMuzzleLight.intensity = 0; }, 80);
    } else {
      const intensity = lname === "sniper" ? 8.0 : lname === "grenade_launcher" ? 7.0 : 5.0;
      this.muzzleFlashLight.intensity = intensity;
      setTimeout(() => { this.muzzleFlashLight.intensity = 0; }, 90);
    }
  }

  _onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.weaponCamera.aspect = w / h;
    this.weaponCamera.updateProjectionMatrix();
  }
}
