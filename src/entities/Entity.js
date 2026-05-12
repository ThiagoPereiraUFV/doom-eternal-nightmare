/**
 * Entity Base Class
 * Shared foundation for all positioned, living game entities (Player, Enemy, FriendlyBot).
 * Provides: position, facing angle, health, and core geometry helpers.
 */

export class Entity {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.health = 0;
    this.maxHealth = 0;
  }

  /**
   * @returns {boolean} True when health is above zero.
   */
  isAlive() {
    return this.health > 0;
  }

  /**
   * Euclidean distance to a point.
   * @param {number} x
   * @param {number} y
   * @returns {number}
   */
  distanceTo(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Angle in radians from this entity toward a point.
   * @param {number} x
   * @param {number} y
   * @returns {number}
   */
  angleTo(x, y) {
    return Math.atan2(y - this.y, x - this.x);
  }
}

export default Entity;
