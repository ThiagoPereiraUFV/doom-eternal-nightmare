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
    const lam = (hex, extra = {}) =>
      new THREE.MeshLambertMaterial({ color: hex, ...extra });
    const bas = (hex, extra = {}) =>
      new THREE.MeshBasicMaterial({ color: hex, ...extra });
    return {
      body: lam(0xaa1100),
      head: lam(0xcc2200),
      eye: bas(0xff4400),
      horn: lam(0x330000),
    };
  },
};

EntityRegistry.register(ENTITY_CATEGORIES.ENEMY, config, Demon);

export default Demon;
export { config };
