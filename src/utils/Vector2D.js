/**
 * Vector2D utility class
 * Handles 2D vector mathematics
 * Following SRP - only vector operations
 */

export class Vector2D {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * Create a copy of this vector
   * @returns {Vector2D} New vector instance
   */
  clone() {
    return new Vector2D(this.x, this.y);
  }

  /**
   * Add another vector to this one
   * @param {Vector2D} v - Vector to add
   * @returns {Vector2D} This vector for chaining
   */
  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  /**
   * Subtract another vector from this one
   * @param {Vector2D} v - Vector to subtract
   * @returns {Vector2D} This vector for chaining
   */
  subtract(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  /**
   * Multiply this vector by a scalar
   * @param {number} scalar - Value to multiply by
   * @returns {Vector2D} This vector for chaining
   */
  multiply(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  /**
   * Calculate magnitude (length) of this vector
   * @returns {number} Vector magnitude
   */
  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Normalize this vector to unit length
   * @returns {Vector2D} This vector for chaining
   */
  normalize() {
    const mag = this.magnitude();
    if (mag > 0) {
      this.x /= mag;
      this.y /= mag;
    }
    return this;
  }

  /**
   * Calculate dot product with another vector
   * @param {Vector2D} v - Other vector
   * @returns {number} Dot product
   */
  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  /**
   * Calculate distance to another vector
   * @param {Vector2D} v - Other vector
   * @returns {number} Distance
   */
  distanceTo(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate angle in radians
   * @returns {number} Angle in radians
   */
  angle() {
    return Math.atan2(this.y, this.x);
  }

  /**
   * Create vector from angle and magnitude
   * @param {number} angle - Angle in radians
   * @param {number} magnitude - Vector length
   * @returns {Vector2D} New vector
   */
  static fromAngle(angle, magnitude = 1) {
    return new Vector2D(
      Math.cos(angle) * magnitude,
      Math.sin(angle) * magnitude,
    );
  }

  /**
   * Lerp between two vectors
   * @param {Vector2D} v1 - Start vector
   * @param {Vector2D} v2 - End vector
   * @param {number} t - Interpolation factor (0-1)
   * @returns {Vector2D} New interpolated vector
   */
  static lerp(v1, v2, t) {
    return new Vector2D(v1.x + (v2.x - v1.x) * t, v1.y + (v2.y - v1.y) * t);
  }
}

export default Vector2D;
