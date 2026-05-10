/**
 * Weapon Factory - Factory Pattern
 * Creates weapon instances
 * Following OCP - new weapons can be registered
 */

export class WeaponFactory {
  static _weaponTypes = new Map();
  static _initialized = false;

  /**
   * Initialize the weapon factory.
   * The factory is agnostic to concrete weapon modules and only caches loaded classes.
   */
  static async init() {
    if (this._initialized) { return; }
    this._initialized = true;
  }

  /**
   * Register a new weapon type locally.
   * @param {string} type - Weapon type identifier
   * @param {Class|string} WeaponClassOrPath - Weapon constructor or module path
   */
  static register(type, WeaponClassOrPath) {
    this._weaponTypes.set(type.toLowerCase(), WeaponClassOrPath);
  }

  /**
   * Create a weapon instance.
   * @param {string} type - Weapon type ('pistol', 'shotgun', 'rifle')
   * @returns {Promise<Weapon>} Weapon instance
   */
  static async create(type) {
    const typeKey = type.toLowerCase();
    let entry = this._weaponTypes.get(typeKey);

    if (!entry) {
      entry = await this._loadWeaponModule(typeKey);
      if (!entry) {
        throw new Error(`Unknown weapon type: ${type}`);
      }
      this._weaponTypes.set(typeKey, entry);
    }

    if (typeof entry === "string") {
      entry = await this._importModuleClass(entry);
      this._weaponTypes.set(typeKey, entry);
    }

    return new entry();
  }

  static async _loadWeaponModule(typeKey) {
    const path = `./models/${typeKey}.js`;
    return this._importModuleClass(path);
  }

  static async _importModuleClass(path) {
    try {
      const module = await import(path);
      return module.default || Object.values(module).find((exported) => typeof exported === "function");
    } catch {
      return null;
    }
  }

  /**
   * Get all registered weapon types
   * @returns {Array<string>} Array of weapon type names
   */
  static getTypes() {
    return Array.from(this._weaponTypes.keys());
  }

  /**
   * Check if weapon type is registered
   * @param {string} type - Weapon type to check
   * @returns {boolean} True if type is registered
   */
  static hasType(type) {
    return this._weaponTypes.has(type.toLowerCase());
  }
}

export default WeaponFactory;
