import * as THREE from 'three';
import {SVGLoader} from 'three/addons/loaders/SVGLoader.js';

const guiData = {
    currentURL: 'boton_elevador.svg',
    drawFillShapes: true,
    drawStrokes: true,
    fillShapesWireframe: false,
    strokesWireframe: false
};
const group = new THREE.Group();

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


    loadSVG(scene, guiData.currentURL);

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

    group.lookAt(state.cameraPosition);
}


function loadSVG(scene, url) {
    const helper = new THREE.GridHelper(160, 10, 0x8d8d8d, 0xc1c1c1);
    helper.rotation.x = Math.PI / 2;
    scene.add(helper);

    const loader = new SVGLoader();

    loader.load(url, function (data) {
        const svgScale = 1 / 5000;
        group.position.x = 0.53;
        group.position.y = 0.56;
        group.position.z = 0.32;
        group.scale.set(svgScale,svgScale,svgScale);
        group.rotateX(Math.PI / 2);

        let renderOrder = 0;

        for (const path of data.paths) {

            const fillColor = path.userData.style.fill;

            if (guiData.drawFillShapes && fillColor !== undefined && fillColor !== 'none') {

                const material = new THREE.MeshBasicMaterial({
                    color: new THREE.Color().setStyle(fillColor),
                    opacity: path.userData.style.fillOpacity,
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
