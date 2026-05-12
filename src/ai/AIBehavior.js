/**
 * Base AI Behavior Class - Strategy Pattern
 * Different AI behaviors implement this interface
 * Following OCP - new behaviors extend without modifying base
 */

export class AIBehavior {
  constructor(name) {
    if (new.target === AIBehavior) {
      throw new Error(
        "AIBehavior is an abstract class and cannot be instantiated directly",
      );
    }

    this.name = name;
  }

  /**
   * Execute the behavior (must be implemented by subclasses)
   * @param {Enemy} enemy - Enemy executing the behavior
   * @param {Player} player - Player reference
   * @param {Array} map - Game map
   * @param {number} deltaTime - Time since last frame
   * @abstract
   */
  execute(_enemy, _player, _map, _deltaTime) {
    throw new Error("execute() must be implemented by subclass");
  }

  /**
   * Enter the state (optional override)
   * @param {Enemy} enemy - Enemy entering the state
   */
  enter(_enemy) {
    // Optional: Subclasses can override
  }

  /**
   * Check if path is clear between two points
   * @param {number} x1 - Start X
   * @param {number} y1 - Start Y
   * @param {number} x2 - End X
   * @param {number} y2 - End Y
   * @param {Array} map - Game map
   * @returns {boolean} True if path is clear
   * @protected
   */
  _isPathClear(x1, y1, x2, y2, map) {
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.floor(x1 + (x2 - x1) * t);
      const y = Math.floor(y1 + (y2 - y1) * t);

      if (
        x < 0 ||
        x >= map[0].length ||
        y < 0 ||
        y >= map.length ||
        map[y][x] > 0
      ) {
        return false;
      }
    }
    return true;
  }

  /**
   * Calculate distance between two points
   * @param {number} x1 - Point 1 X
   * @param {number} y1 - Point 1 Y
   * @param {number} x2 - Point 2 X
   * @param {number} y2 - Point 2 Y
   * @returns {number} Distance
   * @protected
   */
  _distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Move entity towards a target
   * @param {Object} entity - Entity to move
   * @param {number} targetX - Target X
   * @param {number} targetY - Target Y
   * @param {number} speed - Movement speed
   * @param {Array} map - Game map
   * @protected
   */
  _moveTowards(entity, targetX, targetY, speed, map) {
    const dx = targetX - entity.x;
    const dy = targetY - entity.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      const moveX = (dx / distance) * speed;
      const moveY = (dy / distance) * speed;

      const newX = entity.x + moveX;
      const newY = entity.y + moveY;

      // Check collision with map bounds guard
      const nx = Math.floor(newX);
      const ny = Math.floor(newY);
      if (
        ny >= 0 &&
        ny < map.length &&
        nx >= 0 &&
        nx < map[0].length &&
        map[ny][nx] === 0
      ) {
        entity.x = newX;
        entity.y = newY;
        return true;
      }
    }
    return false;
  }

  /**
   * Try to navigate toward a target even when the direct path is blocked.
   * @param {Object} entity - Entity to move
   * @param {number} targetX - Target X
   * @param {number} targetY - Target Y
   * @param {number} speed - Movement speed
   * @param {Array} map - Game map
   * @protected
   */
  _navigateTowards(entity, targetX, targetY, speed, map) {
    if (this._moveTowards(entity, targetX, targetY, speed, map)) {
      return true;
    }

    const angle = Math.atan2(targetY - entity.y, targetX - entity.x);
    const offsets = [Math.PI / 6, -Math.PI / 6, Math.PI / 3, -Math.PI / 3];

    for (const offset of offsets) {
      const testX = entity.x + Math.cos(angle + offset) * speed;
      const testY = entity.y + Math.sin(angle + offset) * speed;
      if (this._moveTowards(entity, testX, testY, speed, map)) {
        return true;
      }
    }

    return false;
  }
}
