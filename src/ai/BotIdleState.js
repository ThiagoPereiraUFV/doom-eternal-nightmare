/**
 * BotIdleState
 * Bot holds position and fires at enemies that enter close range.
 */
import { BotBehavior } from "./BotBehavior.js";
import { GameConfig } from "../config/GameConfig.js";

export class BotIdleState extends BotBehavior {
  constructor() {
    super("stop");
  }

  execute(bot, _player, enemies, map, _deltaTime) {
    // Engage enemies that wander close (shorter range than other modes)
    const CLOSE_RANGE = GameConfig.BOT.ATTACK_RANGE * 0.6;
    const target = this._findTarget(bot, enemies, map, CLOSE_RANGE);
    if (target) {
      bot.angle = bot.angleTo(target.x, target.y);
      this._tryAttack(bot, target);
    }
  }
}
