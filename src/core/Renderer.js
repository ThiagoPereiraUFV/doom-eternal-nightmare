/**
 * Renderer System — Three.js 3D Edition
 * True 3D rendering with instanced geometry, 3D enemy models,
 * first-person weapon meshes, and dynamic lighting.
 * Following SRP — only rendering logic.
 */

import * as THREE from "three";

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
    this.scene.add(new THREE.AmbientLight(0x334455, 1.2));

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
          ctx.strokeRect(col * bw + off + 1.5, row * bh + 1.5, bw - 3, bh - 3);
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
        for (let x = 32; x < S; x += 64) {
          ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
        }
    } else if (type === "stone") {
      ctx.strokeStyle = "rgba(20,18,10,0.9)"; ctx.lineWidth = 3;
      for (let row = 0; row < 7; row++) {
        const off = (row % 2) * 34;
        for (let col = -1; col < 6; col++)
          ctx.strokeRect(col * 54 + off + 3, row * 40 + 3, 48, 34);
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
      for (let x = 0; x < S; x += ts)
        ctx.strokeRect(x + 1, y + 1, ts - 2, ts - 2);
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
    for (const { light } of this._wallLights) this.scene.remove(light);
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
        if (!tile) continue;
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
      if (!walls.length) continue;
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
    const sphere = (r, mat, px, py, pz, segs = 8) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, segs, segs), mat);
      m.position.set(px, py, pz);
      m.castShadow = true;
      g.add(m);
      return m;
    };
    const cone = (r, h, mat, px, py, pz, rz = 0) => {
      const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), mat);
      m.position.set(px, py, pz);
      m.rotation.z = rz;
      g.add(m);
      return m;
    };

    if (enemy.type === "ghost") {
      const body = sphere(0.24, bM, 0, 0.62, 0, 10);
      sphere(0.06, eM, -0.1, 0.66, 0.2);
      sphere(0.06, eM,  0.1, 0.66, 0.2);
      const wisps = Array.from({ length: 3 }, (_, i) =>
        sphere(0.1, bM,
          Math.cos(i * 2.1) * 0.28, 0.36, Math.sin(i * 2.1) * 0.28, 6),
      );
      g.userData.animate = (t) => {
        body.position.y = 0.62 + Math.sin(t * 1.8) * 0.1;
        wisps.forEach((w, i) => {
          w.position.x = Math.cos(t + i * 2.1) * 0.32;
          w.position.z = Math.sin(t + i * 2.1) * 0.32;
          w.position.y = 0.34 + Math.sin(t * 2.5 + i) * 0.08;
        });
      };
    } else if (enemy.type === "brute") {
      box(0.66, 0.74, 0.44, bM,     0,    0.49, 0);
      box(0.5,  0.44, 0.44, hM,     0,    0.96, 0);
      cone(0.08, 0.3, hornM,        -0.2, 1.26, 0, -0.3);
      cone(0.08, 0.3, hornM,         0.2, 1.26, 0,  0.3);
      const aL = box(0.23, 0.6, 0.23, bM, -0.48, 0.48, 0, 0, 0,  0.3);
      const aR = box(0.23, 0.6, 0.23, bM,  0.48, 0.48, 0, 0, 0, -0.3);
      const lL = box(0.26, 0.4, 0.26, bM, -0.18, 0.1, 0);
      const lR = box(0.26, 0.4, 0.26, bM,  0.18, 0.1, 0);
      sphere(0.09, eM, -0.15, 0.97, 0.23);
      sphere(0.09, eM,  0.15, 0.97, 0.23);
      g.userData.animate = (t) => {
        lL.rotation.x = Math.sin(t * 3.5) * 0.4;
        lR.rotation.x = Math.sin(t * 3.5 + Math.PI) * 0.4;
        aL.rotation.x = Math.sin(t * 3.5 + Math.PI) * 0.25;
        aR.rotation.x = Math.sin(t * 3.5) * 0.25;
      };
    } else if (enemy.type === "zombie") {
      box(0.32, 0.64, 0.22, bM,  0,    0.46, 0);
      box(0.3,  0.33, 0.3,  hM,  0,    0.87, 0);
      const aL = box(0.14, 0.54, 0.14, bM, -0.26, 0.58,  0.12, -0.75, 0, 0);
      const aR = box(0.14, 0.54, 0.14, bM,  0.26, 0.58,  0.12, -0.75, 0, 0);
      const lL = box(0.15, 0.45, 0.15, bM, -0.1,  0.12, 0);
      const lR = box(0.15, 0.45, 0.15, bM,  0.1,  0.12, 0);
      sphere(0.058, eM, -0.1, 0.88, 0.17);
      sphere(0.058, eM,  0.1, 0.88, 0.17);
      g.userData.animate = (t) => {
        lL.rotation.x = Math.sin(t * 3.5) * 0.35;
        lR.rotation.x = Math.sin(t * 3.5 + Math.PI) * 0.35;
        aL.rotation.x = -0.75 + Math.sin(t * 3.5) * 0.2;
        aR.rotation.x = -0.75 + Math.sin(t * 3.5 + Math.PI) * 0.2;
      };
    } else {
      // Demon (default)
      box(0.44, 0.64, 0.34, bM,  0,    0.46, 0);
      box(0.4,  0.36, 0.36, hM,  0,    0.84, 0);
      cone(0.056, 0.2, hornM, -0.14, 1.03, 0, -0.35);
      cone(0.056, 0.2, hornM,  0.14, 1.03, 0,  0.35);
      const aL = box(0.17, 0.52, 0.17, bM, -0.33, 0.46, 0);
      const aR = box(0.17, 0.52, 0.17, bM,  0.33, 0.46, 0);
      const lL = box(0.17, 0.44, 0.17, bM, -0.14, 0.12, 0);
      const lR = box(0.17, 0.44, 0.17, bM,  0.14, 0.12, 0);
      sphere(0.068, eM, -0.12, 0.84, 0.2);
      sphere(0.068, eM,  0.12, 0.84, 0.2);
      g.userData.animate = (t) => {
        lL.rotation.x = Math.sin(t * 4.5) * 0.44;
        lR.rotation.x = Math.sin(t * 4.5 + Math.PI) * 0.44;
        aL.rotation.x = Math.sin(t * 4.5 + Math.PI) * 0.3;
        aR.rotation.x = Math.sin(t * 4.5) * 0.3;
      };
    }

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

      this.weaponGroup.position.set(0.14, -0.14, -0.33);
      this.weaponGroup.rotation.y = -0.08;

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

      this.weaponGroup.position.set(0.17, -0.18, -0.34);
      this.weaponGroup.rotation.y = -0.09;

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

      this.weaponGroup.position.set(0.19, -0.155, -0.34);
      this.weaponGroup.rotation.y = -0.09;
    }

    this._currentWeaponType = ltype;
  }

  // ═══════════════════════════════════════════════════════════════
  // Enemy Mesh Management
  // ═══════════════════════════════════════════════════════════════

  _updateEnemyMeshes(enemies, t) {
    const alive = new Set();

    for (const enemy of enemies) {
      if (enemy.isDead) continue;
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
      if (mesh.userData.animate) mesh.userData.animate(t);
    }

    for (const [id, mesh] of this.enemyMeshes) {
      if (!alive.has(id)) {
        this.enemiesGroup.remove(mesh);
        this.enemyMeshes.delete(id);
      }
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
    if (!weapon) return;

    const ltype = (weapon.name ?? "").toLowerCase();
    if (ltype !== this._currentWeaponType) {
      this._buildWeaponModel(weapon.name);
    }

    const t      = performance.now() / 1000;
    const bob    = typeof player.headBob      === "number" ? Math.sin(player.headBob) : 0;
    const recoil = typeof player.recoilOffset === "number" ? player.recoilOffset      : 0;

    const bases = {
      pistol:  [0.14,  -0.14,  -0.33],
      shotgun: [0.17,  -0.18,  -0.34],
      rifle:   [0.19,  -0.155, -0.34],
    };
    const [bx, by, bz] = bases[ltype] ?? [0.14, -0.14, -0.33];

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
    this.weaponGroup.position.set(
      bx + Math.cos(t * 3) * bob * 0.006,
      by + Math.sin(t * 6) * bob * 0.01 + reloadOffsetY,
      bz + recoil * 0.05 + reloadOffsetZ,
    );
    this.weaponGroup.rotation.x = recoil * 0.12 + reloadTiltX;
    this.weaponGroup.rotation.z = Math.sin(t * 3) * bob * 0.015 + reloadTiltZ;
  }

  /**
   * Briefly flash the muzzle light on weapon fire.
   */
  triggerMuzzleFlash() {
    this.muzzleFlashLight.intensity = 5.0;
    setTimeout(() => { this.muzzleFlashLight.intensity = 0; }, 90);
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
