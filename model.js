import * as THREE from 'three';
import {SVGLoader} from 'three/addons/loaders/SVGLoader.js';
import {MathUtils, MeshLambertMaterial, MultiplyBlending} from "three";

const guiData = {
    currentURL: 'boton_elevador.svg',
    drawFillShapes: true,
    drawStrokes: true,
    fillShapesWireframe: false,
    strokesWireframe: false
};
const group = new THREE.Group();
const svgScale = 1 / 5000;
let textureUp;
let textureDown;
let shadowPlane;
let secondShadow;

export function loadModel(loader, scene, showRoom = false) {
    loader.load('Desk.glb', function (gltf) {
        applyShadows(gltf.scene);
        scene.add(gltf.scene);
        console.log("Loaded: ", gltf.scene);
    }, undefined, function (error) {
        console.error(error);
    });

    if (showRoom) {
        loader.load('env.glb', function (gltf) {
            applyShadows(gltf.scene);
            gltf.scene.rotateY(2.7);
            scene.add(gltf.scene);
            console.log("Loaded: ", gltf.scene);
        }, undefined, function (error) {
            console.error(error);
        });
    }

    const geometry = new THREE.PlaneGeometry( 4, 4 );
    geometry.rotateX(-Math.PI / 2);

    textureUp = new THREE.TextureLoader().load('elevado.png' );
    textureDown = new THREE.TextureLoader().load('base.png' );
    const material = new THREE.MeshBasicMaterial({
        //map: textureUp,
        //alphaMap: textureUp,
        transparent: true,
        lightMap: textureUp,
    })
    material.opacity = 0;
    shadowPlane = new THREE.Mesh( geometry, material );
    shadowPlane.receiveShadow = false;
    console.log("Shadow plane: ", shadowPlane);
    scene.add( shadowPlane );

    const secondShadowMaterial = new THREE.MeshBasicMaterial({
        //map: textureUp,
        //alphaMap: textureUp,
        transparent: true,
        lightMap: textureDown,
    })
    secondShadow = new THREE.Mesh( geometry, secondShadowMaterial );
    secondShadow.receiveShadow = false;
    console.log("secondShadow plane: ", secondShadow);
    scene.add( secondShadow );

    loadSVG(scene, guiData.currentURL);

}

function applyShadows(scene) {
    scene.traverse(function (child) {

        if (child.isMesh) {

            child.castShadow = false;

            child.receiveShadow = false;

        }
    });
}

export function updateModel(scene, state, camera) {
    let board = scene.getObjectByName("Board");
    if (board) {
        let deformLight = 0.02;
        board.position.y = 0.14 * state.altura;
        // shadowPlane.scale.x = 1 + deformLight * state.altura;
        // shadowPlane.scale.z = 1 + deformLight/2 * state.altura;
        // shadowPlane.position.x = (deformLight / 2) * state.altura;
        // shadowPlane.position.z = -(deformLight / 2) * state.altura;
        shadowPlane.material.opacity = state.altura;
        secondShadow.material.opacity = 1 - state.altura;
    }

    let woodenTable = scene.getObjectByName("WoodenTable");
    if (woodenTable) {
        woodenTable.scale.x = state.boardScale;
    }

    let legs = scene.getObjectByName("Legs_01");
    if (legs) {
        legs.position.y = 0.07 * state.altura;
    }

    let drawer = scene.getObjectByName("drawer_01");
    if (drawer) {
        drawer.position.z = state.drawer;
    }

    //0.8 3.35
    let distance = camera.position.distanceTo(group.position);

    let scale = MathUtils.mapLinear(
        distance,
        0.8,
        3.35,
        svgScale,
        svgScale * 2,
    );

    group.scale.set(scale,scale,scale);
    group.lookAt(state.cameraPosition);
}


function loadSVG(scene, url) {
    // const helper = new THREE.GridHelper(160, 10, 0x8d8d8d, 0xc1c1c1);
    // helper.rotation.x = Math.PI / 2;
    // scene.add(helper);

    const loader = new SVGLoader();

    loader.load(url, function (data) {
        group.position.x = 0.47;
        group.position.y = 0.56;
        group.position.z = 0.12;
        group.scale.set(svgScale,svgScale,svgScale);
        group.rotateX(Math.PI / 2);

        let renderOrder = 0;

        for (const path of data.paths) {

            const fillColor = path.userData.style.fill;

            if (guiData.drawFillShapes && fillColor !== undefined && fillColor !== 'none') {

                const material = new THREE.MeshBasicMaterial({
                    color: new THREE.Color().setStyle(fillColor),
                    opacity: path.userData.style.fillOpacity * 0.6,
                    transparent: true,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                    wireframe: guiData.fillShapesWireframe
                });

                const shapes = SVGLoader.createShapes(path);

                for (const shape of shapes) {

                    const geometry = new THREE.ShapeGeometry(shape);
                    const mesh = new THREE.Mesh(geometry, material);
                    mesh.renderOrder = renderOrder++;

                    group.add(mesh);

                }

            }

            const strokeColor = path.userData.style.stroke;

            if (guiData.drawStrokes && strokeColor !== undefined && strokeColor !== 'none') {

                const material = new THREE.MeshBasicMaterial({
                    color: new THREE.Color().setStyle(strokeColor),
                    opacity: path.userData.style.strokeOpacity,
                    transparent: true,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                    wireframe: guiData.strokesWireframe
                });

                for (const subPath of path.subPaths) {

                    const geometry = SVGLoader.pointsToStroke(subPath.getPoints(), path.userData.style);

                    if (geometry) {
                        const mesh = new THREE.Mesh(geometry, material);
                        mesh.renderOrder = renderOrder++;

                        group.add(mesh);
                    }

                }

            }

        }

        scene.add(group);
    });
}
