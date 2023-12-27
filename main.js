import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { HDRCubeTextureLoader } from 'three/addons/loaders/HDRCubeTextureLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import {loadModel} from "./model.js";
import {updateModel} from "./model.js";

const params = {
    shadows: true,
    altura: 0.0,
    envMap: 'HDR JPG',
    roughness: 0.0,
    metalness: 1.0,
    exposure: 0.5,
    background: "#a3a3a3",
    fov: 56,
    debug: false
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( params.fov, window.innerWidth / window.innerHeight, 0.1, 1000 );
const loader = new GLTFLoader();
const clock = new THREE.Clock();

const renderer = new THREE.WebGLRenderer( { antialias: true } );

renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.toneMappingExposure = params.exposure;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const pmremGenerator = new THREE.PMREMGenerator( renderer );
const renderModel = new RenderPass( scene, camera );
let composer = new EffectComposer( renderer );

composer.addPass( renderModel );

//scene.background = new THREE.Color( 0x737977 );
scene.environment = pmremGenerator.fromScene( new RoomEnvironment( renderer ), 0.04 ).texture;

renderer.autoClear = false;
document.body.appendChild( renderer.domElement );

camera.position.z = 5;

const controls = new OrbitControls( camera, renderer.domElement );

function loadGUI() {
    const gui = new GUI();
    gui.add( params, 'altura', 0, 1 );
    gui.add( params, 'shadows' );
    gui.add( params, 'exposure', 0, 5.0 );
    gui.add( params, 'fov', 10, 100.0 );
    gui.addColor(params, 'background').onChange( function(colorValue) {
        scene.background = new THREE.Color( colorValue );
    });
    gui.open();

    scene.background = new THREE.Color( params.background );
}

function loadHDR() {
    new HDRCubeTextureLoader()
        .setPath( './' )
        .load( ['small_empty_room_1_2k.hdr'], function (texture) {
            let envMap = pmremGenerator.fromEquirectangular( texture ).texture;

            scene.background = envMap;
            scene.environment = envMap;

            texture.dispose();
            pmremGenerator.dispose();
        } );
    THREE.DefaultLoadingManager.onLoad = function ( ) {
        pmremGenerator.dispose();
    };
    pmremGenerator.compileCubemapShader();
}

function init() {
    loadHDR();
    loadGUI();
    loadModel(loader, scene);
}

window.addEventListener( 'resize', onWindowResize );
function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize( width, height );
    composer.setSize( width, height );
}

function animate() {
    requestAnimationFrame( animate );
    update(clock.getDelta())
    render()
}

function update(delta) {
    controls.update(delta);
    //scene.background = hdrCubeMap;
    renderer.toneMappingExposure = params.exposure;
    updateModel(scene, params);

    // Update camera
    camera.fov = params.fov;
    camera.updateProjectionMatrix();
}

function render() {
    //renderer.clear();
    composer.render( 0.01 );
}

init();
animate();