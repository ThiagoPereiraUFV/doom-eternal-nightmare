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
    // Set search target to last known player location if available.
    if (enemy.lastKnownPlayerPosition) {
      enemy.searchTarget = { ...enemy.lastKnownPlayerPosition };
    } else if (!enemy.searchTarget) {
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
  execute(enemy, player, map, _deltaTime, _bots) {
    if (this._checkTransitionToChase(enemy, player, map)) {
      return;
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
        enemy.setState(GameConfig.ENEMY.AI_STATES.PATROL);
      } else {
        const moved = this._navigateTowards(
          enemy,
          enemy.searchTarget.x,
          enemy.searchTarget.y,
          enemy.speed * GameConfig.ENEMY.SEARCH_SPEED_MULT, // Move moderately fast while searching
          map,
        );

        if (!moved) {
          // If blocked, pick a nearby search waypoint and keep looking.
          enemy.searchTarget = {
            x: enemy.x + (Math.random() * 2 - 1) * 2,
            y: enemy.y + (Math.random() * 2 - 1) * 2,
          };
        }
      }
    } else {
      // No search target, return to patrol
      enemy.setState(GameConfig.ENEMY.AI_STATES.PATROL);
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
