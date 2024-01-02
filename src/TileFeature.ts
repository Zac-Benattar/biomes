import THREE from "three";
import { BufferGeometryUtils } from "three/examples/jsm/Addons.js";

export enum FeatureType {
    Rock = "Rock",
    BasicTree = "BasicTree",
    AlpineTree = "AlpineTree",
    JungleTree = "JungleTree",
    SavannaTree = "SavannaTree",
    Grass = "Grass",
    Snow = "Snow",
    Cactus = "Cactus",
    Tumbleweed = "Tumbleweed",
    AnimalSkull = "AnimalSkull",
    Coral = "Coral",
    Seaweed = "Seaweed",
    Shell = "Shell",
    Anchor = "Anchor",
    RockFormation = "RockFormation",
    Log = "Log",
    Mushroom = "Mushroom",
    Lilypad = "Lilypad",
    Flowers = "Flowers",
    Acorn = "Acorn",
    None = "None",
  }

export class TileFeature {

    public featureType: FeatureType;
    public model: THREE.Group = new THREE.Group();
    public cannonBody: CANNON.Body;

    constructor(featureType: FeatureType) {
        this.featureType = featureType;

        switch (featureType) {
            case FeatureType.Rock:
                this.rock();
                break;
            case FeatureType.BasicTree:
                this.basicTree();
                break;
            case FeatureType.AlpineTree:
                this.alpineTree();
                break;
            case FeatureType.JungleTree:
                this.jungleTree();
                break;
            case FeatureType.SavannaTree:
                this.savannaTree();
                break;
            }

    }

    private rock(height: number, position: THREE.Vector3): THREE.Mesh {
        const px = Math.random() * 0.5 - 0.25;
        const pz = Math.random() * 0.5 - 0.25;
    
        const geo = new THREE.SphereGeometry(Math.random() * 0.3 + 0.1, 7, 7);
        geo.translate(position.x + px, height, position.z + pz);
    
        let rockMaterial = new THREE.MeshStandardMaterial({
          color: 0x888888,
          flatShading: true,
        });
    
        let rockMesh = new THREE.Mesh(geo, rockMaterial);
        rockMesh.castShadow = true;
        rockMesh.receiveShadow = true;
    
        return rockMesh;
      }
    
      private alpineTree(height: number, position: THREE.Vector3): THREE.Group {
        const treeHeight = Math.random() * 1 + 1.25;
    
        const trunkGeo = new THREE.CylinderGeometry(0.1, 0.2, treeHeight, 10);
        trunkGeo.translate(position.x, height + treeHeight * 0.4, position.z);
    
        const lowerLeavesGeo = new THREE.CylinderGeometry(0, 1.3, treeHeight, 3);
        lowerLeavesGeo.translate(
          position.x,
          height + treeHeight * 0.3 + 1,
          position.z
        );
    
        const midLeavesGeo = new THREE.CylinderGeometry(0, 1, treeHeight, 3);
        midLeavesGeo.translate(
          position.x,
          height + treeHeight * 0.7 + 1,
          position.z
        );
    
        const upperLeavesGeo = new THREE.CylinderGeometry(0, 0.6, treeHeight, 3);
        upperLeavesGeo.translate(
          position.x,
          height + treeHeight * 1.25 + 1,
          position.z
        );
    
        const leaves = BufferGeometryUtils.mergeGeometries([
          lowerLeavesGeo,
          midLeavesGeo,
          upperLeavesGeo,
        ]);
    
        let leavesMaterial = new THREE.MeshStandardMaterial({
          color: 0x4f7942,
          flatShading: true,
        });
    
        let trunkMaterial = new THREE.MeshStandardMaterial({
          color: 0x8b4513,
          flatShading: true,
        });
    
        let trunkMesh = new THREE.Mesh(trunkGeo, trunkMaterial);
        trunkMesh.castShadow = true;
        trunkMesh.receiveShadow = true;
    
        let leavesMesh = new THREE.Mesh(leaves, leavesMaterial);
        leavesMesh.castShadow = true;
        leavesMesh.receiveShadow = true;
    
        let tree = new THREE.Group();
        tree.add(trunkMesh, leavesMesh);
    
        return tree;
      }
    
