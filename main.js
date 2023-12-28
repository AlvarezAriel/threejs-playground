import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GUI} from 'three/addons/libs/lil-gui.module.min.js';
import {loadModel} from "./model.js";
import {updateModel} from "./model.js";
import {CustomPostProcessing} from "./post-processing.js";
import {Vector2} from "three";
import {RGBELoader} from "three/addons";

const params = {
    showHdr: true,
    altura: 0.0,
    exposure: 0.5,
    background: "#C6BDB3",
    lightIntensity: 100,
    lightColor: "#ffffff",
    fov: 56,
    bloomStrength: 0.2,
    bloomRadius: 1,
};

const cameraParams = {
    lookAtY: 0.25,
    offsetY: 1,
    zoom:2.5,
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( params.fov, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set(1.75,1.1,2.1);

const loader = new GLTFLoader();
const clock = new THREE.Clock();

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMappingExposure = params.exposure;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const pmremGenerator = new THREE.PMREMGenerator(renderer);
const renderModel = new RenderPass(scene, camera);
let composer = new EffectComposer(renderer);
const customPostProcessingPass = new ShaderPass( CustomPostProcessing );
const bloomPass = new UnrealBloomPass( new Vector2( 256, 256 ),  0.2,  1);
composer.addPass(renderModel);
composer.addPass(bloomPass);
//composer.addPass(customPostProcessingPass);

//scene.background = new THREE.Color( 0x737977 );
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(renderer), 0.04).texture;

renderer.autoClear = false;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: ''
}
camera.zoom=cameraParams.zoom;
camera.position.y=cameraParams.offsetY;
controls.target.y=cameraParams.lookAtY;
camera.updateProjectionMatrix();
let hdrTexture = null;
function loadHDR() {
    new RGBELoader()
        .setPath('./')
        .load(['small_empty_room_1_2k.hdr'], function (texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            let envMap = pmremGenerator.fromEquirectangular(texture).texture;

            if(params.showHdr) {
            if(params.showHdr) {
                hdrTexture = texture;
                scene.background = texture;
            } else {
                scene.background = new THREE.Color(params.background);}
            }
            scene.environment = envMap;

            texture.dispose();
            pmremGenerator.dispose();
        });
    THREE.DefaultLoadingManager.onLoad = function () {
        pmremGenerator.dispose();
    };
    pmremGenerator.compileCubemapShader();
}

const spotLight = new THREE.SpotLight( params.lightColor,  params.lightIntensity);
const spotLightHelper = new THREE.SpotLightHelper( spotLight );
function loadLights() {

    spotLight.position.set( -3, 3, 0 );
    spotLight.map = new THREE.TextureLoader().load( "fabric_texture.jpg" );
    spotLight.angle = 10;
    spotLight.castShadow = true;
    spotLight.distance = 20;

    renderer.shadowMap.enabled = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;

    spotLight.shadow.camera.near = 0.5; // default
    spotLight.shadow.camera.far = 500; // default
    spotLight.shadow.camera.fov =  90;
    spotLight.shadow.focus = 1;

    spotLight.lookAt(0,0,0);

    spotLightHelper.color = 0xff0000;
    scene.add( spotLight );
    scene.add( spotLightHelper );
}

function loadGUI() {
    const gui = new GUI();
    gui.add(params, 'altura', 0, 1);
    gui.add(params, 'exposure', 0, 5.0).onChange(function (value) {
        renderer.toneMappingExposure = value;
    });
    gui.add(params, 'fov', 10, 100.0).onChange(function (value) {
        camera.fov = params.fov;
        camera.updateProjectionMatrix();
    });
    gui.addColor(params, 'background').onChange(function (colorValue) {
        if(!params.showHdr) {
            scene.background = new THREE.Color(colorValue);
        }
    });
    gui.add(params, 'showHdr').onChange(function (show) {
        if(!params.showHdr) {
            if(show) {
                scene.background = hdrTexture;
                pmremGenerator.compileCubemapShader();
            } else {
                scene.background = new THREE.Color(params.background);
            }
        }
    });

    const folder = gui.addFolder( 'Light' );
    folder.add(params, 'lightIntensity', 0, 500.0).onChange(function (value) {
        spotLight.intensity = value;
    });
    folder.addColor(params, 'lightColor').onChange(function (colorValue) {
        spotLight.color = new THREE.Color(colorValue);
    });
    folder.add(params, 'bloomStrength').onChange(function (value) {
        bloomPass.strength = value;
    });
    folder.add(params, 'bloomRadius').onChange(function (value) {
        bloomPass.radius = value;
    });

    const cameraFolder = gui.addFolder( 'Camera' );
    cameraFolder.add(cameraParams, 'lookAtY', -1, 2.5).onChange(function (value) {
        controls.target.y = value;
    });
    cameraFolder.add(cameraParams, 'offsetY', -1, 2.5).onChange(function (value) {
        camera.position.y = value;
    });
    cameraFolder.add(cameraParams, 'zoom', -1, 5).onChange(function (value) {
        camera.zoom = value;
        camera.updateProjectionMatrix();
    });

    gui.open();
}

function init() {
    loadHDR();
    loadGUI();
    loadLights();
    loadModel(loader, scene);
}

window.addEventListener('resize', onWindowResize);

function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    composer.setSize(width, height);
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    update(delta)
    render(delta)
}

function update(delta) {
    controls.update(delta);
    updateModel(scene, params);

    const time = performance.now() / 3000;
    spotLight.position.z = Math.cos( time ) * 2.5;

    spotLightHelper.update();
}

function render(delta) {
    //renderer.clear();
    composer.render(delta);
}

init();
animate();