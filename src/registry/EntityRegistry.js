/**
 * EntityRegistry — category-aware model registry.
 *
 * Model files self-register at import time via EntityRegistry.register().
 * Factories and systems query this registry instead of maintaining their
 * own hard-coded type lists.
 *
 * Categories
 * ----------
 * 'enemy'    – hostile entities   (src/entities/enemies/models/)
 * 'weapon'   – player weapons     (src/weapons/models/)
 * 'bot'      – friendly bots      (src/entities/bots/)
 * 'player'   – player variants    (src/entities/)
 * 'particle' – effect emitters    (src/systems/models/)
 * 'map'      – map tile sets      (src/map/models/)
 *
 * Adding a new enemy "Troll"
 * --------------------------
 * 1. Create src/entities/enemies/models/troll.js  (calls EntityRegistry.register)
 * 2. Add  import './troll.js'  to src/entities/enemies/models/index.js
 * That's it — EnemyFactory, Renderer and MenuModelViewer pick it up
 * automatically.
 */

export const ENTITY_CATEGORIES = Object.freeze({
  ENEMY: "enemy",
  WEAPON: "weapon",
  BOT: "bot",
  PLAYER: "player",
  PARTICLE: "particle",
  MAP: "map",
});

export class EntityRegistry {
  /**
   * category → Map( type → { config, EntityClass } )
   * @type {Map<string, Map<string, { config: object, EntityClass: Function }>>}
   */
  static _registry = new Map();

  /**
   * Register an entity type under a category.
   *
   * @param {string}   category    – one of ENTITY_CATEGORIES
   * @param {object}   config      – must include a `type` string field
   * @param {Function} EntityClass – constructor for this entity type
   */
  static register(category, config, EntityClass) {
    if (!config?.type) {
      throw new Error(
        `EntityRegistry.register: config.type is required (category: ${category})`,
      );
    }

    if (!this._registry.has(category)) {
      this._registry.set(category, new Map());
    }

    this._registry
      .get(category)
      .set(config.type.toLowerCase(), { config, EntityClass });
  }

  /**
   * Return all registered type names for a category.
   * @param {string} category
   * @returns {string[]}
   */
  static getTypes(category) {
    return Array.from(this._registry.get(category)?.keys() ?? []);
  }

  /**
   * Return the config object for a registered type, or null.
   * @param {string} category
   * @param {string} type
   * @returns {object|null}
   */
  static getConfig(category, type) {
    return (
      this._registry.get(category)?.get(type.toLowerCase())?.config ?? null
    );
  }

  /**
   * Return the entity class for a registered type, or null.
   * @param {string} category
   * @param {string} type
   * @returns {Function|null}
   */
  static getClass(category, type) {
    return (
      this._registry.get(category)?.get(type.toLowerCase())?.EntityClass ?? null
    );
  }

  /**
   * Check whether a type is registered under a category.
   * @param {string} category
   * @param {string} type
   * @returns {boolean}
   */
  static hasType(category, type) {
    return this._registry.get(category)?.has(type.toLowerCase()) ?? false;
  }

  /**
   * Return all registered entries for a category as an array of
   * { type, config, EntityClass } objects — useful for iteration.
   * @param {string} category
   * @returns {Array<{ type: string, config: object, EntityClass: Function }>}
   */
  static getAll(category) {
    const cat = this._registry.get(category);
    if (!cat) {
      return [];
    }
    return Array.from(cat.entries()).map(([type, entry]) => ({
      type,
      ...entry,
    }));
  }
}
