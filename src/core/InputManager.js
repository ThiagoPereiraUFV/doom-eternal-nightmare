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
   * Check if mouse button is pressed
   * @param {string} button - 'left' or 'right'
   * @returns {boolean} True if button is pressed
   */
  isMouseButtonPressed(button) {
    return button === "left" ? this.mouse.leftButton : this.mouse.rightButton;
  }

}


export default InputManager;
