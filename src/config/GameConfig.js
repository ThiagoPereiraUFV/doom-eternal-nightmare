/**
 * Centralized Game Configuration
 * Single source of truth for all game constants
 * Following SRP - only configuration data
 */

export const GameConfig = {
  // Canvas settings
  CANVAS: {
    WEAPON_WIDTH: 600,
    WEAPON_HEIGHT: 400,
  },

  // Player configuration
  PLAYER: {
    SPAWN_X: 3,
    SPAWN_Y: 3,
    MAX_HEALTH: 100,
    MAX_STAMINA: 100,
    MOVE_SPEED: 0.05,
    SPRINT_MULTIPLIER: 1.8,
    ROTATION_SPEED: 0.03,
    STAMINA_DRAIN: 0.5,
    STAMINA_RECOVERY: 0.3,
    SCREEN_SHAKE_DECAY: 0.8,
  },

  // Input configuration
  INPUT: {
    TOUCH_SENSITIVITY: 0.003,
    VALID_CONTROL_TYPES: ['keyboard', 'touch'],
  },

  // Rendering
  RENDERING: {
    FOV: Math.PI / 3,
    RAY_COUNT: 120,
    WALL_HEIGHT_RATIO: 0.6,
    MAX_RENDER_DISTANCE: 20,
  },

  // Map generation
  MAP: {
    DEFAULT_SIZE: 20,
    SPAWN_SIZE: 30,
    FILL_RATIO: 0.55,
    SMOOTHING_ITERATIONS: 3,
    WALL_THRESHOLD: 4,
    SPAWN_SAFE_ZONE: 12,
    SPAWN_CORRIDOR_LENGTH: 20,
    SPAWN_CORRIDOR_GRID: 5,
    MAIN_CORRIDOR_START: 10,
    MAIN_CORRIDOR_SPACING: 12,
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
    PATROL_SPEED_MULT: 0.5,
    SEARCH_SPEED_MULT: 0.7,

    // AI state name constants — single source of truth for all setState() calls
    AI_STATES: {
      CHASE:  'chase',
      PATROL: 'patrol',
      SEARCH: 'search',
    },

    // Combat
    ATTACK_DISTANCE: 0.8,
    ATTACK_COOLDOWN: 1000,
    ATTACK_DAMAGE: 10,

    // Types
    TYPES: {
      DEMON: {
        type: "demon",
        health: 50,
        speed: 0.025,
        color: { r: 180, g: 40 },
      },
      ZOMBIE: {
        type: "zombie",
        health: 80,
        speed: 0.015,
        color: { r: 120, g: 150 },
      },
      GHOST: {
        type: "ghost",
        health: 30,
        speed: 0.03,
        color: { r: 200, g: 200 },
      },
      BRUTE: {
        type: "brute",
        health: 120,
        speed: 0.01,
        color: { r: 140, g: 60 },
      },
    },
  },

  // Weapon configuration
  WEAPONS: {
    PISTOL: {
      name: "PISTOL",
      maxDistance: 50,
      damage: 20,
      magazineSize: 12,
      reserveAmmo: 48,
      fireRate: 250,
      spread: 0.05,
      reloadTime: 1500,
      penetration: 1,
      bulletSpeed: 50,
      muzzleFlashIntensity: 0.8,
      recoil: 25,
      screenShake: 5,
    },
    SHOTGUN: {
      name: "SHOTGUN",
      maxDistance: 30,
      falloffRange: 10,
      falloffMin: 0.2,
      damage: 15,
      magazineSize: 8,
      reserveAmmo: 24,
      fireRate: 800,
      spread: 0.3,
      pellets: 8,
      reloadTime: 2500,
      penetration: 0.5,
      bulletSpeed: 40,
      muzzleFlashIntensity: 1.5,
      recoil: 40,
      screenShake: 8,
    },
    RIFLE: {
      name: "RIFLE",
      maxDistance: 60,
      falloffMin: 0.5,
      falloffScale: 2,
      damage: 30,
      magazineSize: 30,
      reserveAmmo: 90,
      fireRate: 150,
      spread: 0.02,
      reloadTime: 2000,
      penetration: 2,
      bulletSpeed: 70,
      muzzleFlashIntensity: 1.0,
      recoil: 15,
      screenShake: 3,
    },
    SMG: {
      name: "SMG",
      maxDistance: 45,
      raycastStep: 0.08,
      damage: 14,
      magazineSize: 35,
      reserveAmmo: 140,
      fireRate: 80,
      spread: 0.08,
      reloadTime: 1800,
      penetration: 0.8,
      bulletSpeed: 55,
      muzzleFlashIntensity: 0.7,
      recoil: 10,
      screenShake: 2,
    },
    SNIPER: {
      name: "SNIPER",
      maxDistance: 80,
      raycastStep: 0.05,
      falloffMin: 1.0,
      damage: 120,
      magazineSize: 5,
      reserveAmmo: 20,
      fireRate: 1200,
      spread: 0.002,
      reloadTime: 3000,
      penetration: 5,
      bulletSpeed: 200,
      muzzleFlashIntensity: 2.0,
      recoil: 60,
      screenShake: 12,
    },
    GRENADE_LAUNCHER: {
      name: "GRENADE_LAUNCHER",
      maxDistance: 20,
      damage: 80,
      magazineSize: 6,
      reserveAmmo: 24,
      fireRate: 900,
      spread: 0.01,
      reloadTime: 2800,
      penetration: 3,
      bulletSpeed: 25,
      muzzleFlashIntensity: 2.5,
      recoil: 50,
      screenShake: 15,
      splashRadius: 2.5,
    },
    PLASMA: {
      name: "PLASMA",
      maxDistance: 60,
      raycastStep: 0.08,
      falloffMin: 1.0,
      wallPenetrationCost: 2,
      damage: 45,
      magazineSize: 40,
      reserveAmmo: 160,
      fireRate: 120,
      spread: 0.03,
      reloadTime: 2200,
      penetration: 4,
      bulletSpeed: 80,
      muzzleFlashIntensity: 1.8,
      recoil: 8,
      screenShake: 2,
    },
  },

  // Combat
  COMBAT: {
    DAMAGE_FALLOFF_MIN: 0.3,
    DAMAGE_FALLOFF_RANGE: 15,
    ENEMY_HIT_RADIUS: 0.3,
    ENEMY_HIT_RADIUS_SQ: 0.09, // pre-computed 0.3^2
    SCREEN_SHAKE_INTENSITY: 12,
    GAME_OVER_DELAY: 500,
  },

  // Visual effects
  EFFECTS: {
    MAX_BLOOD_SPLATTERS: 100,
    BLOOD_RENDER_DISTANCE: 6,
    MUZZLE_FLASH_DURATION: 50,
    VIGNETTE_INTENSITY: 0.3,
  },

  // Audio
  AUDIO: {
    FOOTSTEP_INTERVAL: 400,
    FOOTSTEP_INTERVAL_SPRINT: 300,
    AMBIENCE_INTERVAL: 3000,
    MUSIC_VOLUME: 0.75,
    MUSIC_LOOP_DURATION: 8, // seconds
  },

  // Difficulty presets
  // Each key overrides the corresponding base config at game start.
  DIFFICULTY: {
    EASY: {
      id: "easy",
      label: "EASY",
      description: "More ammo, forgiving combat",
      // Player
      maxHealth:      150,
      maxStamina:     150,
      staminaDrain:   0.25,
      staminaRecovery:0.5,
      // Weapons — ammo multiplier applied to reserveAmmo
      ammoMultiplier: 2.0,
      // Enemies
      enemyCount:     25,
      enemyHealthMult:0.6,
      enemySpeedMult: 0.75,
      enemyDamage:    6,
      // Map
      fillRatio:      0.45,   // fewer walls → more open
      smoothIterations:4,
      // Lighting
      ambientIntensity: 1.8,
      fogDensity:       0.04,
      flashlightIntensity: 5.0,
      // Gameplay
      autoReload:   true,
      aimAssist:    true,
      availableGuns: ['pistol', 'shotgun', 'rifle', 'smg', 'sniper', 'grenade_launcher', 'plasma'],
    },
    MEDIUM: {
      id: "medium",
      label: "MEDIUM",
      description: "Balanced challenge",
      maxHealth:      100,
      maxStamina:     100,
      staminaDrain:   0.5,
      staminaRecovery:0.3,
      ammoMultiplier: 1.0,
      enemyCount:     50,
      enemyHealthMult:1.0,
      enemySpeedMult: 1.0,
      enemyDamage:    10,
      fillRatio:      0.55,
      smoothIterations:3,
      ambientIntensity: 1.2,
      fogDensity:       0.06,
      flashlightIntensity: 3.5,
      // Gameplay
      autoReload:   true,
      aimAssist:    true,
      availableGuns: ['pistol', 'shotgun', 'rifle', 'smg', 'sniper', 'grenade_launcher', 'plasma'],
    },
    HARD: {
      id: "hard",
      label: "HARD",
      description: "Scarce ammo, tougher enemies",
      maxHealth:      75,
      maxStamina:     75,
      staminaDrain:   0.8,
      staminaRecovery:0.2,
      ammoMultiplier: 0.6,
      enemyCount:     80,
      enemyHealthMult:1.5,
      enemySpeedMult: 1.25,
      enemyDamage:    16,
      fillRatio:      0.62,
      smoothIterations:2,
      ambientIntensity: 0.7,
      fogDensity:       0.09,
      flashlightIntensity: 2.2,
      // Gameplay
      autoReload:   false,
      aimAssist:    false,
      availableGuns: ['pistol', 'shotgun', 'rifle', 'smg'],
    },
    IMPOSSIBLE: {
      id: "impossible",
      label: "IMPOSSIBLE",
      description: "One mistake and you're dead",
      maxHealth:      40,
      maxStamina:     50,
      staminaDrain:   1.2,
      staminaRecovery:0.1,
      ammoMultiplier: 0.35,
      enemyCount:     120,
      enemyHealthMult:2.2,
      enemySpeedMult: 1.6,
      enemyDamage:    25,
      fillRatio:      0.68,
      smoothIterations:1,
      ambientIntensity: 0.3,
      fogDensity:       0.14,
      flashlightIntensity: 1.4,
      // Gameplay
      autoReload:   false,
      aimAssist:    false,
      availableGuns: ['pistol'],
    },
    // Custom difficulty — defaults mirror MEDIUM; overridden at runtime by the UI
    CUSTOM: {
      id: "custom",
      label: "CUSTOM",
      description: "Your rules",
      maxHealth:      100,
      maxStamina:     100,
      staminaDrain:   0.5,
      staminaRecovery:0.3,
      ammoMultiplier: 1.0,
      enemyCount:     50,
      enemyHealthMult:1.0,
      enemySpeedMult: 1.0,
      enemyDamage:    10,
      fillRatio:      0.55,
      smoothIterations:3,
      ambientIntensity: 1.2,
      fogDensity:       0.06,
      flashlightIntensity: 3.5,
      // Gameplay
      autoReload:   true,
      aimAssist:    false,
      availableGuns: ['pistol', 'shotgun', 'rifle', 'smg', 'sniper', 'grenade_launcher', 'plasma'],
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
    { key: 'maxHealth',           group: 'PLAYER',      type: 'range',    label: 'Health',           min: 20,   max: 200,  step: 5,     format: v => String(Math.round(v)) },
    { key: 'maxStamina',          group: 'PLAYER',      type: 'range',    label: 'Stamina',          min: 20,   max: 200,  step: 5,     format: v => String(Math.round(v)) },
    { key: 'staminaDrain',        group: 'PLAYER',      type: 'range',    label: 'Stamina drain',    min: 0.05, max: 2,    step: 0.05,  format: v => parseFloat(v).toFixed(2) },
    { key: 'staminaRecovery',     group: 'PLAYER',      type: 'range',    label: 'Stamina recovery', min: 0.05, max: 1,    step: 0.05,  format: v => parseFloat(v).toFixed(2) },
    // Weapons
    { key: 'ammoMultiplier',      group: 'WEAPONS',     type: 'range',    label: 'Ammo multiplier',  min: 0.1,  max: 4,    step: 0.05,  format: v => `\u00d7${parseFloat(v).toFixed(2)}` },
    // Enemies
    { key: 'enemyCount',          group: 'ENEMIES',     type: 'range',    label: 'Count',            min: 5,    max: 200,  step: 5,     format: v => String(Math.round(v)) },
    { key: 'enemyHealthMult',     group: 'ENEMIES',     type: 'range',    label: 'Health mult',      min: 0.25, max: 4,    step: 0.05,  format: v => `\u00d7${parseFloat(v).toFixed(2)}` },
    { key: 'enemySpeedMult',      group: 'ENEMIES',     type: 'range',    label: 'Speed mult',       min: 0.25, max: 3,    step: 0.05,  format: v => `\u00d7${parseFloat(v).toFixed(2)}` },
    { key: 'enemyDamage',         group: 'ENEMIES',     type: 'range',    label: 'Damage',           min: 1,    max: 50,   step: 1,     format: v => String(Math.round(v)) },
    // Environment
    { key: 'fillRatio',           group: 'ENVIRONMENT', type: 'range',    label: 'Map density',      min: 0.3,  max: 0.8,  step: 0.01,  format: v => parseFloat(v).toFixed(2) },
    { key: 'smoothIterations',    group: 'ENVIRONMENT', type: 'range',    label: 'Map smoothing',    min: 0,    max: 6,    step: 1,     format: v => String(Math.round(v)) },
    { key: 'ambientIntensity',    group: 'ENVIRONMENT', type: 'range',    label: 'Ambient light',    min: 0.1,  max: 3,    step: 0.05,  format: v => parseFloat(v).toFixed(2) },
    { key: 'fogDensity',          group: 'ENVIRONMENT', type: 'range',    label: 'Fog density',      min: 0.01, max: 0.3,  step: 0.005, format: v => parseFloat(v).toFixed(3) },
    { key: 'flashlightIntensity', group: 'ENVIRONMENT', type: 'range',    label: 'Flashlight',       min: 0,    max: 8,    step: 0.1,   format: v => parseFloat(v).toFixed(2) },
    // Gameplay
    { key: 'autoReload',          group: 'GAMEPLAY',    type: 'checkbox', label: 'Auto reload' },
    { key: 'aimAssist',           group: 'GAMEPLAY',    type: 'checkbox', label: 'Aim assist' },
    { key: 'availableGuns',       group: 'GAMEPLAY',    type: 'guns',     label: 'Available guns',
      options: ['pistol', 'shotgun', 'rifle', 'smg', 'sniper', 'grenade_launcher', 'plasma'] },
  ],

  // 3D Weapon rendering
  WEAPON_3D: {
    POSITION_X_RATIO: 0.65,
    POSITION_Y_RATIO: 0.85,
    AIM_CENTER_Y_RATIO: 0.4,
    SCALE_PISTOL: 3.0,
    SCALE_SHOTGUN: 3.0,
    SCALE_RIFLE: 3.0,
    BOB_INTENSITY: 5,
    RECOIL_DECAY: 0.85,
    SWAY_DAMPENING: 0.85,
    PERSPECTIVE_STRENGTH: 0.15,
    PERSPECTIVE_VERTICAL_SKEW: 0.1,
    PERSPECTIVE_HORIZONTAL_SKEW: 0.05,
    SHADOW_ALPHA: 0.3,
    SHADOW_OFFSET: 5,
    BRIGHTNESS: 1.2,
    CONTRAST: 1.1,
    SATURATION: 1.3,
    HIGHLIGHT_ALPHA: 0.1,
    HIGHLIGHT_BRIGHTNESS: 2,
    HIGHLIGHT_OFFSET: -2,
    SPRITE_HORIZONTAL_OFFSET: 0.5,
    SPRITE_VERTICAL_OFFSET: 0.8,
  },
};

export default GameConfig;
