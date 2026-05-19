/**
 * BotSearchClearState
 * Bot roams the map, seeks out enemies, and eliminates them.
 */
import { BotBehavior } from "./BotBehavior.js";
import { GameConfig } from "../config/GameConfig.js";

export class BotSearchClearState extends BotBehavior {
  constructor() {
    super("search_clear");
  }

  enter(bot) {
    bot.searchWanderTarget = null;
    bot.searchWanderTime = 0;
  }

  execute(bot, _player, enemies, map, _deltaTime) {
    const {
      ATTACK_RANGE,
      SEARCH_WANDER_INTERVAL,
      SEARCH_WANDER_MIN_DIST,
      SEARCH_WANDER_RANGE,
      SEARCH_WANDER_ATTEMPTS,
    } = GameConfig.BOT;

    // 1. Engage any visible enemy
    const target = this._findTarget(bot, enemies, map, ATTACK_RANGE);
    if (target) {
      this._engageTarget(bot, target, map);
      bot.searchWanderTarget = null; // reset wander so we don't immediately resume old path
      return;
    }

    // 2. Wander — pick a new random heading periodically
    const now = Date.now();
    const needNewTarget =
      !bot.searchWanderTarget ||
      now - bot.searchWanderTime > SEARCH_WANDER_INTERVAL ||
      this._distance(
        bot.x,
        bot.y,
        bot.searchWanderTarget.x,
        bot.searchWanderTarget.y,
      ) < GameConfig.ENEMY.SEARCH_ARRIVAL_THRESHOLD;

    if (needNewTarget) {
      bot.searchWanderTarget = this._randomWalkablePosition(
        bot.x,
        bot.y,
        map,
        SEARCH_WANDER_MIN_DIST,
        SEARCH_WANDER_MIN_DIST + SEARCH_WANDER_RANGE,
        SEARCH_WANDER_ATTEMPTS,
      );
      bot.searchWanderTime = now;
    }

    if (bot.searchWanderTarget) {
      const moved = this._navigateTowards(
        bot,
        bot.searchWanderTarget.x,
        bot.searchWanderTarget.y,
        bot.speed,
        map,
      );
      if (!moved) {
        // Blocked — force a new target next tick
        bot.searchWanderTarget = null;
      }
    }
  }
}
