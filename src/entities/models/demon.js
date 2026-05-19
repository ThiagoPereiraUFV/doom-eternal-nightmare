/**
 * Demon — enemy model descriptor.
 *
 * Registers the Demon entity with EntityRegistry so that EnemyFactory
 * and Renderer can discover it automatically.
 * To add a new enemy, follow this pattern and import it in models/index.js.
 */

import * as THREE from "three";
import { Demon } from "../Demon.js";
import {
  EntityRegistry,
  ENTITY_CATEGORIES,
} from "../../registry/EntityRegistry.js";

const config = {
  ...Demon.config,
  getMaterials() {
    const std = (hex, extra = {}) =>
      new THREE.MeshStandardMaterial({ color: hex, roughness: 0.88, metalness: 0.04, ...extra });
    return {
      // Volcanic, cracked skin — deep crimson with subsurface warmth
      body: std(0x8b1200, { roughness: 0.92, metalness: 0.0 }),
      // Head slightly lighter — exposed bone ridges and flesh tears
      head: std(0xb01800, { roughness: 0.85, metalness: 0.0 }),
      // Glowing molten-orange eyes with emissive
      eye: std(0xff6600, {
        roughness: 0.2,
        metalness: 0.0,
        emissive: new THREE.Color(0xff3300),
        emissiveIntensity: 1.8,
      }),
      // Dark chitinous horns — semi-glossy
      horn: std(0x1a0a00, { roughness: 0.6, metalness: 0.1 }),
    };
  },
};

EntityRegistry.register(ENTITY_CATEGORIES.ENEMY, config, Demon);

export default Demon;
export { config };
