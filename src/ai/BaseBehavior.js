/**
 * BaseBehavior — Shared abstract base for both AIBehavior and BotBehavior.
 *
 * Consolidates movement, navigation, line-of-sight, and distance helpers that
 * were previously duplicated between the two hierarchies.
 */

import { RayCaster } from "../utils/RayCaster.js";
import { distance, isWalkable } from "../utils/MathUtils.js";

/** Angle offsets tried when the direct path is blocked during navigation. */
const STEER_OFFSETS = [Math.PI / 6, -Math.PI / 6, Math.PI / 3, -Math.PI / 3];

export class BaseBehavior {
  constructor(name) {
    if (new.target === BaseBehavior) {
      throw new Error(
        "BaseBehavior is abstract and cannot be instantiated directly",
      );
    }
    this.name = name;
  }

  /** @abstract */
  execute() {
    throw new Error("execute() must be implemented by subclass");
  }

  /** Optional lifecycle hook — called when the state is entered. */
  enter(_entity) {}

  /** Optional lifecycle hook — called when the state is exited. */
  exit(_entity) {}

  // ─── Distance ──────────────────────────────────────────────────────────────

  /**
   * Euclidean distance between two points.
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @returns {number}
   * @protected
   */
  _distance(x1, y1, x2, y2) {
    return distance(x1, y1, x2, y2);
  }

  // ─── Line-of-sight ─────────────────────────────────────────────────────────

  /**
   * Returns true when no wall tile interrupts the segment from (x1,y1) to (x2,y2).
   * Delegates to RayCaster.hasLineOfSight for a single authoritative implementation.
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @param {number[][]} map
   * @returns {boolean}
   * @protected
   */
  _isPathClear(x1, y1, x2, y2, map) {
    return RayCaster.hasLineOfSight(x1, y1, x2, y2, map);
  }

  // ─── Movement ──────────────────────────────────────────────────────────────

  /**
   * Attempt to move entity one step toward (targetX, targetY) at speed.
   * Updates entity.angle to face the movement direction.
   * Returns true when the destination tile is walkable and the move was applied.
   * @param {object} entity
   * @param {number} targetX
   * @param {number} targetY
   * @param {number} speed
   * @param {number[][]} map
   * @returns {boolean}
   * @protected
   */
  _moveTowards(entity, targetX, targetY, speed, map) {
    const dx = targetX - entity.x;
    const dy = targetY - entity.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.001) {
      return true; // already at target
    }

    const nx = entity.x + (dx / dist) * speed;
    const ny = entity.y + (dy / dist) * speed;
    const tx = Math.floor(nx);
    const ty = Math.floor(ny);

    if (isWalkable(map, tx, ty)) {
      entity.x = nx;
      entity.y = ny;
      entity.angle = Math.atan2(dy, dx);
      return true;
    }
    return false;
  }

  /**
   * Move toward (targetX, targetY); if the direct path is blocked, try
   * angled detours to steer around corners.
   * @param {object} entity
   * @param {number} targetX
   * @param {number} targetY
   * @param {number} speed
   * @param {number[][]} map
   * @returns {boolean}
   * @protected
   */
  _navigateTowards(entity, targetX, targetY, speed, map) {
    if (this._moveTowards(entity, targetX, targetY, speed, map)) {
      return true;
    }

    const angle = Math.atan2(targetY - entity.y, targetX - entity.x);
    for (const offset of STEER_OFFSETS) {
      const testX = entity.x + Math.cos(angle + offset) * speed;
      const testY = entity.y + Math.sin(angle + offset) * speed;
      if (this._moveTowards(entity, testX, testY, speed, map)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Find a random walkable tile within a distance band around (originX, originY).
   * Returns null when no walkable tile is found within the attempt budget.
   * @param {number} originX
   * @param {number} originY
   * @param {number[][]} map
   * @param {number} minDist - Minimum distance from origin (default 1)
   * @param {number} maxDist - Maximum distance from origin (default 8)
   * @param {number} attempts - Search attempts before giving up (default 20)
   * @returns {{ x: number, y: number } | null}
   * @protected
   */
  _randomWalkablePosition(
    originX,
    originY,
    map,
    minDist = 1,
    maxDist = 8,
    attempts = 20,
  ) {
    for (let i = 0; i < attempts; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = minDist + Math.random() * (maxDist - minDist);
      const tx = Math.floor(originX + Math.cos(angle) * dist);
      const ty = Math.floor(originY + Math.sin(angle) * dist);
      if (isWalkable(map, tx, ty)) {
        return { x: tx + 0.5, y: ty + 0.5 };
      }
    }
    return null;
  }
}
