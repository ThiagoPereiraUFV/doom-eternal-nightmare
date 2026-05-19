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
    const std = (hex, extra = {}) =>
      new THREE.MeshStandardMaterial({ color: hex, roughness: 0.15, metalness: 0.0, ...extra });
    return {
      // Ethereal translucent form — inner cold-blue glow
      body: std(0x4488bb, {
        transparent: true,
        opacity: 0.55,
        roughness: 0.1,
        emissive: new THREE.Color(0x1133aa),
        emissiveIntensity: 0.6,
      }),
      // Slightly more opaque ecto-core
      head: std(0x66aadd, {
        transparent: true,
        opacity: 0.7,
        roughness: 0.08,
        emissive: new THREE.Color(0x2244cc),
        emissiveIntensity: 0.5,
      }),
      // Piercing cyan eyes — strong emissive
      eye: std(0x00eeff, {
        roughness: 0.05,
        transparent: true,
        opacity: 0.95,
        emissive: new THREE.Color(0x00ccff),
        emissiveIntensity: 2.5,
      }),
      // Wisps/tail segments — darkened ecto
      horn: std(0x223344, {
        transparent: true,
        opacity: 0.5,
        emissive: new THREE.Color(0x112233),
        emissiveIntensity: 0.3,
      }),
    };
  },
};

EntityRegistry.register(ENTITY_CATEGORIES.ENEMY, config, Ghost);

export default Ghost;
export { config };
