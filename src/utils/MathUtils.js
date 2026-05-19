/**
 * MathUtils — Shared math primitives used across AI, movement, and map systems.
 * Extracted to eliminate duplication between AIBehavior, BotBehavior, and map helpers.
 */

/**
 * Euclidean distance between two 2-D points.
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {number}
 */
export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Clamps value between min and max (inclusive).
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between a and b by factor t (0–1).
 * @param {number} a
 * @param {number} b
 * @param {number} t
 * @returns {number}
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Returns true when integer tile coordinates (tx, ty) are inside map bounds.
 * Does NOT check tile content.
 * @param {number[][]} map
 * @param {number} tx  integer tile column
 * @param {number} ty  integer tile row
 * @returns {boolean}
 */
export function isInBounds(map, tx, ty) {
  return ty >= 0 && ty < map.length && tx >= 0 && tx < map[0].length;
}

/**
 * Returns true when tile (tx, ty) is inside map bounds and is a floor tile (value 0).
 * @param {number[][]} map
 * @param {number} tx  integer tile column
 * @param {number} ty  integer tile row
 * @returns {boolean}
 */
export function isWalkable(map, tx, ty) {
  return isInBounds(map, tx, ty) && map[ty][tx] === 0;
}

/**
 * Remove elements from an array at the given indices in reverse order.
 * Indices must be sorted ascending (as collected in a forward loop).
 * Mutates the array in place.
 * @param {Array} array
 * @param {number[]} indices - ascending list of indices to remove
 */
export function spliceByIndices(array, indices) {
  for (let i = indices.length - 1; i >= 0; i--) {
    array.splice(indices[i], 1);
  }
}
