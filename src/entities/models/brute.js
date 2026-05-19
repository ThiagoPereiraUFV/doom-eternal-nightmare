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
    const std = (hex, extra = {}) =>
      new THREE.MeshStandardMaterial({
        color: hex,
        roughness: 0.9,
        metalness: 0.0,
        ...extra,
      });
    return {
      // Thick hide — dark reddish-brown like dried blood over rock
      body: std(0x5a2e10, { roughness: 0.93, metalness: 0.02 }),
      // Head — slightly more olive-brown, scarred
      head: std(0x6b3a1a, { roughness: 0.9, metalness: 0.0 }),
      // Deep-set burning red eyes
      eye: std(0xff3300, {
        roughness: 0.15,
        metalness: 0.0,
        emissive: new THREE.Color(0xff1100),
        emissiveIntensity: 2.2,
      }),
      // Bone-black horns and spinal ridge — hard chitinous surface
      horn: std(0x0d0d0d, { roughness: 0.5, metalness: 0.15 }),
    };
  },
};

EntityRegistry.register(ENTITY_CATEGORIES.ENEMY, config, Brute);

export default Brute;
export { config };
