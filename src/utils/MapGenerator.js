/**
 * Map Generator
 * Procedural map generation using cellular automata
 * Following SRP - only map generation
 */

import { GameConfig } from "../config/GameConfig.js";
import { isWalkable } from "./MathUtils.js";

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

    // Carve distinct rooms for more interesting layouts
    map = this._carveRooms(map, width, height);

    // Add columns at junctions for detail
    map = this._addColumns(map, width, height);

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
    const map = this.generate(size, size, options);

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
        if (nx === x && ny === y) {
          continue;
        }

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
   * Carve explicit rectangular rooms into the CA map for open combat areas.
   * @private
   */
  static _carveRooms(map, width, height) {
    const roomCount = 6 + Math.floor(Math.random() * 6);
    for (let i = 0; i < roomCount; i++) {
      // Random room size: 4–10 wide, 4–8 tall
      const rw = 4 + Math.floor(Math.random() * 7);
      const rh = 4 + Math.floor(Math.random() * 5);
      const rx = 2 + Math.floor(Math.random() * (width - rw - 4));
      const ry = 2 + Math.floor(Math.random() * (height - rh - 4));

      for (let y = ry; y < ry + rh; y++) {
        for (let x = rx; x < rx + rw; x++) {
          if (y > 0 && y < height - 1 && x > 0 && x < width - 1) {
            map[y][x] = 0;
          }
        }
      }

      // Connect room to a random cardinal direction with a corridor
      const midX = rx + Math.floor(rw / 2);
      const midY = ry + Math.floor(rh / 2);
      const dirs = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ];
      const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
      const corrLen = 3 + Math.floor(Math.random() * 6);
      for (let s = 0; s < corrLen; s++) {
        const cx = midX + dx * (Math.floor(rw / 2) + s);
        const cy = midY + dy * (Math.floor(rh / 2) + s);
        if (cy > 0 && cy < height - 1 && cx > 0 && cx < width - 1) {
          map[cy][cx] = 0;
          // 2-wide corridor
          const px = cx + (dx === 0 ? 1 : 0);
          const py = cy + (dy === 0 ? 1 : 0);
          if (py > 0 && py < height - 1 && px > 0 && px < width - 1) {
            map[py][px] = 0;
          }
        }
      }
    }
    return map;
  }

  /**
   * Add isolated wall columns (1×1) at open floor locations for cover/detail.
   * @private
   */
  static _addColumns(map, width, height) {
    const colCount = 8 + Math.floor(Math.random() * 12);
    let placed = 0;
    let attempts = 0;
    while (placed < colCount && attempts < 400) {
      attempts++;
      const x = 3 + Math.floor(Math.random() * (width - 6));
      const y = 3 + Math.floor(Math.random() * (height - 6));
      // Only place on open floor cells surrounded by open space (don't block corridors)
      if (map[y][x] !== 0) {
        continue;
      }
      const openNeighbors = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ].filter(([dx, dy]) => {
        const nx = x + dx,
          ny = y + dy;
        return isWalkable(map, nx, ny);
      }).length;
      if (openNeighbors < 3) {
        continue;
      } // needs breathing room around it
      map[y][x] = 1; // concrete pillar
      placed++;
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
    return isWalkable(map, mapX, mapY);
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
