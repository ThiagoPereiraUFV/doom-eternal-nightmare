import * as THREE from "three";
import { GameConfig } from "../config/GameConfig.js";
import { WeaponFactory } from "../weapons/WeaponFactory.js";

const ENEMY_TYPES = Object.values(GameConfig.ENEMY.TYPES).map(
  ({ type }) => type,
);
const WEAPON_TYPES = [
  ...new Set(
    Object.values(GameConfig.DIFFICULTY).flatMap(
      (difficulty) => difficulty.availableGuns ?? [],
    ),
  ),
];

const MODEL_SETS = {
  enemies: {
    label: "Enemy specimen",
    entries: ENEMY_TYPES,
  },
  weapons: {
    label: "Weapon platform",
    entries: WEAPON_TYPES,
  },
};

const formatLabel = (value) => value.replaceAll("_", " ").toUpperCase();

export class MenuModelViewer {
  constructor(rendererSource) {
    this.rendererSource = rendererSource;
    this.canvas = document.getElementById("modelViewerCanvas");
    this.nameEl = document.getElementById("model-viewer-name");
    this.metaEl = document.getElementById("model-viewer-meta");
    this.indexEl = document.getElementById("model-viewer-index");

    this.category = "enemies";
    this.entryIndex = 0;
    this.currentModel = null;
    this.isOpen = false;
    this._loadToken = 0;
    this._rotationY = 0;
    this._dragging = false;
    this._lastPointerX = 0;
    this._animationFrameId = null;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    this.camera.position.set(0, 1.2, 5.4);

    this.previewRoot = new THREE.Group();
    this.scene.add(this.previewRoot);
    this.scene.add(new THREE.AmbientLight(0x807468, 2.1));

    const keyLight = new THREE.DirectionalLight(0xfff1da, 2.3);
    keyLight.position.set(2.5, 3.2, 4.5);
    this.scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xff6b2d, 10, 18, 2);
    rimLight.position.set(-2.2, 1.6, -3.2);
    this.scene.add(rimLight);

    const floorGlow = new THREE.Mesh(
      new THREE.CircleGeometry(1.8, 48),
      new THREE.MeshBasicMaterial({
        color: 0xff6b1f,
        transparent: true,
        opacity: 0.14,
      }),
    );
    floorGlow.rotation.x = -Math.PI / 2;
    floorGlow.position.y = -1.18;
    this.scene.add(floorGlow);

    this.renderer = this.canvas
      ? new THREE.WebGLRenderer({
          canvas: this.canvas,
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        })
      : null;

    if (this.renderer) {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    this._bindCanvasInteractions();
    window.addEventListener("resize", () => this._resize());
  }

  async open() {
    this.isOpen = true;
    this._resize();
    await this._showCurrentEntry();
    this._startRenderLoop();
  }

  close() {
    this.isOpen = false;
    this._dragging = false;
    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
  }

  async setCategory(category) {
    if (!MODEL_SETS[category]) {
      return;
    }

    if (this.category !== category) {
      this.category = category;
      this.entryIndex = 0;
    }

    if (this.isOpen) {
      await this._showCurrentEntry();
    }
  }

  async next() {
    const entries = this._currentEntries();
    if (!entries.length) {
      return;
    }
    this.entryIndex = (this.entryIndex + 1) % entries.length;
    await this._showCurrentEntry();
  }

  async previous() {
    const entries = this._currentEntries();
    if (!entries.length) {
      return;
    }
    this.entryIndex = (this.entryIndex - 1 + entries.length) % entries.length;
    await this._showCurrentEntry();
  }

  _currentEntries() {
    return MODEL_SETS[this.category]?.entries ?? [];
  }

  async _showCurrentEntry() {
    if (!this.renderer) {
      return;
    }

    const entries = this._currentEntries();
    if (!entries.length) {
      return;
    }

    const type = entries[this.entryIndex];
    const token = ++this._loadToken;
    const model = await this._buildPreviewModel(type);

    if (token !== this._loadToken) {
      this._disposeModel(model);
      return;
    }

    if (this.currentModel) {
      this.previewRoot.remove(this.currentModel);
      this._disposeModel(this.currentModel);
    }

    this.currentModel = model;
    this.previewRoot.add(model);
    this._fitModel(model);
    this._updateCopy(type, entries.length);
  }

