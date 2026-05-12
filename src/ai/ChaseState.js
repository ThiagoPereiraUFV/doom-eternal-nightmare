/**
 * Chase State - Strategy Pattern Implementation
 * Enemy actively chases and attacks player
 */

import { AIBehavior } from "./AIBehavior.js";
import { GameConfig } from "../config/GameConfig.js";

export class ChaseState extends AIBehavior {
  constructor() {
    super("Chase");
  }

  /**
   * Execute chase behavior
   * @param {Enemy} enemy - Enemy executing behavior
   * @param {Player} player - Player reference
   * @param {Array} map - Game map
   * @param {number} deltaTime - Time since last frame
   */
  execute(enemy, player, map, _deltaTime) {
    const distance = this._distance(enemy.x, enemy.y, player.x, player.y);

    // If player is too far, switch to search state
    if (distance > GameConfig.ENEMY.LOSE_CHASE_DISTANCE) {
      enemy.setState(GameConfig.ENEMY.AI_STATES.SEARCH);
      return;
    }

    // Update last-known player position when player is visible.
    if (this._isPathClear(enemy.x, enemy.y, player.x, player.y, map)) {
      enemy.lastKnownPlayerPosition = { x: player.x, y: player.y };
      enemy.lastSawPlayerTime = Date.now();
    }

    // Attack if close enough
    if (distance < GameConfig.ENEMY.ATTACK_DISTANCE) {
      this._tryAttack(enemy, player);
      return;
    }

    // Strafe behavior at medium range
    if (
      distance < GameConfig.ENEMY.STRAFE_DISTANCE &&
      Math.random() < GameConfig.ENEMY.STRAFE_CHANCE
    ) {
      this._strafe(enemy, player, map);
    } else if (distance > GameConfig.ENEMY.MIN_MOVE_DISTANCE) {
      // Chase player or last known location when the direct path is blocked.
      const target = this._isPathClear(
        enemy.x,
        enemy.y,
        player.x,
        player.y,
        map,
      )
        ? { x: player.x, y: player.y }
        : enemy.lastKnownPlayerPosition || { x: player.x, y: player.y };

      const moved = this._navigateTowards(
        enemy,
        target.x,
        target.y,
        enemy.speed,
        map,
      );

      if (!moved) {
        enemy.stuckCounter = (enemy.stuckCounter || 0) + 1;

        // If stuck for too long, try to find alternate path
        if (enemy.stuckCounter > GameConfig.ENEMY.STUCK_THRESHOLD) {
          this._unstuck(enemy, player, map);
          enemy.stuckCounter = 0;
        }
      } else {
        enemy.stuckCounter = 0;
      }
    }
  }

  /**
   * Try to attack player
   * @private
   */
  _tryAttack(enemy, player) {
    const currentTime = Date.now();

    if (
      !enemy.lastAttackTime ||
      currentTime - enemy.lastAttackTime > GameConfig.ENEMY.ATTACK_COOLDOWN
    ) {
      player.takeDamage?.(GameConfig.ENEMY.ATTACK_DAMAGE);
      enemy.lastAttackTime = currentTime;
    }
  }

  /**
   * Strafe around player
   * @private
   */
  _strafe(enemy, player, map) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;

    // Move perpendicular to player direction
    const perpX = -dy;
    const perpY = dx;
    const length = Math.sqrt(perpX * perpX + perpY * perpY);

    if (length > 0) {
      const direction =
        Math.random() < GameConfig.ENEMY.STRAFE_PERPENDICULAR ? 1 : -1;
      const targetX = enemy.x + (perpX / length) * enemy.speed * direction;
      const targetY = enemy.y + (perpY / length) * enemy.speed * direction;

      this._moveTowards(enemy, targetX, targetY, enemy.speed, map);
    }
  }

  /**
   * Try to get unstuck
   * @private
   */
  _unstuck(enemy, player, map) {
    // Try moving in a random perpendicular direction
    const angle = Math.random() * Math.PI * 2;
    const targetX = enemy.x + Math.cos(angle) * 2;
    const targetY = enemy.y + Math.sin(angle) * 2;

    this._moveTowards(enemy, targetX, targetY, enemy.speed, map);
  }
}

export default ChaseState;
