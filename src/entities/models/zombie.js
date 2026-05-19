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
    const std = (hex, extra = {}) =>
      new THREE.MeshStandardMaterial({ color: hex, roughness: 0.95, metalness: 0.0, ...extra });
    return {
      // Decomposing flesh — mottled grey-green, extremely rough surface
      body: std(0x3d4a2e, { roughness: 0.97, metalness: 0.0 }),
      // Head slightly more pallid
      head: std(0x4a5538, { roughness: 0.95, metalness: 0.0 }),
      // Bloodshot glowing red eyes
      eye: std(0xff1100, {
        roughness: 0.3,
        metalness: 0.0,
        emissive: new THREE.Color(0xcc0000),
        emissiveIntensity: 1.4,
      }),
      // Exposed bone and dark necrotic tissue
      horn: std(0x2a2318, { roughness: 0.9, metalness: 0.0 }),
    };
  },
};

EntityRegistry.register(ENTITY_CATEGORIES.ENEMY, config, Zombie);

export default Zombie;
export { config };
