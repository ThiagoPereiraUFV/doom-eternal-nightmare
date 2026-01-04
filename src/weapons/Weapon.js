/**
 * Base Weapon Class
 * All weapons extend this base class (OCP principle)
 * Following LSP - all weapons are substitutable
 */

export class Weapon {
  constructor(name, stats) {
    if (new.target === Weapon) {
      throw new Error(
        "Weapon is an abstract class and cannot be instantiated directly",
      );
    }

    this.name = name;
    this.damage = stats.damage;
    this.magazineSize = stats.magazineSize;
    this.reserveAmmo = stats.reserveAmmo;
    this.currentMagazine = stats.magazineSize;
    this.fireRate = stats.fireRate;
    this.spread = stats.spread;
    this.reloadTime = stats.reloadTime;
    this.penetration = stats.penetration || 1;
    this.bulletSpeed = stats.bulletSpeed || 50;
    this.muzzleFlashIntensity = stats.muzzleFlashIntensity || 1.0;
    this.recoil = stats.recoil || 20;
    this.screenShake = stats.screenShake || 5;
    this.pellets = stats.pellets || 1;

    this.lastFireTime = 0;
    this.isReloading = false;
    this.reloadStartTime = 0;
  }

  /**
   * Fire the weapon (must be implemented by subclasses)
   * @param {Object} target - Target to shoot at
   * @abstract
   */
  fire(target) {
    throw new Error("fire() must be implemented by subclass");
  }

  /**
   * Check if weapon can fire
   * @returns {boolean} True if weapon can fire
   */
  canFire() {
    const currentTime = Date.now();
    return (
      !this.isReloading &&
      this.currentMagazine > 0 &&
      currentTime - this.lastFireTime >= this.fireRate
    );
  }

  /**
   * Start reload
   * @returns {boolean} True if reload started
   */
  startReload() {
    if (
      this.isReloading ||
      this.currentMagazine === this.magazineSize ||
      this.reserveAmmo === 0
    ) {
      return false;
    }

    this.isReloading = true;
    this.reloadStartTime = Date.now();
    return true;
  }

  /**
   * Update reload status
   * @returns {boolean} True if reload completed
   */
  updateReload() {
    if (!this.isReloading) return false;

    const currentTime = Date.now();
    if (currentTime - this.reloadStartTime >= this.reloadTime) {
      this.completeReload();
      return true;
    }
    return false;
  }

  /**
   * Complete reload
   */
  completeReload() {
    const ammoNeeded = this.magazineSize - this.currentMagazine;
    const ammoToReload = Math.min(ammoNeeded, this.reserveAmmo);

    this.currentMagazine += ammoToReload;
    this.reserveAmmo -= ammoToReload;
    this.isReloading = false;
  }

  /**
   * Consume ammo
   * @param {number} amount - Amount of ammo to consume
   */
  consumeAmmo(amount = 1) {
    this.currentMagazine = Math.max(0, this.currentMagazine - amount);
    this.lastFireTime = Date.now();
  }

  /**
   * Add reserve ammo
   * @param {number} amount - Amount to add
   */
  addAmmo(amount) {
    this.reserveAmmo += amount;
  }

  /**
   * Get weapon status
   * @returns {Object} Weapon status
   */
  getStatus() {
    return {
      name: this.name,
      currentMagazine: this.currentMagazine,
      reserveAmmo: this.reserveAmmo,
      isReloading: this.isReloading,
      reloadProgress: this.isReloading
        ? Math.min(1, (Date.now() - this.reloadStartTime) / this.reloadTime)
        : 0,
    };
  }
}

export default Weapon;
