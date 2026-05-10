/**
 * Touch Input Manager
 * Handles touch controls for mobile devices
 * Following SRP - only touch input handling
 */

export class TouchInputManager {
  /**
   * Create a TouchInputManager
   * @param {EventManager} eventManager - Event manager for publishing input events
   */
  constructor(eventManager) {
    this.eventManager = eventManager;

    // Constants
    this.JOYSTICK_MAX_DISTANCE = 50; // pixels
    this.JOYSTICK_CENTER_POSITION = 25; // Center position as percentage of joystick element
    this.JOYSTICK_MOVEMENT_RANGE = 25; // Maximum movement range as percentage

    // Virtual joystick state
    this.joystick = {
      active: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      deltaX: 0,
      deltaY: 0,
    };

    // Look area state
    this.lookArea = {
      active: false,
      lastX: 0,
      lastY: 0,
      deltaX: 0,
      deltaY: 0,
    };

    // Elements
    this.touchControls = document.getElementById("touchControls");
    this.joystickElement = document.getElementById("touchJoystick");
    this.joystickStick = document.getElementById("joystickStick");
    this.lookAreaElement = document.getElementById("touchLookArea");

    // Validate elements exist
    if (!this.touchControls || !this.joystickElement || !this.lookAreaElement) {
      console.warn("Touch control elements not found in DOM");
    }

    this._setupListeners();
  }

  /**
   * Enable touch controls
   */
  enable() {
    if (this.touchControls) {
      this.touchControls.classList.add("active");
    }
  }

  /**
   * Disable touch controls
   */
  disable() {
    if (this.touchControls) {
      this.touchControls.classList.remove("active");
    }
    this._resetState();
  }

  /**
   * Setup touch event listeners
   * @private
   */
  _setupListeners() {
    // Joystick
    if (this.joystickElement) {
      this.joystickElement.addEventListener("touchstart", (e) =>
        this._handleJoystickStart(e),
      );
      this.joystickElement.addEventListener("touchmove", (e) =>
        this._handleJoystickMove(e),
      );
      this.joystickElement.addEventListener("touchend", (e) =>
        this._handleJoystickEnd(e),
      );
      this.joystickElement.addEventListener("touchcancel", (e) =>
        this._handleJoystickEnd(e),
      );
    }

    // Look area
    if (this.lookAreaElement) {
      this.lookAreaElement.addEventListener("touchstart", (e) =>
        this._handleLookStart(e),
      );
      this.lookAreaElement.addEventListener("touchmove", (e) =>
        this._handleLookMove(e),
      );
      this.lookAreaElement.addEventListener("touchend", (e) =>
        this._handleLookEnd(e),
      );
      this.lookAreaElement.addEventListener("touchcancel", (e) =>
        this._handleLookEnd(e),
      );
    }
  }

  /**
   * Handle joystick touch start
   * @private
   */
  _handleJoystickStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = this.joystickElement.getBoundingClientRect();

    this.joystick.active = true;
    this.joystick.startX = rect.left + rect.width / 2;
    this.joystick.startY = rect.top + rect.height / 2;
    this.joystick.currentX = touch.clientX;
    this.joystick.currentY = touch.clientY;

    this._updateJoystick();
  }

  /**
   * Handle joystick touch move
   * @private
   */
  _handleJoystickMove(e) {
    e.preventDefault();
    if (!this.joystick.active) {
      return;
    }

    const touch = e.touches[0];
    this.joystick.currentX = touch.clientX;
    this.joystick.currentY = touch.clientY;

    this._updateJoystick();
  }

  /**
   * Handle joystick touch end
   * @private
   */
  _handleJoystickEnd(e) {
    e.preventDefault();
    this.joystick.active = false;
    this.joystick.deltaX = 0;
    this.joystick.deltaY = 0;

    // Reset stick position
    if (this.joystickStick) {
      this.joystickStick.style.left = `${this.JOYSTICK_CENTER_POSITION}%`;
      this.joystickStick.style.top = `${this.JOYSTICK_CENTER_POSITION}%`;
    }
  }

  /**
   * Calculate joystick stick position as percentage
   * @private
   * @param {number} clampedValue - Clamped position value
   * @returns {number} Position as percentage
   */
  _calculateStickPosition(clampedValue) {
    return (
      this.JOYSTICK_CENTER_POSITION +
      (clampedValue / this.JOYSTICK_MAX_DISTANCE) * this.JOYSTICK_MOVEMENT_RANGE
    );
  }

  /**
   * Update joystick state
   * @private
   */
  _updateJoystick() {
    const dx = this.joystick.currentX - this.joystick.startX;
    const dy = this.joystick.currentY - this.joystick.startY;

    // Limit to joystick radius
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    const clampedDistance = Math.min(distance, this.JOYSTICK_MAX_DISTANCE);
    const clampedX = Math.cos(angle) * clampedDistance;
    const clampedY = Math.sin(angle) * clampedDistance;

    // Normalize to -1 to 1 range
    this.joystick.deltaX = clampedX / this.JOYSTICK_MAX_DISTANCE;
    this.joystick.deltaY = clampedY / this.JOYSTICK_MAX_DISTANCE;

    // Update visual position
    if (this.joystickStick) {
      const stickX = this._calculateStickPosition(clampedX);
      const stickY = this._calculateStickPosition(clampedY);
      this.joystickStick.style.left = `${stickX}%`;
      this.joystickStick.style.top = `${stickY}%`;
    }
  }

  /**
   * Handle look area touch start
   * @private
   */
  _handleLookStart(e) {
    e.preventDefault();
    const touch = e.touches[0];

    this.lookArea.active = true;
    this.lookArea.lastX = touch.clientX;
    this.lookArea.lastY = touch.clientY;
  }

  /**
   * Handle look area touch move
   * @private
   */
  _handleLookMove(e) {
    e.preventDefault();
    if (!this.lookArea.active) {
      return;
    }

    const touch = e.touches[0];

    this.lookArea.deltaX = touch.clientX - this.lookArea.lastX;
    this.lookArea.deltaY = touch.clientY - this.lookArea.lastY;

    this.lookArea.lastX = touch.clientX;
    this.lookArea.lastY = touch.clientY;
  }

  /**
   * Handle look area touch end
   * @private
   */
  _handleLookEnd(e) {
    e.preventDefault();
    this.lookArea.active = false;
    this.lookArea.deltaX = 0;
    this.lookArea.deltaY = 0;
  }

  /**
   * Get movement input (-1 to 1)
   * @returns {{forward: number, strafe: number}}
   */
  getMovement() {
    return {
      forward: -this.joystick.deltaY, // Inverted Y
      strafe: this.joystick.deltaX,
    };
  }

  /**
   * Get look delta
   * @returns {{x: number, y: number}}
   */
  getLookDelta() {
    const delta = {
      x: this.lookArea.deltaX,
      y: this.lookArea.deltaY,
    };

    // Reset delta after reading (consumed)
    this.lookArea.deltaX = 0;
    this.lookArea.deltaY = 0;

    return delta;
  }

  /**
   * Reset all touch input state
   * @private
   */
  _resetState() {
    this.joystick.active = false;
    this.joystick.deltaX = 0;
    this.joystick.deltaY = 0;

    this.lookArea.active = false;
    this.lookArea.deltaX = 0;
    this.lookArea.deltaY = 0;

    if (this.joystickStick) {
      this.joystickStick.style.left = `${this.JOYSTICK_CENTER_POSITION}%`;
      this.joystickStick.style.top = `${this.JOYSTICK_CENTER_POSITION}%`;
    }
  }
}

export default TouchInputManager;
