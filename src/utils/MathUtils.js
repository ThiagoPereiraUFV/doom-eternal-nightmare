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
 * Returns true when tile (tx, ty) is inside map bounds and is a floor tile (value 0).
 * @param {number[][]} map
 * @param {number} tx  integer tile column
 * @param {number} ty  integer tile row
 * @returns {boolean}
 */
export function isWalkable(map, tx, ty) {
  return (
    ty >= 0 &&
    ty < map.length &&
    tx >= 0 &&
    tx < map[0].length &&
    map[ty][tx] === 0
  );
}
