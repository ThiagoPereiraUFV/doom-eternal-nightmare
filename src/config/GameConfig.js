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
  },

  // Combat
  COMBAT: {
    DAMAGE_FALLOFF_MIN: 0.3,
    DAMAGE_FALLOFF_RANGE: 15,
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
    MUSIC_VOLUME: 0.25,
    MUSIC_LOOP_DURATION: 8, // seconds
  },

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
