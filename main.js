import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {GUI} from 'three/addons/libs/lil-gui.module.min.js';
import {loadModel} from "./model.js";
import {updateModel} from "./model.js";
import {CustomPostProcessing} from "./post-processing.js";
import {PlaneGeometry, sRGBEncoding, Vector2} from "three";
import {GammaCorrectionShader, RectAreaLightHelper, RGBELoader} from "three/addons";
import {SMAAPass} from 'three/addons/postprocessing/SMAAPass.js';
import { SSAARenderPass } from 'three/addons/postprocessing/SSAARenderPass.js';
import {SSRPass} from 'three/addons/postprocessing/SSRPass.js';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';
import { TAARenderPass } from 'three/addons/postprocessing/TAARenderPass.js';
import {
    BloomEffect,
    EffectComposer,
    EffectPass,
    RenderPass,
    DepthOfFieldEffect,
    FXAAEffect,
    NoiseEffect,
    SMAAEffect,
    SSAOEffect,
    VignetteEffect,
    RealisticBokehEffect,
    ToneMappingEffect,
    GammaCorrectionEffect,
    BrightnessContrastEffect,
    SMAAPreset,
    EdgeDetectionMode, BlendFunction
} from "postprocessing";

const params = {
    showHdr: false,
    altura: 0.0,
    boardScale: 1.0,
    drawer: 0,
    exposure: 1.0,
    background: "#ffffff",
    lightIntensity: 100,
    lightColor: "#ffffff",
    fov: 56,
    bloomStrength: 0.1,
    bloomRadius: 0.2,
    cameraPosition: null,
};

const cameraParams = {
    lookAtY: 0.25,
    offsetY: 1,
    zoom: 2.5,
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(params.fov, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(1.75, 1.1, 2.1);
params.cameraPosition = camera.position;

const loader = new GLTFLoader();
const clock = new THREE.Clock();
const pixelRatio = new THREE.Vector2();

const renderer = new THREE.WebGLRenderer({
    powerPreference: "high-performance",
    antialias: false,
    stencil: false,
    depth: false
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(1.5);
renderer.toneMappingExposure = params.exposure;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputEncoding = sRGBEncoding
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.getDrawingBufferSize(pixelRatio);

const pmremGenerator = new THREE.PMREMGenerator(renderer);

// Follow order:
// SMAA/FXAA
// SSR (NYI)
// SSAO
// DoF
// Motion Blur (NYI)
// Chromatic Aberration
// Bloom
// God Rays
// Vignette
// Tone Mapping
// LUT / Color Grading
// Noise / Film Grain
let composer = new EffectComposer(renderer);
const aa =  new FXAAEffect()
aa.samples = 2;
aa.subpixelQuality = 1.0;
aa.minEdgeThreshold = 1.0;
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new EffectPass(camera,
    aa,
    //
    new SMAAEffect({ preset: SMAAPreset.ULTRA, edgeDetectionMode: EdgeDetectionMode.DEPTH}),
    new SSAOEffect(camera),
    new BloomEffect({radius: 2, intensity: 0.1}),
    new VignetteEffect(),
    new BrightnessContrastEffect({
        blendFunction: BlendFunction.MULTIPLY,
        brightness: 0.8,
        contrast: 0.1,
    }),
    new ToneMappingEffect(),
));


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
//máxima distancia de la cámara
controls.rotateSpeed = 0.6;
controls.minDistance = 1.5;
controls.maxDistance = 4;
controls.enableDamping = true;
//controls.dampingFactor = 0.1;
//Limite Vertical de la rotación
controls.minPolarAngle = Math.PI / 6;
controls.maxPolarAngle = Math.PI / 2;
//Limite Horizontal de la rotación
controls.minAzimuthAngle = Math.PI / -1.5;
controls.maxAzimuthAngle = Math.PI / 1.5;

camera.zoom = cameraParams.zoom;
camera.position.y = cameraParams.offsetY;
controls.target.y = cameraParams.lookAtY;
camera.updateProjectionMatrix();
let hdrTexture = null;

function loadHDR() {
    new RGBELoader()
        .setPath('./')
        .load(['poly_haven_studio_1k.hdr'], function (texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            let envMap = pmremGenerator.fromEquirectangular(texture).texture;

            if (params.showHdr) {
                if (params.showHdr) {
                    hdrTexture = texture;
                    scene.background = texture;
                } else {
                    scene.background = new THREE.Color(params.background);
                }
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

const spotLight = new THREE.SpotLight(params.lightColor, params.lightIntensity);
const spotLightHelper = new THREE.SpotLightHelper(spotLight);

function loadLights() {

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    spotLight.position.set(-2, 4, 0);
    spotLight.angle = 10;
    spotLight.castShadow = true;
    spotLight.distance = 12;

    renderer.shadowMap.enabled = true;
    spotLight.shadow.mapSize.width = 2048*2;
    spotLight.shadow.mapSize.height = 2048*2;

    spotLight.shadow.camera.near = 0.1; // default
    spotLight.shadow.camera.far = 50; // default
    spotLight.shadow.camera.fov = params.fov;
    spotLight.shadow.focus = 1;

    spotLight.lookAt(0, 0, 0);

    spotLightHelper.color = 0xff0000;
    scene.add(spotLight);
    //scene.add(spotLightHelper);
}

function loadGUI() {
    const gui = new GUI();
    gui.add(params, 'altura', 0, 2);
    gui.add(params, 'boardScale', 1, 1.1);
    gui.add(params, 'drawer', 0, 0.1);
    gui.add(params, 'exposure', 0, 5.0);
    gui.add(params, 'fov', 10, 100.0);
    gui.addColor(params, 'background').onChange(function (colorValue) {
        if (!params.showHdr) {
            scene.background = new THREE.Color(colorValue);
        }
    });
    gui.add(params, 'showHdr').onChange(function (show) {
        if (!params.showHdr) {
            if (show) {
                scene.background = hdrTexture;
                pmremGenerator.compileCubemapShader();
            } else {
                scene.background = new THREE.Color(params.background);
            }
        }
    });

    const folder = gui.addFolder('Light');
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

    const cameraFolder = gui.addFolder('Camera');
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
    if (params.showHdr) {
        scene.background = hdrTexture;
    } else {
        scene.background = new THREE.Color(params.background);
    }
    renderer.toneMappingExposure = params.exposure;
    params.cameraPosition = camera.position;

    updateModel(scene, params, camera);

    // Update camera
    camera.fov = params.fov;
    camera.updateProjectionMatrix();

    const time = performance.now() / 3000;
    spotLight.position.z = Math.cos(time) * 2.5;

    spotLightHelper.update();
}

function render(delta) {
    //renderer.clear();
    composer.render(delta);
}


init();
animate();