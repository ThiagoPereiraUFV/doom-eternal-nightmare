/**
 * Weapon Factory - Factory Pattern
 * Creates weapon instances.
 * Following OCP — new weapons are registered via EntityRegistry;
 * no changes to this file are needed when adding a new weapon model.
 *
 * To add a new weapon:
 *   1. Create src/weapons/models/<type>.js  (follow existing weapon pattern)
 *   2. Import it in src/weapons/models/index.js — that's the only change needed.
 */

import {
  EntityRegistry,
  ENTITY_CATEGORIES,
} from "../registry/EntityRegistry.js";

export class WeaponFactory {
  static _initialized = false;

  /**
   * Async init — loads all weapon model descriptors (triggering self-registration
   * with EntityRegistry via each model file's side-effect import).
   * Call once with `await WeaponFactory.init()` before creating weapons.
   */
  static async init() {
    if (this._initialized) {
      return;
    }
    this._initialized = true;

    // Load all weapon model descriptors — each file calls EntityRegistry.register()
    await import("./models/index.js");
  }

  /**
   * Create a weapon instance by type name.
   * Falls back to a dynamic import if the type isn't registered yet
   * (supports lazy-loaded weapons not included in the index).
   * @param {string} type – weapon type key (e.g. 'pistol', 'shotgun')
   * @returns {Promise<Weapon>}
   */
  static async create(type) {
    const typeKey = type.toLowerCase();

    let WeaponClass = EntityRegistry.getClass(
      ENTITY_CATEGORIES.WEAPON,
      typeKey,
    );

    if (!WeaponClass) {
      // Lazy-load: try the conventional module path and allow its side-effect to register
      WeaponClass = await this._loadWeaponModule(typeKey);
    }

    if (!WeaponClass) {
      throw new Error(
        `Unknown weapon type: "${type}". Did you add it to src/weapons/models/index.js?`,
      );
    }

    return new WeaponClass();
  }

  static async _loadWeaponModule(typeKey) {
    try {
      const module = await import(`./models/${typeKey}.js`);
      const WeaponClass =
        module.default ||
        Object.values(module).find((x) => typeof x === "function");

      // The module's side-effect should have registered it; return whatever we got
      return WeaponClass ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Return all registered weapon type names.
   * @returns {string[]}
   */
  static getTypes() {
    return EntityRegistry.getTypes(ENTITY_CATEGORIES.WEAPON);
  }

  /**
   * Check whether a weapon type is registered.
   * @param {string} type
   * @returns {boolean}
   */
  static hasType(type) {
    return EntityRegistry.hasType(ENTITY_CATEGORIES.WEAPON, type);
  }
}

export default WeaponFactory;
