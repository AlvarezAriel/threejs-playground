import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { HDRCubeTextureLoader } from 'three/addons/loaders/HDRCubeTextureLoader.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const loader = new GLTFLoader();
const clock = new THREE.Clock();

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );

const pmremGenerator = new THREE.PMREMGenerator( renderer );

const renderModel = new RenderPass( scene, camera );
const effectSMAA = new SMAAPass( window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio() );
const outputPass = new OutputPass();

let composer = new EffectComposer( renderer );

composer.addPass( renderModel );
composer.addPass( effectSMAA );
composer.addPass( outputPass );

scene.background = new THREE.Color( 0x1e1e1e );
scene.environment = pmremGenerator.fromScene( new RoomEnvironment( renderer ), 0.04 ).texture;

renderer.autoClear = false;
document.body.appendChild( renderer.domElement );

camera.position.z = 5;

const controls = new OrbitControls( camera, renderer.domElement );

const params = {
    shadows: true,
    altura: 0.0,
};
const gui = new GUI();
gui.add( params, 'altura', 0, 1 );
gui.add( params, 'shadows' );
gui.open();

loader.load( 'Desk.glb', function ( gltf ) {
    scene.add( gltf.scene );
}, undefined, function ( error ) {
    console.error( error );
} );

let hdrCubeRenderTarget;

THREE.DefaultLoadingManager.onLoad = function ( ) {
    pmremGenerator.dispose();
};

let hdrCubeMap = new HDRCubeTextureLoader()
    .setPath( './' )
    .load( ['sunset_jhbcentral_4k.exr'], function () {

        hdrCubeRenderTarget = pmremGenerator.fromCubemap( hdrCubeMap );

        hdrCubeMap.magFilter = THREE.LinearFilter;
        hdrCubeMap.needsUpdate = true;

    } );

pmremGenerator.compileCubemapShader();

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
    const delta = clock.getDelta();
    controls.update(delta);
    //scene.background = hdrCubeMap;


    scene.getObjectByName("Board").position.y = 10 * params.altura;
    render()
}

function render() {
    renderer.clear();
    composer.render( 0.01 );
}

animate();