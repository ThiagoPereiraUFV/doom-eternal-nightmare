/**
 * BotFollowState
 * Bot stays near the player and attacks any enemy that comes into range.
 * Default command behavior.
 */
import { BotBehavior } from "./BotBehavior.js";
import { GameConfig } from "../config/GameConfig.js";

export class BotFollowState extends BotBehavior {
  constructor() {
    super("follow");
  }

  execute(bot, player, enemies, map, _deltaTime) {
    const { ATTACK_RANGE, FOLLOW_DESIRED_DISTANCE, FOLLOW_MAX_DISTANCE } =
      GameConfig.BOT;

    // 1. Find a target in range
    const target = this._findTarget(bot, enemies, map, ATTACK_RANGE);

    if (target) {
      this._engageTarget(bot, target, map);
      return;
    }

    // 2. No target — follow player
    const distToPlayer = this._distance(bot.x, bot.y, player.x, player.y);

    if (distToPlayer > FOLLOW_MAX_DISTANCE) {
      // Teleport-nudge: jump closer to avoid getting hopelessly stuck
      bot.x =
        player.x + Math.cos(player.angle + Math.PI) * FOLLOW_DESIRED_DISTANCE;
      bot.y =
        player.y + Math.sin(player.angle + Math.PI) * FOLLOW_DESIRED_DISTANCE;
      return;
    }

    if (distToPlayer > FOLLOW_DESIRED_DISTANCE) {
      this._navigateTowards(bot, player.x, player.y, bot.speed, map);
    } else {
      // Already close — face the player
      bot.angle = bot.angleTo(player.x, player.y);
    }
  }
}
