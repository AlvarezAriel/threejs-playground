import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';


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
    // instantiate a loader
    const loadersvg = new SVGLoader();

// load a SVG resource

    loadersvg.load(
        // resource URL
        'boton_elevador.svg',
        // called when the resource is loaded
        function ( data ) {

            const paths = data.paths;
            const group = new THREE.Group();
            group.scale.multiplyScalar( .1 );
            group.position.x = 0.55;
            group.position.y = 0.56;
            group.position.z = 0.3;


            for ( let i = 0; i < paths.length; i ++ ) {
                console.log('cargo bien');
                const path = paths[ i ];

                const material = new THREE.MeshBasicMaterial( {
                    color: path.color,
                    side: THREE.DoubleSide,
                    depthWrite: false
                } );

                const shapes = SVGLoader.createShapes( path );

                for ( let j = 0; j < shapes.length; j ++ ) {

                    const shape = shapes[ j ];
                    const geometry = new THREE.ShapeGeometry( shape );
                    const mesh = new THREE.Mesh( geometry, material );
                    group.add( mesh );

                }

            }


            scene.add( group );
            console.log(group);

            const box = new THREE.Box3();
            box.setFromCenterAndSize( group.position, group.scale );

            const helper = new THREE.Box3Helper( box, 0xffff00 );
            scene.add( helper );

        },
        // called when loading is in progresses
        function ( xhr ) {

            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

        },
        // called when loading has errors
        function ( error ) {

            console.log( 'An error happened', error );

        }
    );

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

    let drawer = scene.getObjectByName("drawer_01");
    if (drawer) {
        drawer.position.z = state.drawer;
    }
}