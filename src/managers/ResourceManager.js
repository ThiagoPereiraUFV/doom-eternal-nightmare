/**
 * Resource Manager - Singleton Pattern
 * Handles loading and managing game resources (sprites, textures)
 * Following SRP - only resource management
 */

export class ResourceManager {
  static _instance = null;

  constructor() {
    if (ResourceManager._instance) {
      return ResourceManager._instance;
    }

    this.loadedSprites = {
      walls: {},
      enemies: {},
      weapons: {},
    };

    this.wallPatterns = null;
    this.resourcesLoaded = false;
    this.loadingProgress = 0;

    ResourceManager._instance = this;
  }

  /**
   * Get singleton instance
   * @returns {ResourceManager} Singleton instance
   */
  static getInstance() {
    if (!ResourceManager._instance) {
      new ResourceManager();
    }
    return ResourceManager._instance;
  }

  /**
   * Load all game resources
   * @param {Function} progressCallback - Progress update callback
   * @returns {Promise<void>}
   */
  async loadResources(progressCallback) {
    try {
      progressCallback?.(10, "Loading sprites...");

      // Load sprites from window.SVGSprites (loaded via script tag)
      await this._preloadSprites(window.SVGSprites, progressCallback);

      progressCallback?.(80, "Creating wall patterns...");
      this._createWallPatterns();

      progressCallback?.(90, "Finalizing...");
      await new Promise((resolve) => setTimeout(resolve, 300));

      progressCallback?.(100, "Ready!");
      this.resourcesLoaded = true;
    } catch (error) {
      console.error("Error loading resources:", error);
      throw error;
    }
  }

  /**
   * Preload sprites
   * @private
   */
  async _preloadSprites(sprites, progressCallback) {
    const categories = ["walls", "enemies", "weapons"];
    const totalCategories = categories.length;

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const categorySprites = sprites[category];

      if (categorySprites) {
        await this._loadSpriteCategory(category, categorySprites);
      }

      const progress = 10 + ((i + 1) / totalCategories) * 60;
      progressCallback?.(progress, `Loading ${category}...`);
    }
  }

  /**
   * Load sprite category
   * @private
   */
  async _loadSpriteCategory(category, sprites) {
    const promises = Object.entries(sprites).map(([name, svgString]) => {
      return this._loadSprite(category, name, svgString);
    });

    await Promise.all(promises);
  }

  /**
   * Load individual sprite
   * @private
   */
  _loadSprite(category, name, svgString) {
    return new Promise((resolve, reject) => {
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        this.loadedSprites[category][name] = {
          img,
          width: img.width,
          height: img.height,
        };
        resolve();
      };

      img.onerror = () => {
        console.error(`Failed to load sprite: ${category}/${name}`);
        reject(new Error(`Failed to load sprite: ${category}/${name}`));
      };

      img.src = url;
    });
  }

  /**
   * Create wall texture patterns
   * @private
   */
  _createWallPatterns() {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    if (!this.loadedSprites.walls.concrete?.img) return;

    this.wallPatterns = {
      1: ctx.createPattern(this.loadedSprites.walls.concrete.img, "repeat"),
      2: ctx.createPattern(this.loadedSprites.walls.brick.img, "repeat"),
      3: ctx.createPattern(this.loadedSprites.walls.metal.img, "repeat"),
      4: ctx.createPattern(this.loadedSprites.walls.stone.img, "repeat"),
    };
  }

  /**
   * Get sprite
   * @param {string} category - Sprite category
   * @param {string} name - Sprite name
   * @returns {Object|null} Sprite data
   */
  getSprite(category, name) {
    return this.loadedSprites[category]?.[name] || null;
  }

  /**
   * Get wall pattern
   * @param {number} wallType - Wall type number
   * @returns {CanvasPattern|null} Canvas pattern
   */
  getWallPattern(wallType) {
    return this.wallPatterns?.[wallType] || null;
  }

  /**
   * Check if resources are loaded
   * @returns {boolean} True if loaded
   */
  isLoaded() {
    return this.resourcesLoaded;
  }
}

export default ResourceManager;
