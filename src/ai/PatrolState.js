/**
 * Patrol State - Strategy Pattern Implementation
 * Enemy wanders around patrol area
 */

import { AIBehavior } from "./AIBehavior.js";
import { GameConfig } from "../config/GameConfig.js";

export class PatrolState extends AIBehavior {
  constructor() {
    super("Patrol");
  }

  /**
   * Enter patrol state
   * @param {Enemy} enemy - Enemy entering state
   */
  enter(enemy) {
    this._setRandomPatrolTarget(enemy);
  }

  /**
   * Execute patrol behavior
   * @param {Enemy} enemy - Enemy executing behavior
   * @param {Player} player - Player reference
   * @param {Array} map - Game map
   * @param {number} deltaTime - Time since last frame
   */
  execute(enemy, player, map, _deltaTime) {
    const distance = this._distance(enemy.x, enemy.y, player.x, player.y);

    // If player is close and visible, switch to chase
    if (distance < GameConfig.ENEMY.CHASE_DISTANCE) {
      if (this._isPathClear(enemy.x, enemy.y, player.x, player.y, map)) {
        enemy.setState(GameConfig.ENEMY.AI_STATES.CHASE);
        return;
      }
    }

    // Move to patrol target
    if (enemy.patrolTarget) {
      const distToTarget = this._distance(
        enemy.x,
        enemy.y,
        enemy.patrolTarget.x,
        enemy.patrolTarget.y,
      );

      if (distToTarget < GameConfig.ENEMY.SEARCH_ARRIVAL_THRESHOLD) {
        // Reached patrol point, set new one
        this._setRandomPatrolTarget(enemy);
      } else if (distToTarget > GameConfig.ENEMY.PATROL_MIN_DISTANCE) {
        this._moveTowards(
          enemy,
          enemy.patrolTarget.x,
          enemy.patrolTarget.y,
          enemy.speed * GameConfig.ENEMY.PATROL_SPEED_MULT, // Move slower while patrolling
          map,
        );
      }
    } else {
      this._setRandomPatrolTarget(enemy);
    }

    // Randomly change patrol target occasionally
    if (Math.random() < GameConfig.ENEMY.PATROL_CHANGE_CHANCE) {
      this._setRandomPatrolTarget(enemy);
    }
  }

  /**
   * Set random patrol target near enemy
   * @private
   */
  _setRandomPatrolTarget(enemy) {
    const range = GameConfig.ENEMY.PATROL_WANDER_RANGE;
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * range + 1;

    enemy.patrolTarget = {
      x: enemy.spawnX + Math.cos(angle) * distance,
      y: enemy.spawnY + Math.sin(angle) * distance,
    };
  }
}

export default PatrolState;
