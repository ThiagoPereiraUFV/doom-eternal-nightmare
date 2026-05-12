import * as THREE from "three";

/**
 * MapRenderer — builds and manages the 3D map geometry and torch lights.
 */
export class MapRenderer {
  /** @param {THREE.Scene} scene */
  constructor(scene) {
    this._scene = scene;
    this._mapGroup = new THREE.Group();
    scene.add(this._mapGroup);

    this._wallLights = [];
    this._buildMaterials();
  }

  _buildMaterials() {
    this._wallMats = {
      concrete: new THREE.MeshBasicMaterial({ map: this._wallTex("concrete") }),
      brick: new THREE.MeshBasicMaterial({ map: this._wallTex("brick") }),
      metal: new THREE.MeshBasicMaterial({ map: this._wallTex("metal") }),
      stone: new THREE.MeshBasicMaterial({ map: this._wallTex("stone") }),
    };
    this._floorMat = new THREE.MeshBasicMaterial({ map: this._floorTex() });
    this._ceilMat = new THREE.MeshBasicMaterial({ color: 0x1a1a28 });
  }

  _wallTex(type) {
    const S = 256;
    const cv = document.createElement("canvas");
    cv.width = cv.height = S;
    const ctx = cv.getContext("2d");
    const bases = {
      concrete: "#5a5a5a",
      brick: "#8b4513",
      metal: "#445566",
      stone: "#565548",
    };
    ctx.fillStyle = bases[type];
    ctx.fillRect(0, 0, S, S);

    if (type === "brick") {
      const bh = 28,
        bw = 56;
      for (let row = 0; row < S / bh; row++) {
        const off = (row % 2) * (bw / 2);
        ctx.strokeStyle = "rgba(35,15,5,0.9)";
        ctx.lineWidth = 3;
        for (let col = -1; col <= S / bw + 1; col++) {
          ctx.strokeRect(col * bw + off + 1.5, row * bh + 1.5, bw - 3, bh - 3);
        }
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
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 50; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * S, Math.random() * S);
        ctx.lineTo(Math.random() * S, Math.random() * S);
        ctx.stroke();
      }
    } else if (type === "metal") {
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 2;
      for (let y = 0; y <= S; y += 64) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(S, y);
        ctx.stroke();
      }
      for (let x = 0; x <= S; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, S);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(180,190,210,0.7)";
      for (let y = 32; y < S; y += 64) {
        for (let x = 32; x < S; x += 64) {
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (type === "stone") {
      ctx.strokeStyle = "rgba(20,18,10,0.9)";
      ctx.lineWidth = 3;
      for (let row = 0; row < 7; row++) {
        const off = (row % 2) * 34;
        for (let col = -1; col < 6; col++) {
          ctx.strokeRect(col * 54 + off + 3, row * 40 + 3, 48, 34);
        }
      }
    }

    const id = ctx.getImageData(0, 0, S, S);
    for (let i = 0; i < id.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 22;
      id.data[i] = Math.max(0, Math.min(255, id.data[i] + n));
      id.data[i + 1] = Math.max(0, Math.min(255, id.data[i + 1] + n));
      id.data[i + 2] = Math.max(0, Math.min(255, id.data[i + 2] + n));
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
    ctx.strokeStyle = "rgba(0,0,0,0.65)";
    ctx.lineWidth = 2;
    for (let y = 0; y < S; y += ts) {
      for (let x = 0; x < S; x += ts) {
        ctx.strokeRect(x + 1, y + 1, ts - 2, ts - 2);
      }
    }
    const id = ctx.getImageData(0, 0, S, S);
    for (let i = 0; i < id.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 16;
      id.data[i] =
        id.data[i + 1] =
        id.data[i + 2] =
          Math.max(0, Math.min(255, id.data[i] + n));
    }
    ctx.putImageData(id, 0, 0);
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  }

  /**
   * Build instanced 3D geometry from a 2D tile map.
   * @param {number[][]} map
   */
  build(map) {
    this._mapGroup.clear();
    for (const { light } of this._wallLights) {
      this._scene.remove(light);
    }
    this._wallLights = [];

    const rows = map.length;
    const cols = map[0].length;
    const WALL_H = 2;
    const typeNames = ["", "concrete", "brick", "metal", "stone"];

    // Floor
    const floorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(cols, rows),
      this._floorMat,
    );
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(cols / 2, 0, rows / 2);
    floorMesh.receiveShadow = true;
    this._mapGroup.add(floorMesh);

    // Ceiling
    const ceilMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(cols, rows),
      this._ceilMat,
    );
    ceilMesh.rotation.x = Math.PI / 2;
    ceilMesh.position.set(cols / 2, WALL_H, rows / 2);
    this._mapGroup.add(ceilMesh);

    // Collect wall instances per type
    const buckets = { concrete: [], brick: [], metal: [], stone: [] };
    const dummy = new THREE.Object3D();

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tile = map[row][col];
        if (!tile) {
          continue;
        }
        const name = typeNames[tile] || "concrete";
        buckets[name].push({ col, row });

        // Torch lights on ~3% of walls
        if (Math.random() < 0.03) {
          const palette = [0xff6600, 0xff4400, 0xff8800, 0xffaa00];
          const color = palette[Math.floor(Math.random() * palette.length)];
          const light = new THREE.PointLight(color, 1.4, 5.5);
          light.position.set(col + 0.5, WALL_H * 0.6, row + 0.5);
          this._scene.add(light);
          this._wallLights.push({ light, base: 1.4 });
        }
      }
    }

    const baseGeo = new THREE.BoxGeometry(1, WALL_H, 1);
    for (const [typeName, walls] of Object.entries(buckets)) {
      if (!walls.length) {
        continue;
      }
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
      this._mapGroup.add(instanced);
    }
  }

  /**
   * Flicker torch lights. Call every frame with current time in seconds.
   * @param {number} t
   */
  updateLights(t) {
    for (const { light, base } of this._wallLights) {
      light.intensity =
        base +
        Math.sin(t * 7 + light.position.x * 17 + light.position.z * 5) * 0.35;
    }
  }
}
