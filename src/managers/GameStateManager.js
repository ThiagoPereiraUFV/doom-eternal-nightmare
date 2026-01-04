/**
 * Game State Manager - Singleton + State Pattern
 * Manages game state transitions
 * Following SRP - only state management
 */

export const GameStates = {
  LOADING: "loading",
  MENU: "menu",
  PLAYING: "playing",
  PAUSED: "paused",
  GAME_OVER: "gameover",
  VICTORY: "victory",
};

export class GameStateManager {
  static _instance = null;

  constructor() {
    if (GameStateManager._instance) {
      return GameStateManager._instance;
    }

    this._currentState = GameStates.LOADING;
    this._previousState = null;
    this._stateCallbacks = new Map();

    GameStateManager._instance = this;
  }

  /**
   * Get singleton instance
   * @returns {GameStateManager} Singleton instance
   */
  static getInstance() {
    if (!GameStateManager._instance) {
      new GameStateManager();
    }
    return GameStateManager._instance;
  }

  /**
   * Get current state
   * @returns {string} Current game state
   */
  getCurrentState() {
    return this._currentState;
  }

  /**
   * Get previous state
   * @returns {string|null} Previous game state
   */
  getPreviousState() {
    return this._previousState;
  }

  /**
   * Set game state
   * @param {string} newState - New state to transition to
   * @fires stateChange
   */
  setState(newState) {
    if (!Object.values(GameStates).includes(newState)) {
      console.warn(`Invalid state: ${newState}`);
      return;
    }

    if (this._currentState === newState) {
      return;
    }

    const oldState = this._currentState;
    this._previousState = oldState;
    this._currentState = newState;

    // Call exit callbacks for old state
    this._callStateCallbacks("exit", oldState);

    // Call enter callbacks for new state
    this._callStateCallbacks("enter", newState);

    // Call change callbacks
    this._callStateCallbacks("change", newState, oldState);

    console.log(`State transition: ${oldState} → ${newState}`);
  }

  /**
   * Register callback for state events
   * @param {string} event - Event type ('enter', 'exit', 'change')
   * @param {string} state - State to listen for
   * @param {Function} callback - Callback function
   */
  on(event, state, callback) {
    const key = `${event}:${state}`;

    if (!this._stateCallbacks.has(key)) {
      this._stateCallbacks.set(key, []);
    }

    this._stateCallbacks.get(key).push(callback);
  }

  /**
   * Call callbacks for state event
   * @private
   */
  _callStateCallbacks(event, ...args) {
    const state = args[0];
    const key = `${event}:${state}`;

    if (this._stateCallbacks.has(key)) {
      const callbacks = this._stateCallbacks.get(key);
      callbacks.forEach((callback) => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in state callback for ${key}:`, error);
        }
      });
    }
  }

  /**
   * Check if current state matches
   * @param {string} state - State to check
   * @returns {boolean} True if current state matches
   */
  is(state) {
    return this._currentState === state;
  }

  /**
   * Check if current state is one of multiple states
   * @param {...string} states - States to check
   * @returns {boolean} True if current state matches any
   */
  isAnyOf(...states) {
    return states.includes(this._currentState);
  }
}

export default GameStateManager;
