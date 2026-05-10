/**
 * Ray Caster
 * Performs raycasting for 3D rendering
 * Following SRP - only raycasting calculations
 */

import { GameConfig } from "../config/GameConfig.js";

export class RayCaster {
  /**
   * Cast rays from player position to create 3D view
   * @param {Player} player - Player object
   * @param {Array} map - Game map
   * @returns {Array} Array of ray hit results
   */
  static castRays(player, map) {
    const rays = [];
    const fov = GameConfig.RENDERING.FOV;
    const rayCount = GameConfig.RENDERING.RAY_COUNT;
    const maxDistance = GameConfig.RENDERING.MAX_RENDER_DISTANCE;

    for (let i = 0; i < rayCount; i++) {
      const rayAngle = player.angle - fov / 2 + (fov * i) / rayCount;
      const ray = this.castRay(player.x, player.y, rayAngle, map, maxDistance);
      ray.rayIndex = i;
      rays.push(ray);
    }

    return rays;
  }

  /**
   * Cast a single ray
   * @param {number} x - Start X position
   * @param {number} y - Start Y position
   * @param {number} angle - Ray angle
   * @param {Array} map - Game map
   * @param {number} maxDistance - Maximum ray distance
   * @returns {Object} Ray hit information
   */
  static castRay(x, y, angle, map, maxDistance = 20) {
    const precision = 0.01;
    let distance = 0;
    let hit = false;
    let wallType = 0;
    let hitX = x;
    let hitY = y;
    let side = 0; // 0 = vertical wall, 1 = horizontal wall
    let iterations = 0;
    const maxIterations = maxDistance / precision + 100; // Safety limit

    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    // Validate map
    if (!map || !map.length || !map[0]) {
      return {
        distance: maxDistance,
        hit: false,
        wallType: 0,
        hitX: x,
        hitY: y,
        angle,
        side: 0,
      };
    }

    while (!hit && distance < maxDistance && iterations < maxIterations) {
      iterations++;
      distance += precision;
      hitX = x + dx * distance;
      hitY = y + dy * distance;

      const mapX = Math.floor(hitX);
      const mapY = Math.floor(hitY);

      // Check bounds
      if (mapY < 0 || mapY >= map.length || mapX < 0 || mapX >= map[0].length) {
        hit = true;
        wallType = 1; // Default wall
        break;
      }

      // Check wall hit
      if (map[mapY][mapX] > 0) {
        hit = true;
        wallType = map[mapY][mapX];

        // Determine which side of the wall was hit
        const cellX = hitX - mapX;

        if (Math.abs(cellX - 0) < 0.02 || Math.abs(cellX - 1) < 0.02) {
          side = 0; // Vertical wall
        } else {
          side = 1; // Horizontal wall
        }
        break;
      }
    }

    return {
      distance,
      hit,
      wallType,
      hitX,
      hitY,
      angle,
      side,
    };
  }

  /**
   * Cast ray to check line of sight
   * @param {number} x1 - Start X
   * @param {number} y1 - Start Y
   * @param {number} x2 - End X
   * @param {number} y2 - End Y
   * @param {Array} map - Game map
   * @returns {boolean} True if line of sight is clear
   */
  static hasLineOfSight(x1, y1, x2, y2, map) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    const steps = Math.ceil(distance * 10);
    const stepSize = distance / steps;

    for (let i = 0; i <= steps; i++) {
      const checkX = x1 + Math.cos(angle) * stepSize * i;
      const checkY = y1 + Math.sin(angle) * stepSize * i;

      const mapX = Math.floor(checkX);
      const mapY = Math.floor(checkY);

      if (mapY < 0 || mapY >= map.length || mapX < 0 || mapX >= map[0].length) {
        return false;
      }

      if (map[mapY][mapX] > 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get wall texture coordinate
   * @param {Object} ray - Ray hit information
   * @returns {number} Texture coordinate (0-1)
   */
  static getTextureCoordinate(ray) {
    if (ray.side === 0) {
      // Vertical wall - use Y coordinate
      return ray.hitY % 1;
    } else {
      // Horizontal wall - use X coordinate
      return ray.hitX % 1;
    }
  }

  /**
   * Apply fish-eye correction to distance
   * @param {number} distance - Raw distance
   * @param {number} rayAngle - Ray angle
   * @param {number} playerAngle - Player viewing angle
   * @returns {number} Corrected distance
   */
  static correctFishEye(distance, rayAngle, playerAngle) {
    const angleDiff = rayAngle - playerAngle;
    return distance * Math.cos(angleDiff);
  }

  /**
   * Calculate wall height for rendering
   * @param {number} distance - Corrected distance
   * @param {number} screenHeight - Screen height
   * @returns {number} Wall height in pixels
   */
  static calculateWallHeight(distance, screenHeight) {
    if (distance === 0) {
      return screenHeight;
    }
    return (screenHeight * GameConfig.RENDERING.WALL_HEIGHT_RATIO) / distance;
  }
}

export default RayCaster;
