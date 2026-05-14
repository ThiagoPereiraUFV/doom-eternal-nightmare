/**
 * Brute — enemy model descriptor.
 * Self-registers with EntityRegistry on import.
 */

import * as THREE from "three";
import { Brute } from "../Brute.js";
import {
  EntityRegistry,
  ENTITY_CATEGORIES,
} from "../../registry/EntityRegistry.js";

const config = {
  ...Brute.config,
  getMaterials() {
    const lam = (hex, extra = {}) =>
      new THREE.MeshLambertMaterial({ color: hex, ...extra });
    const bas = (hex, extra = {}) =>
      new THREE.MeshBasicMaterial({ color: hex, ...extra });
    return {
      body: lam(0x664422),
      head: lam(0x775533),
      eye: bas(0xff2200),
      horn: lam(0x111111),
    };
  },
};

EntityRegistry.register(ENTITY_CATEGORIES.ENEMY, config, Brute);

export default Brute;
export { config };
