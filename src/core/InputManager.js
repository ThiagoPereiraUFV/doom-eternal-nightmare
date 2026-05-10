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

    // Touch events (mobile)
    this._setupTouchListeners();
  }

  // ─── Touch Controls ──────────────────────────────────────────────
  _setupTouchListeners() {
    this._joystick = {
      active: false, id: null,
      origin: { x: 0, y: 0 },
    };
    this._lookTouch = {
      active: false, id: null,
      last: { x: 0, y: 0 },
    };

    document.addEventListener("touchstart",  (e) => this._onTouchStart(e),  { passive: false });
    document.addEventListener("touchmove",   (e) => this._onTouchMove(e),   { passive: false });
    document.addEventListener("touchend",    (e) => this._onTouchEnd(e),    { passive: false });
    document.addEventListener("touchcancel", (e) => this._onTouchEnd(e),    { passive: false });
  }

  _onTouchStart(e) {
    for (const t of e.changedTouches) {
      // Never intercept touches on interactive UI elements — let click fire
      const el = t.target;
      const tag = (el?.tagName ?? "").toUpperCase();
      if (tag === "BUTTON" || tag === "A" || tag === "INPUT" || tag === "SELECT" || tag === "LABEL") continue;
      // Also skip if the touch is on any element inside an overlay / menu
      if (el?.closest(".overlay-screen, #startScreen, #pauseMenu, .menu-item, .pause-menu-item, #start-btn, .custom-modal, #missionBriefingScreen")) continue;

      const inLeftZone =
        t.clientX < window.innerWidth * 0.40 &&
        t.clientY > window.innerHeight * 0.45;

      if (inLeftZone && !this._joystick.active) {
        e.preventDefault();
        this._joystick.active = true;
        this._joystick.id     = t.identifier;
        this._joystick.origin = { x: t.clientX, y: t.clientY };
        this._updateJoystick(0, 0);
      } else if (!inLeftZone && !this._lookTouch.active) {
        e.preventDefault();
        this._lookTouch.active = true;
        this._lookTouch.id     = t.identifier;
        this._lookTouch.last   = { x: t.clientX, y: t.clientY };
      }
    }
  }

  _onTouchMove(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === this._joystick.id) {
        const dx   = t.clientX - this._joystick.origin.x;
        const dy   = t.clientY - this._joystick.origin.y;
        const maxR = 55;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const cdx  = dist > maxR ? (dx / dist) * maxR : dx;
        const cdy  = dist > maxR ? (dy / dist) * maxR : dy;

        const thr = 14;
        this.keys["w"] = cdy < -thr;
        this.keys["s"] = cdy >  thr;
        this.keys["a"] = cdx < -thr;
        this.keys["d"] = cdx >  thr;

        this._updateJoystick(cdx, cdy);

      } else if (t.identifier === this._lookTouch.id) {
        const dx = t.clientX - this._lookTouch.last.x;
        const dy = t.clientY - this._lookTouch.last.y;
        this._lookTouch.last = { x: t.clientX, y: t.clientY };
        this.eventManager.emit("touchlook", { dx, dy });
      }
    }
  }

  _onTouchEnd(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === this._joystick.id) {
        this._joystick.active = false;
        this._joystick.id     = null;
        this.keys["w"] = false;
        this.keys["s"] = false;
        this.keys["a"] = false;
        this.keys["d"] = false;
        this._updateJoystick(0, 0);
      } else if (t.identifier === this._lookTouch.id) {
        this._lookTouch.active = false;
        this._lookTouch.id     = null;
      }
    }
  }

  /** Move the knob visual relative to joystick base center. */
  _updateJoystick(dx, dy) {
    const knob = document.getElementById("touch-joystick-knob");
    if (knob) {
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }
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
