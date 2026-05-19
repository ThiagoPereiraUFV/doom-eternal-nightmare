/**
 * BotBehavior — Abstract base for friendly-bot AI states.
 * Mirrors AIBehavior but with an extended execute signature that includes the
 * full enemies list so bots can pick combat targets.
 *
 * Movement, LoS, and distance helpers are inherited from BaseBehavior.
 * Bot-specific helpers (_findTarget, _tryAttack) live here.
 */

import { BaseBehavior } from "./BaseBehavior.js";
import { GameConfig } from "../config/GameConfig.js";

export class BotBehavior extends BaseBehavior {
  constructor(name) {
    if (new.target === BotBehavior) {
      throw new Error(
        "BotBehavior is abstract and cannot be instantiated directly",
      );
    }
    super(name);
  }

  /**
   * @param {FriendlyBot} bot
   * @param {Player} player
   * @param {Enemy[]} enemies
   * @param {number[][]} map
   * @param {number} deltaTime
   * @abstract
   */
  execute(_bot, _player, _enemies, _map, _deltaTime) {
    throw new Error("execute() must be implemented by subclass");
  }

  // ─── Bot-specific helpers ─────────────────────────────────────────────────

  /**
   * Find the nearest living enemy within range that the bot can see.
   * @param {FriendlyBot} bot
   * @param {Enemy[]} enemies
   * @param {number[][]} map
   * @param {number} range
   * @returns {Enemy|null}
   */
  _findTarget(bot, enemies, map, range) {
    let best = null;
    let bestDist = range;
    for (const enemy of enemies) {
      if (enemy.isDead) {
        continue;
      }
      const d = this._distance(bot.x, bot.y, enemy.x, enemy.y);
      if (
        d < bestDist &&
        this._isPathClear(bot.x, bot.y, enemy.x, enemy.y, map)
      ) {
        bestDist = d;
        best = enemy;
      }
    }
    return best;
  }

  /**
   * Deal damage to target using a distance-appropriate weapon profile from
   * GameConfig.BOT.BOT_WEAPONS. Fires the eventManager so enemy deaths trigger
   * victory checks. Also plays a gunshot sound via bot.audioSystem.
   * @param {FriendlyBot} bot
   * @param {Enemy} target
   * @returns {boolean} True when a shot was fired.
   */
  _tryAttack(bot, target) {
    const dist = this._distance(bot.x, bot.y, target.x, target.y);

    const profile = GameConfig.BOT.BOT_WEAPONS.find((w) => dist < w.maxRange);

    bot.weaponType = profile.type;

    const now = Date.now();
    if (now - bot.lastAttackTime >= profile.cooldown) {
      target.takeDamage(profile.damage, bot.eventManager, {
        x: bot.x,
        y: bot.y,
      });
      bot.lastAttackTime = now;
      bot.angle = bot.angleTo(target.x, target.y);
      if (bot.audioSystem) {
        bot.audioSystem.playSound("shoot");
      }
      return true;
    }
    return false;
  }

  /**
   * Navigate toward a combat target and fire when close enough.
   * Uses GameConfig.BOT.ENGAGE_BUFFER as the movement threshold.
   * @param {FriendlyBot} bot
   * @param {Enemy} target
   * @param {number[][]} map
   * @protected
   */
  _engageTarget(bot, target, map) {
    const dist = this._distance(bot.x, bot.y, target.x, target.y);
    if (dist > GameConfig.BOT.ENGAGE_BUFFER) {
      this._navigateTowards(bot, target.x, target.y, bot.speed, map);
    }
    this._tryAttack(bot, target);
  }
}
