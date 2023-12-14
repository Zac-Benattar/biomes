import * as THREE from 'three';
import { InstancedBufferAttribute } from "three";

const num_grass_x = 10;
const num_grass_y = 10;
const grass_blades_count = 512;
const grass_blades_vertices_count = 15;
const grass_patch_size = 1;
const grass_max_offset = 0.1;
let offsets = [];

export function createTileGeometry() {
    for (let i = 0; i < num_grass_x; i++) {
        const x = (i / num_grass_y) - 0.5;
        for (let j = 0; j < num_grass_x; j++) {
            const y = (j / num_grass_y) - 0.5;
            offsets.push(x * grass_patch_size + (Math.random() * 2 * grass_max_offset) - grass_max_offset);
            offsets.push(y * grass_patch_size + (Math.random() * 2 * grass_max_offset) - grass_max_offset);
            offsets.push(0);
        }
    }
    const offsetsData = offsets.map(THREE.DataUtils.toHalfFloat);

    const vertID = new Uint8Array(grass_blades_vertices_count);
    for (let i = 0; i < grass_blades_vertices_count; i++) {
        vertID[i] = i;
    }

    const geometry = new THREE.InstancedBufferGeometry();
    geometry.instanceCount = grass_blades_count;
    geometry.setAttribute('vertIndex', new THREE.Uint8BufferAttribute(vertID, 1));
    geometry.setAttribute('position', new InstancedBufferAttribute(new Float32Array(offsetsData), 3)); 
    return geometry;
}