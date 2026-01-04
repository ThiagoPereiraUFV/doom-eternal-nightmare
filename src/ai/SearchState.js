/**
 * Search State - Strategy Pattern Implementation
 * Enemy searches for player at last known position
 */

import { AIBehavior } from "./AIBehavior.js";
import { GameConfig } from "../config/GameConfig.js";

export class SearchState extends AIBehavior {
  constructor() {
    super("Search");
  }

  /**
   * Enter search state
   * @param {Enemy} enemy - Enemy entering state
   */
  enter(enemy) {
    // Set search target to current position (last known player location)
    if (!enemy.searchTarget) {
      enemy.searchTarget = { x: enemy.x, y: enemy.y };
    }
  }

  /**
   * Execute search behavior
   * @param {Enemy} enemy - Enemy executing behavior
   * @param {Player} player - Player reference
   * @param {Array} map - Game map
   * @param {number} deltaTime - Time since last frame
   */
  execute(enemy, player, map, deltaTime) {
    const distance = this._distance(enemy.x, enemy.y, player.x, player.y);

    // If player is close and visible, switch to chase
    if (distance < GameConfig.ENEMY.CHASE_DISTANCE) {
      if (this._isPathClear(enemy.x, enemy.y, player.x, player.y, map)) {
        enemy.setState("chase");
        return;
      }
    }

    // Move to search target
    if (enemy.searchTarget) {
      const distToTarget = this._distance(
        enemy.x,
        enemy.y,
        enemy.searchTarget.x,
        enemy.searchTarget.y,
      );

      if (distToTarget < GameConfig.ENEMY.SEARCH_ARRIVAL_THRESHOLD) {
        // Reached search point, give up and return to patrol
        enemy.searchTarget = null;
        enemy.setState("patrol");
      } else {
        this._moveTowards(
          enemy,
          enemy.searchTarget.x,
          enemy.searchTarget.y,
          enemy.speed * 0.7, // Move moderately fast while searching
          map,
        );
      }
    } else {
      // No search target, return to patrol
      enemy.setState("patrol");
    }
  }

  /**
   * Exit search state
   * @param {Enemy} enemy - Enemy exiting state
   */
  exit(enemy) {
    enemy.searchTarget = null;
  }
}

export default SearchState;
