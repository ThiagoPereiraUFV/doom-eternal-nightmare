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
    const { ATTACK_RANGE, SEARCH_WANDER_INTERVAL } = GameConfig.BOT;

    // 1. Engage any visible enemy
    const target = this._findTarget(bot, enemies, map, ATTACK_RANGE);
    if (target) {
      const distToTarget = this._distance(bot.x, bot.y, target.x, target.y);
      if (distToTarget > 1.2) {
        this._navigate(bot, target.x, target.y, bot.speed, map);
      }
      this._tryAttack(bot, target);
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
      ) < 0.5;

    if (needNewTarget) {
      bot.searchWanderTarget = this._pickWanderTarget(bot, map);
      bot.searchWanderTime = now;
    }

    if (bot.searchWanderTarget) {
      const moved = this._navigate(
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

  /**
   * Pick a random walkable tile within ~8 units of the bot as a wander goal.
   */
  _pickWanderTarget(bot, map) {
    const RANGE = 8;
    for (let attempt = 0; attempt < 20; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 3 + Math.random() * RANGE;
      const tx = Math.floor(bot.x + Math.cos(angle) * dist);
      const ty = Math.floor(bot.y + Math.sin(angle) * dist);
      if (
        ty >= 0 &&
        ty < map.length &&
        tx >= 0 &&
        tx < map[0].length &&
        map[ty][tx] === 0
      ) {
        return { x: tx + 0.5, y: ty + 0.5 };
      }
    }
    return null;
  }
}