  async _buildPreviewModel(type) {
    if (this.category === "weapons") {
      await WeaponFactory.init();
      const weapon = await WeaponFactory.create(type);
      const model = this.rendererSource.createWeaponPreview(weapon);
      model.scale.setScalar(2.6);
      model.rotation.y = Math.PI * 0.92;
      return model;
    }

    const model = this.rendererSource.createEnemyPreview(type);
    model.scale.setScalar(type === "brute" ? 0.92 : 1.12);
    return model;
  }

  _fitModel(model) {
    const framing =
      this.category === "weapons"
        ? { verticalLift: 0.08, padding: 1.28, minDistance: 4.4 }
        : { verticalLift: 0.14, padding: 1.2, minDistance: 4.9 };

    // Reset previewRoot before computing the box — world-space Box3.setFromObject
    // includes previewRoot's transform, so a stale position from a previous model
    // would corrupt the centering math.
    this.previewRoot.position.set(0, 0, 0);

    const initialBox = new THREE.Box3().setFromObject(model);
    const initialCenter = initialBox.getCenter(new THREE.Vector3());

    model.position.x -= initialCenter.x;
    model.position.y -= initialCenter.y;
    model.position.z -= initialCenter.z;

    const normalizedBox = new THREE.Box3().setFromObject(model);
    const size = normalizedBox.getSize(new THREE.Vector3());
    const focusY = 0; // model is now centered at origin — always aim at center

    this.previewRoot.position.set(0, 0, 0);
    this._rotationY = this.category === "weapons" ? -0.5 : 0;

    const verticalFov = THREE.MathUtils.degToRad(this.camera.fov);
    const horizontalFov =
      2 * Math.atan(Math.tan(verticalFov / 2) * this.camera.aspect);
    const fitHeight = size.y / (2 * Math.tan(verticalFov / 2));
    const fitWidth = size.x / (2 * Math.tan(horizontalFov / 2));
    const distance = Math.max(
      Math.max(fitHeight, fitWidth) * framing.padding + size.z * 0.9,
      framing.minDistance,
    );

    this.camera.position.set(0, size.y * framing.verticalLift, distance);
    this.camera.lookAt(0, 0, 0);
  }

  _updateCopy(type, total) {
    if (this.nameEl) {
      this.nameEl.textContent = formatLabel(type);
    }
    if (this.metaEl) {
      this.metaEl.textContent = MODEL_SETS[this.category].label;
    }
    if (this.indexEl) {
      this.indexEl.textContent = `${this.entryIndex + 1} / ${total}`;
    }
  }

  _startRenderLoop() {
    if (this._animationFrameId) {
      return;
    }

    const tick = () => {
      if (!this.isOpen || !this.renderer) {
        this._animationFrameId = null;
        return;
      }

      const time = performance.now() / 1000;

      if (!this._dragging) {
        this._rotationY += 0.006;
      }

      this.previewRoot.rotation.y = this._rotationY;
      this.currentModel?.userData?.animate?.(time);
      this.renderer.render(this.scene, this.camera);

      this._animationFrameId = requestAnimationFrame(tick);
    };

    this._animationFrameId = requestAnimationFrame(tick);
  }

  _bindCanvasInteractions() {
    if (!this.canvas) {
      return;
    }

    this.canvas.addEventListener("pointerdown", (event) => {
      if (!this.isOpen) {
        return;
      }
      event.preventDefault();
      this._dragging = true;
      this._lastPointerX = event.clientX;
      this.canvas.setPointerCapture?.(event.pointerId);
    });

    this.canvas.addEventListener("pointermove", (event) => {
      if (!this._dragging) {
        return;
      }
      const deltaX = event.clientX - this._lastPointerX;
      this._lastPointerX = event.clientX;
      this._rotationY += deltaX * 0.012;
    });

    const releaseDrag = (event) => {
      this._dragging = false;
      this.canvas.releasePointerCapture?.(event.pointerId);
    };

    this.canvas.addEventListener("pointerup", releaseDrag);
    this.canvas.addEventListener("pointercancel", releaseDrag);
    this.canvas.addEventListener("pointerleave", () => {
      this._dragging = false;
    });
  }

  _resize() {
    if (!this.renderer || !this.canvas) {
      return;
    }

    const width = Math.max(this.canvas.clientWidth, 1);
    const height = Math.max(this.canvas.clientHeight, 1);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  _disposeModel(group) {
    group?.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }

      if (!child.material) {
        return;
      }

      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      materials.forEach((material) => material.dispose());
    });
  }
}

export default MenuModelViewer;
