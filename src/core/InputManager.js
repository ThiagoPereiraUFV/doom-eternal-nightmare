/**
 * Input Manager
 * Handles keyboard and mouse input
 * Following SRP - only input handling
 */

export class InputManager {
  constructor(canvas, eventManager) {
    this.canvas = canvas;
    this.eventManager = eventManager;

    this.keys = {};
    this.mouse = {
      x: 0,
      y: 0,
      leftButton: false,
      rightButton: false,
    };

    this._setupListeners();
  }

  /**
   * Setup event listeners
   * @private
   */
  _setupListeners() {
    // Keyboard events
    window.addEventListener("keydown", (e) => this._handleKeyDown(e));
    window.addEventListener("keyup", (e) => this._handleKeyUp(e));

    // Mouse events
    this.canvas.addEventListener("mousemove", (e) => this._handleMouseMove(e));
    this.canvas.addEventListener("mousedown", (e) => this._handleMouseDown(e));
    this.canvas.addEventListener("mouseup", (e) => this._handleMouseUp(e));

    // Context menu prevention
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  /**
   * Handle key down event
   * @private
   */
  _handleKeyDown(e) {
    this.keys[e.key.toLowerCase()] = true;
    this.eventManager.emit("keydown", e.key);
  }

  /**
   * Handle key up event
   * @private
   */
  _handleKeyUp(e) {
    this.keys[e.key.toLowerCase()] = false;
    this.eventManager.emit("keyup", e.key);
  }

  /**
   * Handle mouse move event
   * @private
   */
  _handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
    this.eventManager.emit("mousemove", this.mouse);
  }

  /**
   * Handle mouse down event
   * @private
   */
  _handleMouseDown(e) {
    if (e.button === 0) {
      this.mouse.leftButton = true;
      this.eventManager.emit("mousedown", "left");
    } else if (e.button === 2) {
      this.mouse.rightButton = true;
      this.eventManager.emit("mousedown", "right");
    }
  }

  /**
   * Handle mouse up event
   * @private
   */
  _handleMouseUp(e) {
    if (e.button === 0) {
      this.mouse.leftButton = false;
      this.eventManager.emit("mouseup", "left");
    } else if (e.button === 2) {
      this.mouse.rightButton = false;
      this.eventManager.emit("mouseup", "right");
    }
  }

  /**
   * Check if key is pressed
   * @param {string} key - Key to check
   * @returns {boolean} True if key is pressed
   */
  isKeyPressed(key) {
    return !!this.keys[key.toLowerCase()];
  }

  /**
   * Check if any of multiple keys are pressed
   * @param {...string} keys - Keys to check
   * @returns {boolean} True if any key is pressed
   */
  isAnyKeyPressed(...keys) {
    return keys.some((key) => this.isKeyPressed(key));
  }

  /**
   * Check if all keys are pressed
   * @param {...string} keys - Keys to check
   * @returns {boolean} True if all keys are pressed
   */
  areAllKeysPressed(...keys) {
    return keys.every((key) => this.isKeyPressed(key));
  }

  /**
   * Get mouse position
   * @returns {{x: number, y: number}} Mouse position
   */
  getMousePosition() {
    return { x: this.mouse.x, y: this.mouse.y };
  }

  /**
   * Check if mouse button is pressed
   * @param {string} button - 'left' or 'right'
   * @returns {boolean} True if button is pressed
   */
  isMouseButtonPressed(button) {
    return button === "left" ? this.mouse.leftButton : this.mouse.rightButton;
  }

  /**
   * Clear all input states
   */
  clear() {
    this.keys = {};
    this.mouse.leftButton = false;
    this.mouse.rightButton = false;
  }
}

export default InputManager;
