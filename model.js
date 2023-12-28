import * as THREE from 'three';

export function loadModel(loader, scene, showRoom = false) {
    loader.load('Desk.glb', function (gltf) {
        applyShadows(gltf.scene);
        scene.add(gltf.scene);
        console.log("Loaded: ", gltf.scene);
    }, undefined, function (error) {
        console.error(error);
    });

    if(showRoom) {
        loader.load('env.glb', function (gltf) {
            applyShadows(gltf.scene);
            gltf.scene.rotateY(2.7);
            scene.add(gltf.scene);
            console.log("Loaded: ", gltf.scene);
        }, undefined, function (error) {
            console.error(error);
        });
    }
}

function applyShadows(scene) {
    scene.traverse(function (child) {

        if (child.isMesh) {

            child.castShadow = true;

            child.receiveShadow = true;

        }
    });
}

export function updateModel(scene, state) {
    let board = scene.getObjectByName("Board");
    if (board) {
        board.position.y = 0.14 * state.altura;
    }

    let legs = scene.getObjectByName("Legs_01");
    if (legs) {
        legs.position.y = 0.07 * state.altura;
    }
}