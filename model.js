import * as THREE from 'three';

const uniforms = {
    'amplitude': { value: 1.0 },
    'color': { value: new THREE.Color( 0xff2200 ) },
};

export function loadModel(loader, scene) {
    loader.load( 'Desk.glb', function ( gltf ) {
        scene.add( gltf.scene );
    }, undefined, function ( error ) {
        console.error( error );
    } );


    loader.load( 'env.glb', function ( gltf ) {
        gltf.scene;
        scene.add( gltf.scene );
        console.log(gltf.scene);
    }, undefined, function ( error ) {
        console.error( error );
    } );
}

export function updateModel(scene, state) {
    let board = scene.getObjectByName("Board");
    if(board) {
        board.position.y = 0.14 * state.altura;
    }

    let legs = scene.getObjectByName("Legs_01");
    if(legs) {
        legs.position.y = 0.07 * state.altura;
    }
}