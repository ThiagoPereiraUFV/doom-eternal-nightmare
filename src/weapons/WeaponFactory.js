/**
 * Weapon Factory - Factory Pattern
 * Creates weapon instances
 * Following OCP - new weapons can be registered
 */

import { Pistol } from "./Pistol.js";
import { Shotgun } from "./Shotgun.js";
import { Rifle } from "./Rifle.js";

export class WeaponFactory {
  static _weaponTypes = new Map();

  /**
   * Initialize default weapon types
   */
  static init() {
    this.register("pistol", Pistol);
    this.register("shotgun", Shotgun);
    this.register("rifle", Rifle);
  }

  /**
   * Register a new weapon type
   * @param {string} type - Weapon type identifier
   * @param {Class} WeaponClass - Weapon class constructor
   */
  static register(type, WeaponClass) {
    this._weaponTypes.set(type.toLowerCase(), WeaponClass);
  }

  /**
   * Create a weapon instance
   * @param {string} type - Weapon type ('pistol', 'shotgun', 'rifle')
   * @returns {Weapon} Weapon instance
   * @example
   * const pistol = WeaponFactory.create('pistol');
   * const shotgun = WeaponFactory.create('shotgun');
   */
  static create(type) {
    const WeaponClass = this._weaponTypes.get(type.toLowerCase());

    if (!WeaponClass) {
      throw new Error(`Unknown weapon type: ${type}`);
    }

    return new WeaponClass();
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

// Initialize default weapons
WeaponFactory.init();

export default WeaponFactory;