      private basicTree(height: number, position: THREE.Vector3): THREE.Group {
        const treeHeight = Math.random() * 1 + 1.25;
    
        const trunkGeo = new THREE.CylinderGeometry(0.1, 0.2, treeHeight, 10);
        trunkGeo.translate(position.x, height + treeHeight * 0.4, position.z);
    
        const puff1Radius = Math.random() * 0.5 + 0.2;
        const puff2Radius = Math.random() * 0.5 + 0.5;
        const puff3Radius = Math.random() * 0.5 + 0.2;
    
        const puff1 = new THREE.SphereGeometry(puff1Radius, 7, 7);
        const puff2 = new THREE.SphereGeometry(puff2Radius, 7, 7);
        const puff3 = new THREE.SphereGeometry(puff3Radius, 7, 7);
    
        puff1.translate(-puff1Radius, 0, 0);
        puff1.rotateY(puff1Radius * Math.PI * 2);
        puff2.translate(0, 0, 0);
        puff3.translate(puff3Radius, 0, 0);
        puff3.rotateY(puff3Radius * Math.PI * 2);
    
        const leavesGeo = BufferGeometryUtils.mergeGeometries([
          puff1,
          puff2,
          puff3,
        ]);
        leavesGeo.translate(position.x, height + treeHeight * 0.9, position.z);
    
        let leavesMaterial = new THREE.MeshStandardMaterial({
          color: 0x4f7942,
          flatShading: true,
        });
    
        let trunkMaterial = new THREE.MeshStandardMaterial({
          color: 0x8b4513,
          flatShading: true,
        });
    
        let trunkMesh = new THREE.Mesh(trunkGeo, trunkMaterial);
        trunkMesh.castShadow = true;
        trunkMesh.receiveShadow = true;
    
        let leavesMesh = new THREE.Mesh(leavesGeo, leavesMaterial);
        leavesMesh.castShadow = true;
        leavesMesh.receiveShadow = true;
    
        let tree = new THREE.Group();
        tree.add(trunkMesh, leavesMesh);
    
        return tree;
      }
    
      private jungleTree(height: number, position: THREE.Vector3): THREE.Group {
        const treeHeight = Math.random() * 3 + 3;
    
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, treeHeight, 10);
        trunkGeo.translate(position.x, height + treeHeight * 0.4, position.z);
    
        const puff1Radius = Math.random() * 0.8 + 0.5;
        const puff2Radius = Math.random() * 0.8 + 0.8;
        const puff3Radius = Math.random() * 0.8 + 0.5;
        const puff1 = new THREE.SphereGeometry(puff1Radius, 7, 7);
        const puff2 = new THREE.SphereGeometry(puff2Radius, 7, 7);
        const puff3 = new THREE.SphereGeometry(puff3Radius, 7, 7);
    
        puff1.translate(-puff1Radius, 0, 0);
        puff1.rotateY(puff1Radius * Math.PI * 2);
        puff2.translate(0, 0, 0);
        puff3.translate(puff3Radius, 0, 0);
        puff3.rotateY(puff3Radius * Math.PI * 2);
    
        const leavesGeo = BufferGeometryUtils.mergeGeometries([
          puff1,
          puff2,
          puff3,
        ]);
        leavesGeo.translate(position.x, height + treeHeight * 0.9, position.z);
    
        let leavesMaterial = new THREE.MeshStandardMaterial({
          color: 0x4f7942,
          flatShading: true,
        });
    
        let trunkMaterial = new THREE.MeshStandardMaterial({
          color: 0x8b4513,
          flatShading: true,
        });
    
        let trunkMesh = new THREE.Mesh(trunkGeo, trunkMaterial);
        trunkMesh.castShadow = true;
        trunkMesh.receiveShadow = true;
    
        let leavesMesh = new THREE.Mesh(leavesGeo, leavesMaterial);
        leavesMesh.castShadow = true;
        leavesMesh.receiveShadow = true;
    
        let tree = new THREE.Group();
        tree.add(trunkMesh, leavesMesh);
    
        return tree;
      }
}

