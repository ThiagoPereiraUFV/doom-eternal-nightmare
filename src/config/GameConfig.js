/**
 * Centralized Game Configuration
 * Single source of truth for all game constants
 * Following SRP - only configuration data
 */

export const GameConfig = {
  // Canvas settings
  CANVAS: {
    // Logical weapon-view size used by the overlay renderer.
    WEAPON_WIDTH: 600,
    WEAPON_HEIGHT: 400,
  },

  // Player configuration
  PLAYER: {
    // Default spawn tile in generated maps.
    SPAWN_X: 3,
    SPAWN_Y: 3,

    // Radius used for wall collision clearance.
    COLLISION_RADIUS: 0.2,

    // Core survivability values.
    MAX_HEALTH: 100,
    MAX_STAMINA: 100,

    // Movement and turning speed tuning.
    MOVE_SPEED: 0.05,
    SPRINT_MULTIPLIER: 1.8,
    ROTATION_SPEED: 0.03,

    // Stamina drain/recovery applied every update tick.
    STAMINA_DRAIN: 0.5,
    STAMINA_RECOVERY: 0.3,

    // Per-frame decay applied to camera shake after firing or taking damage.
    SCREEN_SHAKE_DECAY: 0.8,
  },

  // Input configuration
  INPUT: {
    // Pointer-lock mouse look multiplier.
    MOUSE_SENSITIVITY: 0.002,

    // Touch look delta multiplier.
    TOUCH_SENSITIVITY: 0.003,

    // Clamp vertical look so the camera never flips.
    MAX_LOOK_PITCH: Math.PI * 0.45,

    // Control schemes the game can switch between.
    VALID_CONTROL_TYPES: ["keyboard", "touch"],
  },

  // Rendering
  RENDERING: {
    // Base field of view used for hip-fire.
    FOV: Math.PI / 3,

    // Legacy raycast settings still used by gameplay logic and visibility checks.
    RAY_COUNT: 120,
    WALL_HEIGHT_RATIO: 0.6,
    MAX_RENDER_DISTANCE: 20,
  },

  // Map generation
  MAP: {
    // Default procedural map size used outside the spawn-map flow.
    DEFAULT_SIZE: 20,

    // Larger intro/spawn arena size.
    SPAWN_SIZE: 30,

    // Cellular automata controls.
    FILL_RATIO: 0.55,
    SMOOTHING_ITERATIONS: 3,
    WALL_THRESHOLD: 4,

    // Safe-zone and corridor carving around the player spawn.
    SPAWN_SAFE_ZONE: 12,
    SPAWN_CORRIDOR_LENGTH: 20,
    SPAWN_CORRIDOR_GRID: 5,
    MAIN_CORRIDOR_START: 10,
    MAIN_CORRIDOR_SPACING: 12,

    // Integer wall ids and cumulative random thresholds.
    WALL_TYPES: {
      CONCRETE: 1,
      BRICK: 2,
      METAL: 3,
      STONE: 4,
      CONCRETE_CHANCE: 0.25,
      BRICK_CHANCE: 0.5,
      METAL_CHANCE: 0.75,
    },
  },

  // Enemy configuration
  ENEMY: {
    // Spawn budget and placement constraints.
    DEFAULT_SPAWN_COUNT: 50,
    MAX_SPAWN_ATTEMPTS: 1000,
    SPAWN_MIN_OFFSET: 10,
    SPAWN_MARGIN: 20,
    MIN_PLAYER_DISTANCE: 10,

    // AI behavior
    CHASE_DISTANCE: 12,
    LOSE_CHASE_DISTANCE: 15,
    MIN_MOVE_DISTANCE: 0.5,
    STRAFE_DISTANCE: 5,
    STRAFE_CHANCE: 0.3,
    STRAFE_PERPENDICULAR: 0.5,
    SEARCH_ARRIVAL_THRESHOLD: 0.5,
    PATROL_CHANGE_CHANCE: 0.02,
    PATROL_WANDER_RANGE: 4,
    PATROL_MIN_DISTANCE: 0.1,
    STUCK_THRESHOLD: 20,
    UNSTUCK_DISTANCE: 2,
    PATROL_SPEED_MULT: 0.5,
    SEARCH_SPEED_MULT: 0.7,

    // AI state name constants — single source of truth for all setState() calls
    AI_STATES: {
      CHASE: "chase",
      PATROL: "patrol",
      SEARCH: "search",
    },

    // Combat
    ATTACK_DISTANCE: 0.8,
    ATTACK_COOLDOWN: 1000,
    ATTACK_DAMAGE: 10,

    // Enemy archetypes are defined in src/entities/models/ and registered
    // automatically via EntityRegistry. Use EnemyFactory.getTypes() at runtime
    // to obtain the current list of available types.
  },

  // Combat
  COMBAT: {
    // Shot origin height from the floor, matching the first-person camera.
    SHOT_ORIGIN_HEIGHT: 0.5,

    // Minimum damage multiplier once range falloff bottoms out.
    DAMAGE_FALLOFF_MIN: 0.3,

    // Distance where ranged damage starts to lose effectiveness.
    DAMAGE_FALLOFF_RANGE: 15,

    // Hitbox radius used by weapon raycasts.
    ENEMY_HIT_RADIUS: 0.3,
    get ENEMY_HIT_RADIUS_SQ() {
      return this.ENEMY_HIT_RADIUS ** 2;
    },

    // Radius used for entity-entity separation (enemies, bots, player).
    ENTITY_COLLISION_RADIUS: 0.3,

    // Camera feedback and post-death delay.
    SCREEN_SHAKE_INTENSITY: 12,
    GAME_OVER_DELAY: 500,
  },

  // Visual effects
  EFFECTS: {
    // Cap and cull distance for blood splatter effects.
    MAX_BLOOD_SPLATTERS: 100,
    BLOOD_RENDER_DISTANCE: 6,

    // Global screen-space effect timings.
    MUZZLE_FLASH_DURATION: 50,
    VIGNETTE_INTENSITY: 0.3,

    // ADS focus overlay tuning.
    ADS_FOCUS: {
      // Master multiplier for how aggressive the blur/tint feels.
      INTENSITY: 1,

      // Blur radius range in px as zoom increases.
      BLUR_MIN: 2,
      BLUR_MAX: 6,

      // Central clear window size in percent of viewport.
      CLEAR_RADIUS_MIN: 20,
      CLEAR_RADIUS_MAX: 40,

      // Soft edge width between the clear center and blurred periphery.
      FEATHER_MIN: 6,
      FEATHER_MAX: 8,

      // Peripheral darkening range layered with the blur mask.
      TINT_MIN: 0,
      TINT_MAX: 0,
    },
  },

  // Audio
  AUDIO: {
    // Step cadence in ms for walking and sprinting.
    FOOTSTEP_INTERVAL: 400,
    FOOTSTEP_INTERVAL_SPRINT: 300,

    // Ambient loop timing and relative music bus gain.
    AMBIENCE_INTERVAL: 3000,
    MUSIC_VOLUME: 0.75,
    MUSIC_LOOP_DURATION: 8, // seconds
  },

  // Friendly bot configuration
  BOT: {
    HEALTH: 100,
    SPEED: 0.04,

    // Range within which a bot will engage enemies.
    ATTACK_RANGE: 9,

    // Damage dealt per shot and cooldown between shots (ms).
    ATTACK_DAMAGE: 25,
    ATTACK_COOLDOWN: 700,

    // Follow-mode formation tuning.
    FOLLOW_DESIRED_DISTANCE: 2.5,
    FOLLOW_MAX_DISTANCE: 8,

    // How often a searching bot picks a new wander target (ms).
    SEARCH_WANDER_INTERVAL: 3000,

    // Wander radius for search_clear mode (min and range, in tiles).
    SEARCH_WANDER_MIN_DIST: 3,
    SEARCH_WANDER_RANGE: 8,

    // Max random attempts when picking a walkable wander position.
    SEARCH_WANDER_ATTEMPTS: 20,

    // Minimum distance to a combat target before the bot navigates toward it.
    ENGAGE_BUFFER: 1.2,

    // Preferred standoff distance from an enemy during combat.
    // Bots will back away when closer than this to avoid melee damage.
    COMBAT_DISTANCE: 4.0,

    // Max bots allowed in Custom difficulty.
    MAX_COUNT: 5,

    // Command identifiers (single source of truth).
    COMMANDS: {
      FOLLOW: "follow",
      SEARCH_CLEAR: "search_clear",
      STOP: "stop",
    },

    // Weapon profiles used by bots — ordered from closest to farthest range.
    // _tryAttack selects the first entry whose maxRange exceeds the distance to target.
    BOT_WEAPONS: [
      { maxRange: 3.5, type: "shotgun", damage: 40, cooldown: 900 },
      { maxRange: 7.5, type: "pistol", damage: 25, cooldown: 600 },
      { maxRange: Infinity, type: "sniper", damage: 60, cooldown: 1400 },
    ],
  },

  // Difficulty presets
  // Each key overrides the corresponding base config at game start.
  DIFFICULTY: {
    // Beginner preset: high survivability and generous resources.
    EASY: {
      id: "easy",
      label: "EASY",
      description: "More ammo, forgiving combat",
      // Player
      maxHealth: 150,
      maxStamina: 150,
      staminaDrain: 0.25,
      staminaRecovery: 0.5,
      // Weapons — ammo multiplier applied to reserveAmmo
      ammoMultiplier: 2.0,
      // Enemies
      enemyCount: 25,
      enemyHealthMult: 0.6,
      enemySpeedMult: 0.75,
      enemyDamage: 6,
      // Map
      fillRatio: 0.45, // fewer walls → more open
      smoothIterations: 4,
      // Lighting
      ambientIntensity: 1.8,
      fogDensity: 0.04,
      flashlightIntensity: 5.0,
      // Gameplay
      autoReload: true,
      aimAssist: true,
      availableGuns: [
        "pistol",
        "shotgun",
        "rifle",
        "smg",
        "sniper",
        "grenade_launcher",
        "plasma",
      ],
      // Friendly bots
      botCount: 3,
    },

    // Default preset: balanced values across combat, map density, and lighting.
    MEDIUM: {
      id: "medium",
      label: "MEDIUM",
      description: "Balanced challenge",
      maxHealth: 100,
      maxStamina: 100,
      staminaDrain: 0.5,
      staminaRecovery: 0.3,
      ammoMultiplier: 1.0,
      enemyCount: 50,
      enemyHealthMult: 1.0,
      enemySpeedMult: 1.0,
      enemyDamage: 10,
      fillRatio: 0.55,
      smoothIterations: 3,
      ambientIntensity: 1.2,
      fogDensity: 0.06,
      flashlightIntensity: 3.5,
      // Gameplay
      autoReload: true,
      aimAssist: true,
      availableGuns: [
        "pistol",
        "shotgun",
        "rifle",
        "smg",
        "sniper",
        "grenade_launcher",
        "plasma",
      ],
      // Friendly bots
      botCount: 2,
    },

    // Pressure preset: reduced resources and tougher enemies.
    HARD: {
      id: "hard",
      label: "HARD",
      description: "Scarce ammo, tougher enemies",
      maxHealth: 75,
      maxStamina: 75,
      staminaDrain: 0.8,
      staminaRecovery: 0.2,
      ammoMultiplier: 0.6,
      enemyCount: 80,
      enemyHealthMult: 1.5,
      enemySpeedMult: 1.25,
      enemyDamage: 16,
      fillRatio: 0.62,
      smoothIterations: 2,
      ambientIntensity: 0.7,
      fogDensity: 0.09,
      flashlightIntensity: 2.2,
      // Gameplay
      autoReload: false,
      aimAssist: false,
      availableGuns: ["pistol", "shotgun", "rifle", "smg"],
      // Friendly bots
      botCount: 1,
    },

    // Punishing preset: low health, dense maps, and minimal lighting support.
    IMPOSSIBLE: {
      id: "impossible",
      label: "IMPOSSIBLE",
      description: "One mistake and you're dead",
      maxHealth: 40,
      maxStamina: 50,
      staminaDrain: 1.2,
      staminaRecovery: 0.1,
      ammoMultiplier: 25,
      enemyCount: 120,
      enemyHealthMult: 2.2,
      enemySpeedMult: 1.6,
      enemyDamage: 25,
      fillRatio: 0.68,
      smoothIterations: 1,
      ambientIntensity: 0.3,
      fogDensity: 0.14,
      flashlightIntensity: 1.4,
      // Gameplay
      autoReload: false,
      aimAssist: false,
      availableGuns: ["pistol"],
      // Friendly bots — none on impossible
      botCount: 0,
    },

    // Custom difficulty — defaults mirror MEDIUM; overridden at runtime by the UI
    CUSTOM: {
      id: "custom",
      label: "CUSTOM",
      description: "Your rules",
      maxHealth: 100,
      maxStamina: 100,
      staminaDrain: 0.5,
      staminaRecovery: 0.3,
      ammoMultiplier: 1.0,
      enemyCount: 50,
      enemyHealthMult: 1.0,
      enemySpeedMult: 1.0,
      enemyDamage: 10,
      fillRatio: 0.55,
      smoothIterations: 3,
      ambientIntensity: 1.2,
      fogDensity: 0.06,
      flashlightIntensity: 3.5,
      // Gameplay
      autoReload: true,
      aimAssist: false,
      availableGuns: [
        "pistol",
        "shotgun",
        "rifle",
        "smg",
        "sniper",
        "grenade_launcher",
        "plasma",
      ],
      // Friendly bots
      botCount: 3,
    },
  },

  /**
   * Schema for every difficulty variable that should appear in the Custom modal.
   * Adding a new entry here is the only step needed to expose a variable in the UI.
   * Fields:
   *   key          – property name on the difficulty object
   *   group        – section header in the modal
   *   type         – 'range' | 'checkbox' | 'guns'
   *   label        – human-readable label
   *   min/max/step – (range only) slider bounds
   *   format       – (range only) fn(value: string) → display string
   *   options      – (guns only) ordered list of gun ids
   */
  DIFFICULTY_SCHEMA: [
    // Player
    {
      key: "maxHealth",
      group: "PLAYER",
      type: "range",
      label: "Health",
      min: 20,
      max: 200,
      step: 5,
      format: (v) => String(Math.round(v)),
    },
    {
      key: "maxStamina",
      group: "PLAYER",
      type: "range",
      label: "Stamina",
      min: 20,
      max: 200,
      step: 5,
      format: (v) => String(Math.round(v)),
    },
    {
      key: "staminaDrain",
      group: "PLAYER",
      type: "range",
      label: "Stamina drain",
      min: 0.05,
      max: 2,
      step: 0.05,
      format: (v) => parseFloat(v).toFixed(2),
    },
    {
      key: "staminaRecovery",
      group: "PLAYER",
      type: "range",
      label: "Stamina recovery",
      min: 0.05,
      max: 1,
      step: 0.05,
      format: (v) => parseFloat(v).toFixed(2),
    },
    // Weapons
    {
      key: "ammoMultiplier",
      group: "WEAPONS",
      type: "range",
      label: "Ammo multiplier",
      min: 0.1,
      max: 4,
      step: 0.05,
      format: (v) => `\u00d7${parseFloat(v).toFixed(2)}`,
    },
    // Enemies
    {
      key: "enemyCount",
      group: "ENEMIES",
      type: "range",
      label: "Count",
      min: 5,
      max: 200,
      step: 5,
      format: (v) => String(Math.round(v)),
    },
    {
      key: "enemyHealthMult",
      group: "ENEMIES",
      type: "range",
      label: "Health mult",
      min: 0.25,
      max: 4,
      step: 0.05,
      format: (v) => `\u00d7${parseFloat(v).toFixed(2)}`,
    },
    {
      key: "enemySpeedMult",
      group: "ENEMIES",
      type: "range",
      label: "Speed mult",
      min: 0.25,
      max: 3,
      step: 0.05,
      format: (v) => `\u00d7${parseFloat(v).toFixed(2)}`,
    },
    {
      key: "enemyDamage",
      group: "ENEMIES",
      type: "range",
      label: "Damage",
      min: 1,
      max: 50,
      step: 1,
      format: (v) => String(Math.round(v)),
    },
    // Environment
    {
      key: "fillRatio",
      group: "ENVIRONMENT",
      type: "range",
      label: "Map density",
      min: 0.3,
      max: 0.8,
      step: 0.01,
      format: (v) => parseFloat(v).toFixed(2),
    },
    {
      key: "smoothIterations",
      group: "ENVIRONMENT",
      type: "range",
      label: "Map smoothing",
      min: 0,
      max: 6,
      step: 1,
      format: (v) => String(Math.round(v)),
    },
    {
      key: "ambientIntensity",
      group: "ENVIRONMENT",
      type: "range",
      label: "Ambient light",
      min: 0.1,
      max: 3,
      step: 0.05,
      format: (v) => parseFloat(v).toFixed(2),
    },
    {
      key: "fogDensity",
      group: "ENVIRONMENT",
      type: "range",
      label: "Fog density",
      min: 0.01,
      max: 0.3,
      step: 0.005,
      format: (v) => parseFloat(v).toFixed(3),
    },
    {
      key: "flashlightIntensity",
      group: "ENVIRONMENT",
      type: "range",
      label: "Flashlight",
      min: 0,
      max: 8,
      step: 0.1,
      format: (v) => parseFloat(v).toFixed(2),
    },
    // Gameplay
    {
      key: "autoReload",
      group: "GAMEPLAY",
      type: "checkbox",
      label: "Auto reload",
    },
    {
      key: "aimAssist",
      group: "GAMEPLAY",
      type: "checkbox",
      label: "Aim assist",
    },
    {
      key: "botCount",
      group: "GAMEPLAY",
      type: "range",
      label: "Friendly bots",
      min: 0,
      max: 5,
      step: 1,
      format: (v) => String(Math.round(v)),
    },
    {
      key: "availableGuns",
      group: "GAMEPLAY",
      type: "guns",
      label: "Available guns",
      options: [
        "pistol",
        "shotgun",
        "rifle",
        "smg",
        "sniper",
        "grenade_launcher",
        "plasma",
      ],
    },
  ],

  // 3D Weapon rendering
  WEAPON_3D: {
    // Default anchored screen position for the weapon rig.
    POSITION_X_RATIO: 0.65,
    POSITION_Y_RATIO: 0.85,
    AIM_CENTER_Y_RATIO: 0.4,

    // Idle motion and recoil recovery.
    BOB_INTENSITY: 5,
    RECOIL_DECAY: 0.85,
    SWAY_DAMPENING: 0.85,

    // Sprite skew/perspective compensation for fake depth.
    PERSPECTIVE_STRENGTH: 0.15,
    PERSPECTIVE_VERTICAL_SKEW: 0.1,
    PERSPECTIVE_HORIZONTAL_SKEW: 0.05,

    // Drop-shadow tuning for the weapon overlay.
    SHADOW_ALPHA: 0.3,
    SHADOW_OFFSET: 5,

    // Post-lighting color grading on weapon sprites.
    BRIGHTNESS: 1.2,
    CONTRAST: 1.1,
    SATURATION: 1.3,

    // Highlight pass for metallic edges.
    HIGHLIGHT_ALPHA: 0.1,
    HIGHLIGHT_BRIGHTNESS: 2,
    HIGHLIGHT_OFFSET: -2,

    // Final sprite placement offsets after transforms are applied.
    SPRITE_HORIZONTAL_OFFSET: 0.5,
    SPRITE_VERTICAL_OFFSET: 0.8,
  },
};

export default GameConfig;
