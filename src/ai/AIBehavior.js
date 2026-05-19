/**
 * Base AI Behavior Class - Strategy Pattern
 * Different AI behaviors implement this interface.
 * Following OCP - new behaviors extend without modifying base.
 *
 * Movement, LoS, and distance helpers are inherited from BaseBehavior.
 */

import { BaseBehavior } from "./BaseBehavior.js";

export class AIBehavior extends BaseBehavior {
  constructor(name) {
    if (new.target === AIBehavior) {
      throw new Error(
        "AIBehavior is an abstract class and cannot be instantiated directly",
      );
    }
    super(name);
  }

  /**
   * Execute the behavior (must be implemented by subclasses).
   * @param {Enemy} enemy - Enemy executing the behavior
   * @param {Player} player - Player reference
   * @param {Array} map - Game map
   * @param {number} deltaTime - Time since last frame
   * @param {FriendlyBot[]} bots - Living allied bots
   * @abstract
   */
  execute(_enemy, _player, _map, _deltaTime, _bots) {
    throw new Error("execute() must be implemented by subclass");
  }
}
