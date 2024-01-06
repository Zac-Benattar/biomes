import * as THREE from 'three';
import GameController from './GameController';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class FlyingSaucer extends THREE.Object3D {
    private gameController: GameController;
    private model: THREE.Mesh;
    private beam: THREE.Mesh;

    constructor(gameContoller: GameController, position: THREE.Vector3) {
        super();
        this.Init(gameContoller, position);
    }

    private Init(gameContoller: GameController, position: THREE.Vector3): void {
        this.gameController = gameContoller;
        this.position.copy(position);
        this.loadModel(position);
    }

    // Swap out for a real model
    private loadModel(position: THREE.Vector3 = new THREE.Vector3(0, 0, 0)) {
        const loader = new GLTFLoader();
        loader.load("./assets/models/Saucer.glb", (gltf) => {
            this.model = gltf.scene.children[0] as THREE.Mesh;
            this.model.scale.set(0.5, 0.5, 0.5);
            this.model.castShadow = true;
            this.model.receiveShadow = true;
            this.setPosition(position);
            this.gameController.scene.add(this.model);
        });
    }

    public enableBeam(targetPosition: THREE.Vector3) {
        // Ensure there is no existing beam
        this.disableBeam();
        
        this.createBeam(targetPosition);
        this.gameController.scene.add(this.beam);
    }

    public disableBeam() {
        this.gameController.scene.remove(this.beam);
        this.beam = null;
    }

    private createBeam(targetPosition: THREE.Vector3) {
        const beamHeight = this.position.y - targetPosition.y;
        let geo = new THREE.CylinderGeometry(0.5, 1, beamHeight, 6, 1, false);
        let material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        material.transparent = true;
        material.opacity = 0.2;
        this.beam = new THREE.Mesh(geo, material);
        this.beam.position.set(this.position.x, this.position.y - beamHeight / 2, this.position.z);
    }

    public setPosition(position: THREE.Vector3): void {
        this.position.copy(position);
        this.model.position.copy(position);
    }
}