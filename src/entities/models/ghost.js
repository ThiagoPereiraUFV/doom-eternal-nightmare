/**
 * Ghost — enemy model descriptor.
 * Self-registers with EntityRegistry on import.
 */

import * as THREE from "three";
import { Ghost } from "../Ghost.js";
import {
  EntityRegistry,
  ENTITY_CATEGORIES,
} from "../../registry/EntityRegistry.js";

const config = {
  ...Ghost.config,
  getMaterials() {
    const lam = (hex, extra = {}) =>
      new THREE.MeshLambertMaterial({ color: hex, ...extra });
    const bas = (hex, extra = {}) =>
      new THREE.MeshBasicMaterial({ color: hex, ...extra });
    return {
      body: lam(0x5599cc, {
        transparent: true,
        opacity: 0.6,
        emissive: new THREE.Color(0x112233),
      }),
      head: lam(0x77bbee, { transparent: true, opacity: 0.65 }),
      eye: bas(0x00ffff, { transparent: true, opacity: 0.9 }),
      horn: lam(0x334455),
    };
  },
};

EntityRegistry.register(ENTITY_CATEGORIES.ENEMY, config, Ghost);

export default Ghost;
export { config };
