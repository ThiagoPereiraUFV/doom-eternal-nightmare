/**
 * BotBehavior — Abstract base for friendly-bot AI states.
 * Mirrors AIBehavior but with an extended execute signature that includes the
 * full enemies list so bots can pick combat targets.
 */

export class BotBehavior {
  constructor(name) {
    if (new.target === BotBehavior) {
      throw new Error(
        "BotBehavior is abstract and cannot be instantiated directly",
      );
    }
    this.name = name;
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

  /** Optional lifecycle hook called when the state is entered. */
  enter(_bot) {}

  /** Optional lifecycle hook called when the state is exited. */
  exit(_bot) {}

  // ─── Shared helpers ──────────────────────────────────────────────

  _distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Attempt to move entity toward (targetX, targetY) at speed.
   * Returns true if the move succeeded (tile is walkable).
   */
  _moveTo(entity, targetX, targetY, speed, map) {
    const dx = targetX - entity.x;
    const dy = targetY - entity.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.001) {
      return true;
    }
    const nx = entity.x + (dx / dist) * speed;
    const ny = entity.y + (dy / dist) * speed;
    const tx = Math.floor(nx);
    const ty = Math.floor(ny);
    if (
      ty >= 0 &&
      ty < map.length &&
      tx >= 0 &&
      tx < map[0].length &&
      map[ty][tx] === 0
    ) {
      entity.x = nx;
      entity.y = ny;
      entity.angle = Math.atan2(dy, dx);
      return true;
    }
    return false;
  }

  /**
   * Navigate around corners if the direct path is blocked.
   */
  _navigate(entity, targetX, targetY, speed, map) {
    if (this._moveTo(entity, targetX, targetY, speed, map)) {
      return true;
    }
    const angle = Math.atan2(targetY - entity.y, targetX - entity.x);
    for (const offset of [
      Math.PI / 6,
      -Math.PI / 6,
      Math.PI / 3,
      -Math.PI / 3,
    ]) {
      const tx = entity.x + Math.cos(angle + offset) * speed;
      const ty = entity.y + Math.sin(angle + offset) * speed;
      if (this._moveTo(entity, tx, ty, speed, map)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Line-of-sight check between two world positions.
   */
  _hasLoS(x1, y1, x2, y2, map) {
    const steps = 12;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const cx = Math.floor(x1 + (x2 - x1) * t);
      const cy = Math.floor(y1 + (y2 - y1) * t);
      if (
        cy < 0 ||
        cy >= map.length ||
        cx < 0 ||
        cx >= map[0].length ||
        map[cy][cx] > 0
      ) {
        return false;
      }
    }
    return true;
  }

  /**
   * Find the nearest living enemy within range that the bot can see.
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
      if (d < bestDist && this._hasLoS(bot.x, bot.y, enemy.x, enemy.y, map)) {
        bestDist = d;
        best = enemy;
      }
    }
    return best;
  }

  /**
   * Deal damage to target using a distance-appropriate weapon profile.
   * Fires the eventManager so enemy deaths trigger victory checks.
   * Also plays a gunshot sound via bot.audioSystem.
   * @param {FriendlyBot} bot
   * @param {Enemy}       target
   * @returns {boolean} True when a shot was fired.
   */
  _tryAttack(bot, target) {
    const dist = this._distance(bot.x, bot.y, target.x, target.y);

    // Weapon selection by distance
    let weaponType, damage, cooldown;
    if (dist < 3.5) {
      weaponType = "shotgun";
      damage = 40;
      cooldown = 900;
    } else if (dist < 7.5) {
      weaponType = "pistol";
      damage = 25;
      cooldown = 600;
    } else {
      weaponType = "sniper";
      damage = 60;
      cooldown = 1400;
    }

    bot.weaponType = weaponType;

    const now = Date.now();
    if (now - bot.lastAttackTime >= cooldown) {
      target.takeDamage(damage, bot.eventManager, {
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
}
