/**
 * Map Generator
 * Procedural map generation using cellular automata
 * Following SRP - only map generation
 */

import { GameConfig } from "../config/GameConfig.js";

export class MapGenerator {
  /**
   * Generate a random map using cellular automata
   * @param {number} width - Map width
   * @param {number} height - Map height
   * @param {Object} options - Generation options
   * @returns {Array<Array<number>>} Generated map
   */
  static generate(width = 20, height = 20, options = {}) {
    const {
      fillRatio = GameConfig.MAP.FILL_RATIO,
      smoothIterations = GameConfig.MAP.SMOOTHING_ITERATIONS,
      wallThreshold = GameConfig.MAP.WALL_THRESHOLD,
    } = options;

    // Initialize map with random walls
    let map = this._initializeRandomMap(width, height, fillRatio);

    // Apply cellular automata smoothing
    for (let i = 0; i < smoothIterations; i++) {
      map = this._smoothMap(map, wallThreshold);
    }

    // Assign wall types
    map = this._assignWallTypes(map);

    return map;
  }

  /**
   * Generate spawn map with safe corridors
   * @param {number} playerX - Player spawn X
   * @param {number} playerY - Player spawn Y
   * @returns {Array<Array<number>>} Generated map
   */
  static generateSpawnMap(playerX = 3, playerY = 3, options = {}) {
    const size = GameConfig.MAP.SPAWN_SIZE;
    let map = this.generate(size, size, options);

    // Create safe zone around player spawn
    const safeZone = GameConfig.MAP.SPAWN_SAFE_ZONE;
    for (let y = playerY - safeZone; y < playerY + safeZone; y++) {
      for (let x = playerX - safeZone; x < playerX + safeZone; x++) {
        if (y >= 0 && y < size && x >= 0 && x < size) {
          map[y][x] = 0;
        }
      }
    }

    // Create corridors from spawn
    this._createCorridorsFromSpawn(map, playerX, playerY);

    return map;
  }

  /**
   * Initialize map with random walls
   * @private
   */
  static _initializeRandomMap(width, height, fillRatio) {
    const map = [];

    for (let y = 0; y < height; y++) {
      map[y] = [];
      for (let x = 0; x < width; x++) {
        // Borders are always walls
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          map[y][x] = 1;
        } else {
          map[y][x] = Math.random() < fillRatio ? 1 : 0;
        }
      }
    }

    return map;
  }

  /**
   * Apply cellular automata smoothing
   * @private
   */
  static _smoothMap(map, wallThreshold) {
    const newMap = [];
    const height = map.length;
    const width = map[0].length;

    for (let y = 0; y < height; y++) {
      newMap[y] = [];
      for (let x = 0; x < width; x++) {
        // Keep borders as walls
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          newMap[y][x] = 1;
        } else {
          const wallCount = this._countNeighborWalls(map, x, y);
          newMap[y][x] = wallCount >= wallThreshold ? 1 : 0;
        }
      }
    }

    return newMap;
  }

  /**
   * Count neighboring walls
   * @private
   */
  static _countNeighborWalls(map, x, y) {
    let count = 0;

    for (let ny = y - 1; ny <= y + 1; ny++) {
      for (let nx = x - 1; nx <= x + 1; nx++) {
        if (nx === x && ny === y) continue;

        if (ny < 0 || ny >= map.length || nx < 0 || nx >= map[0].length) {
          count++; // Out of bounds counts as wall
        } else if (map[ny][nx] > 0) {
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Assign different wall types for variety
   * @private
   */
  static _assignWallTypes(map) {
    const height = map.length;
    const width = map[0].length;
    const types = GameConfig.MAP.WALL_TYPES;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (map[y][x] > 0) {
          const rand = Math.random();
          if (rand < types.CONCRETE_CHANCE) {
            map[y][x] = types.CONCRETE;
          } else if (rand < types.BRICK_CHANCE) {
            map[y][x] = types.BRICK;
          } else if (rand < types.METAL_CHANCE) {
            map[y][x] = types.METAL;
          } else {
            map[y][x] = types.STONE;
          }
        }
      }
    }

    return map;
  }

  /**
   * Create corridors from spawn point
   * @private
   */
  static _createCorridorsFromSpawn(map, spawnX, spawnY) {
    const size = map.length;
    const corridorLength = GameConfig.MAP.SPAWN_CORRIDOR_LENGTH;

    // Create corridors in cardinal directions
    const directions = [
      { dx: 1, dy: 0 }, // Right
      { dx: -1, dy: 0 }, // Left
      { dx: 0, dy: 1 }, // Down
      { dx: 0, dy: -1 }, // Up
    ];

    directions.forEach(({ dx, dy }) => {
      for (let i = 0; i < corridorLength; i++) {
        const x = spawnX + dx * i;
        const y = spawnY + dy * i;

        if (x >= 1 && x < size - 1 && y >= 1 && y < size - 1) {
          // Create corridor width of 3
          map[y][x] = 0;
          if (dx !== 0) {
            map[y - 1][x] = 0;
            map[y + 1][x] = 0;
          } else {
            map[y][x - 1] = 0;
            map[y][x + 1] = 0;
          }
        }
      }
    });

    // Create grid of corridors for better connectivity
    const gridSpacing = GameConfig.MAP.SPAWN_CORRIDOR_GRID;
    for (let y = gridSpacing; y < size - gridSpacing; y += gridSpacing) {
      for (let x = 1; x < size - 1; x++) {
        map[y][x] = 0;
      }
    }
    for (let x = gridSpacing; x < size - gridSpacing; x += gridSpacing) {
      for (let y = 1; y < size - 1; y++) {
        map[y][x] = 0;
      }
    }
  }

  /**
   * Check if position is valid (not a wall)
   * @param {Array} map - Game map
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} True if position is valid
   */
  static isValidPosition(map, x, y) {
    const mapX = Math.floor(x);
    const mapY = Math.floor(y);

    if (mapY < 0 || mapY >= map.length || mapX < 0 || mapX >= map[0].length) {
      return false;
    }

    return map[mapY][mapX] === 0;
  }

  /**
   * Find random empty position on map
   * @param {Array} map - Game map
   * @param {number} minX - Minimum X (optional)
   * @param {number} minY - Minimum Y (optional)
   * @param {number} maxAttempts - Maximum attempts to find position
   * @returns {{x: number, y: number}|null} Random empty position or null
   */
  static findRandomEmptyPosition(map, minX = 0, minY = 0, maxAttempts = 100) {
    const height = map.length;
    const width = map[0].length;

    for (let i = 0; i < maxAttempts; i++) {
      const x = minX + Math.random() * (width - minX - 1);
      const y = minY + Math.random() * (height - minY - 1);

      if (this.isValidPosition(map, x, y)) {
        return { x, y };
      }
    }

    return null;
  }
}

export default MapGenerator;
