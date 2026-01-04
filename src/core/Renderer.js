/**
 * Renderer System
 * Handles all rendering operations
 * Following SRP - only rendering logic
 */

import { GameConfig } from "../config/GameConfig.js";
import { RayCaster } from "../utils/RayCaster.js";

export class Renderer {
  constructor(canvas, weaponCanvas, resourceManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.weaponCanvas = weaponCanvas;
    this.weaponCtx = weaponCanvas.getContext("2d");
    this.resourceManager = resourceManager;

    // Resize canvases
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.weaponCanvas.width = GameConfig.CANVAS.WEAPON_WIDTH;
    this.weaponCanvas.height = GameConfig.CANVAS.WEAPON_HEIGHT;

    // Handle window resize
    window.addEventListener("resize", () => this._handleResize());
  }

  /**
   * Handle window resize
   * @private
   */
  _handleResize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    // Update weapon canvas size proportionally
    const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    this.weaponCanvas.width = GameConfig.CANVAS.WEAPON_WIDTH * scale;
    this.weaponCanvas.height = GameConfig.CANVAS.WEAPON_HEIGHT * scale;
  }

  /**
   * Render the game world
   * @param {Player} player - Player object
   * @param {Array} enemies - Enemy array
   * @param {Array} map - Game map
   * @param {Array} bloodSplatters - Blood splatter effects
   */
  renderWorld(player, enemies, map, bloodSplatters = []) {
    // Clear canvas
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Render ceiling and floor
    this._renderCeilingFloor();

    // Cast rays and render walls
    const rays = RayCaster.castRays(player, map);
    this._renderWalls(rays, player);

    // Render blood splatters
    this._renderBloodSplatters(bloodSplatters, player);

    // Render enemies
    this._renderEnemies(enemies, player, rays, map);

    // Render effects
    this._renderEffects(player);
  }

  /**
   * Render ceiling and floor
   * @private
   */
  _renderCeilingFloor() {
    // Ceiling
    this.ctx.fillStyle = "#1a1a1a";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height / 2);

    // Floor
    this.ctx.fillStyle = "#0a0a0a";
    this.ctx.fillRect(
      0,
      this.canvas.height / 2,
      this.canvas.width,
      this.canvas.height / 2,
    );
  }

  /**
   * Render walls from raycasting
   * @private
   */
  _renderWalls(rays, player) {
    const stripWidth = this.canvas.width / rays.length;

    rays.forEach((ray, i) => {
      if (!ray.hit) return;

      const correctedDistance = RayCaster.correctFishEye(
        ray.distance,
        ray.angle,
        player.angle,
      );
      const wallHeight = RayCaster.calculateWallHeight(
        correctedDistance,
        this.canvas.height,
      );

      const stripX = i * stripWidth;
      const stripY = (this.canvas.height - wallHeight) / 2;

      // Light and shading calculations
      const maxDistance = GameConfig.RENDERING.MAX_RENDER_DISTANCE;
      const lightFalloff = Math.max(0.2, 1 - correctedDistance / maxDistance);
      const orientationShade = ray.side === 0 ? 0.85 : 1.0;

      // Get wall color based on type
      const wallColors = {
        1: { r: 120, g: 120, b: 120 }, // Concrete
        2: { r: 150, g: 80, b: 60 }, // Brick
        3: { r: 100, g: 100, b: 110 }, // Metal
        4: { r: 110, g: 100, b: 90 }, // Stone
      };

      const baseColor = wallColors[ray.wallType] || wallColors[1];

      // Apply shading
      const finalR = baseColor.r * orientationShade * lightFalloff;
      const finalG = baseColor.g * orientationShade * lightFalloff;
      const finalB = baseColor.b * orientationShade * lightFalloff;

      this.ctx.fillStyle = `rgb(${finalR}, ${finalG}, ${finalB})`;
      this.ctx.fillRect(stripX, stripY, stripWidth, wallHeight);

      // Atmospheric fog
      const fogFactor = Math.max(0, 1 - correctedDistance / maxDistance);
      const fogColor = { r: 40, g: 40, b: 60 };
      this.ctx.fillStyle = `rgba(${fogColor.r}, ${fogColor.g}, ${fogColor.b}, ${
        1 - fogFactor
      })`;
      this.ctx.fillRect(stripX, stripY, stripWidth, wallHeight);
    });
  }

  /**
   * Render blood splatters
   * @private
   */
  _renderBloodSplatters(splatters, player) {
    const fov = GameConfig.RENDERING.FOV;
    const maxDist = GameConfig.EFFECTS.BLOOD_RENDER_DISTANCE;

    for (const splatter of splatters) {
      const dx = splatter.x - player.x;
      const dy = splatter.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      let angleDiff = angle - player.angle;
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

      if (Math.abs(angleDiff) < fov / 2 + 0.5 && dist < maxDist) {
        const perpDistance = dist * Math.cos(angleDiff);
        const screenXRatio = angleDiff / fov + 0.5;
        const size = (this.canvas.height / perpDistance) * splatter.size;
        const screenX = screenXRatio * this.canvas.width;
        const screenY = this.canvas.height / 2;

        this.ctx.save();
        this.ctx.globalAlpha = splatter.opacity * Math.min(1, 5 / perpDistance);
        this.ctx.fillStyle = `rgb(${100 + Math.random() * 20}, 0, 0)`;
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
    }
  }

  /**
   * Render enemies
   * @private
   */
  _renderEnemies(enemies, player, rays, map) {
    const fov = GameConfig.RENDERING.FOV;
    const rayCount = GameConfig.RENDERING.RAY_COUNT;

    // Create depth buffer
    const depthBuffer = rays.map((ray) => {
      const corrected = RayCaster.correctFishEye(
        ray.distance,
        ray.angle,
        player.angle,
      );
      return corrected;
    });

    // Sort enemies by distance
    const sortedEnemies = enemies
      .filter((e) => !e.isDead)
      .map((enemy) => ({
        enemy,
        distance: player.distanceTo
          ? player.distanceTo(enemy.x, enemy.y)
          : Math.sqrt(
              Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2),
            ),
      }))
      .sort((a, b) => b.distance - a.distance);

    // Enemy type to sprite mapping
    const spriteMap = {
      demon: "imp",
      zombie: "skeleton",
      ghost: "ghost",
      brute: "brute",
    };

    for (const { enemy, distance } of sortedEnemies) {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const angle = Math.atan2(dy, dx);

      let angleDiff = angle - player.angle;
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

      if (Math.abs(angleDiff) < fov / 2 + 0.5) {
        const perpDistance = distance * Math.cos(angleDiff);

        // Check occlusion
        const screenXRatio = angleDiff / fov + 0.5;
        const rayIndex = Math.floor(screenXRatio * rayCount);

        if (
          rayIndex >= 0 &&
          rayIndex < rayCount &&
          depthBuffer[rayIndex] < perpDistance
        ) {
          continue; // Behind wall
        }

        const spriteHeight = (this.canvas.height / perpDistance) * 0.8;
        const spriteWidth = spriteHeight * 0.6;
        const screenX = screenXRatio * this.canvas.width;
        const screenY = (this.canvas.height - spriteHeight) / 2;

        // Get sprite
        const spriteName = spriteMap[enemy.type];
        const sprite = this.resourceManager.getSprite("enemies", spriteName);

        if (sprite?.img?.complete) {
          const alpha = Math.min(1, 10 / perpDistance);
          this.ctx.save();
          this.ctx.globalAlpha = alpha;
          this.ctx.drawImage(
            sprite.img,
            screenX - spriteWidth / 2,
            screenY,
            spriteWidth,
            spriteHeight,
          );

          // Eye glow for chase state
          if (enemy.currentState === "chase" && enemy.type !== "ghost") {
            this.ctx.globalAlpha = alpha * 0.8;
            const eyeY = screenY + spriteHeight * 0.25;
            this.ctx.fillStyle = "#ffff00";
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = "#ffff00";

            this.ctx.beginPath();
            this.ctx.arc(
              screenX - spriteWidth * 0.15,
              eyeY,
              spriteWidth * 0.04,
              0,
              Math.PI * 2,
            );
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(
              screenX + spriteWidth * 0.15,
              eyeY,
              spriteWidth * 0.04,
              0,
              Math.PI * 2,
            );
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
          }

          this.ctx.restore();
        }

        // Health bar
        const healthRatio = enemy.health / enemy.maxHealth;
        if (healthRatio < 1) {
          const barWidth = spriteWidth * 0.8;
          const barHeight = 4;
          const barX = screenX - barWidth / 2;
          const barY = screenY - 15;

          this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
          this.ctx.fillRect(barX, barY, barWidth, barHeight);

          const healthColor =
            healthRatio > 0.5 ? "#0f0" : healthRatio > 0.25 ? "#ff0" : "#f00";
          this.ctx.fillStyle = healthColor;
          this.ctx.fillRect(barX, barY, barWidth * healthRatio, barHeight);
        }
      }
    }
  }

  /**
   * Render visual effects (vignette, health effects)
   * @private
   */
  _renderEffects(player) {
    // Low health vignette
    if (player.health < 40) {
      const healthRatio = player.health / 100;
      const vignetteOpacity = (1 - healthRatio) * 0.4;

      const gradient = this.ctx.createRadialGradient(
        this.canvas.width / 2,
        this.canvas.height / 2,
        this.canvas.height * 0.3,
        this.canvas.width / 2,
        this.canvas.height / 2,
        this.canvas.height * 0.8,
      );

      gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(1, `rgba(80, 0, 0, ${vignetteOpacity})`);

      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Standard vignette
    const vignetteIntensity = GameConfig.EFFECTS.VIGNETTE_INTENSITY;
    const gradient = this.ctx.createRadialGradient(
      this.canvas.width / 2,
      this.canvas.height / 2,
      this.canvas.height * 0.2,
      this.canvas.width / 2,
      this.canvas.height / 2,
      this.canvas.height * 0.7,
    );

    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, `rgba(0, 0, 0, ${vignetteIntensity})`);

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Render weapon
   * @param {Player} player - Player object
   */
  renderWeapon(player) {
    this.weaponCtx.clearRect(
      0,
      0,
      this.weaponCanvas.width,
      this.weaponCanvas.height,
    );

    if (!player.currentWeapon) return;

    const weapon = player.currentWeapon;
    const bob = Math.sin(player.headBob) * GameConfig.WEAPON_3D.BOB_INTENSITY;
    const recoilOffset = player.recoilOffset;

    const weaponX =
      this.weaponCanvas.width * GameConfig.WEAPON_3D.POSITION_X_RATIO;
    const weaponY =
      this.weaponCanvas.height * GameConfig.WEAPON_3D.POSITION_Y_RATIO +
      bob +
      recoilOffset;

    // Reload indicator
    if (weapon.isReloading) {
      this.weaponCtx.fillStyle = "#ff0";
      this.weaponCtx.font = "24px monospace";
      this.weaponCtx.fillText(
        "RELOADING...",
        this.weaponCanvas.width / 2 - 80,
        50,
      );
    }

    // Get weapon sprite
    const weaponType = weapon.name.toLowerCase();
    const sprite = this.resourceManager.getSprite("weapons", weaponType);

    if (sprite?.img?.complete) {
      let scale = GameConfig.WEAPON_3D.SCALE_PISTOL;
      if (weaponType === "shotgun") scale = GameConfig.WEAPON_3D.SCALE_SHOTGUN;
      if (weaponType === "rifle") scale = GameConfig.WEAPON_3D.SCALE_RIFLE;

      const spriteWidth = sprite.width * scale;
      const spriteHeight = sprite.height * scale;

      this.weaponCtx.save();
      this.weaponCtx.translate(weaponX, weaponY);

      // Draw weapon
      this.weaponCtx.filter = `brightness(${GameConfig.WEAPON_3D.BRIGHTNESS}) contrast(${GameConfig.WEAPON_3D.CONTRAST})`;
      this.weaponCtx.drawImage(
        sprite.img,
        -spriteWidth * 0.5,
        -spriteHeight * 0.8,
        spriteWidth,
        spriteHeight,
      );

      this.weaponCtx.restore();
    }
  }
}

export default Renderer;
