/**
 * Event Manager - Observer Pattern
 * Handles publish/subscribe event system
 * Following SRP - only event management
 */

export class EventManager {
  constructor() {
    this._events = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Function to call when event fires
   * @returns {Function} Unsubscribe function
   * @example
   * const unsub = EventManager.on('enemyKilled', (enemy) => {
   *   console.log('Enemy killed:', enemy.type);
   * });
   */
  on(eventName, callback) {
    if (!this._events.has(eventName)) {
      this._events.set(eventName, []);
    }

    this._events.get(eventName).push(callback);

    // Return unsubscribe function
    return () => this.off(eventName, callback);
  }

  /**
   * Unsubscribe from an event
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Callback to remove
   */
  off(eventName, callback) {
    if (!this._events.has(eventName)) { return; }

    const callbacks = this._events.get(eventName);
    const index = callbacks.indexOf(callback);

    if (index !== -1) {
      callbacks.splice(index, 1);
    }

    // Clean up empty event arrays
    if (callbacks.length === 0) {
      this._events.delete(eventName);
    }
  }

  /**
   * Emit an event
   * @param {string} eventName - Name of the event
   * @param {...any} args - Arguments to pass to callbacks
   */
  emit(eventName, ...args) {
    if (!this._events.has(eventName)) { return; }

    const callbacks = this._events.get(eventName);

    // Call each callback with provided arguments
    for (const callback of callbacks) {
      try {
        callback(...args);
      } catch {
        // Silently handle errors in event handlers
      }
    }
  }

}

export default EventManager;
