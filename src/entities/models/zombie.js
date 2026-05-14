/**
 * Zombie — enemy model descriptor.
 * Self-registers with EntityRegistry on import.
 */

import * as THREE from "three";
import { Zombie } from "../Zombie.js";
import {
  EntityRegistry,
  ENTITY_CATEGORIES,
} from "../../registry/EntityRegistry.js";

const config = {
  ...Zombie.config,
  getMaterials() {
    const lam = (hex, extra = {}) =>
      new THREE.MeshLambertMaterial({ color: hex, ...extra });
    const bas = (hex, extra = {}) =>
      new THREE.MeshBasicMaterial({ color: hex, ...extra });
    return {
      body: lam(0x445533),
      head: lam(0x556644),
      eye: bas(0xff0000),
      horn: lam(0x222222),
    };
  },
};

EntityRegistry.register(ENTITY_CATEGORIES.ENEMY, config, Zombie);

export default Zombie;
export { config };
