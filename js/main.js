import * as THREE from './libs/threejs/build/three.module.js';
import { OrbitControls } from './libs/threejs/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from './libs/threejs/examples/jsm/loaders/GLTFLoader.js';
import TWEEN from './libs/tween.esm.js';

var scene;
var frames = 0;
var objectsTween;
var vehicles;
var plants;
var camera;
var renderer;
var collision =[];
var clock;
var elapsedTime = 0;
var counter_time = 0;

//Sounds variables
var sound, carSound, listener, audioLoader, pickupSound;

var fuelTween;

var config = {
  game: {
    velocity: 100,
    difficulty: 3,
    yspawn: 0,
    zspawn: 0,
    x_lane_0: -7.3,
    x_lane_1: -2.4,
    x_lane_2: 2.4,
    x_lane_3: 7.3,
    z_lane: 150,
    z_remove: 25,
    z_max: 35,
    z_min: 18,
    health: 3,
  },
  colors: {
    sky: 'white',
  },
  utils: {
    showFog: true,
    isPlaying: false,
    isStarted: false,
    hitbox_visible: false,
    soundsOn: true,
    initialPositionz: 20,
    soundAfterPlay: false,
    displayMenu: false,
  }
  
}

//Declaring the car
var ferrari = {
  mesh: new THREE.Object3D(),
  positions :{
    left: -1,
    ahead: 0,
    right: 1,
    back: 2,
  },
  elements:{
    wheel : {},
  },
  rotations :{
    right: Math.PI - degtorad(15),
    left: Math.PI + degtorad(15),
  }
}
var road = {
  mesh: new THREE.Object3D()
}

var grassRight= {
  mesh: new THREE.Object3D()
}

var grassLeft= {
  mesh: new THREE.Object3D()
}


const hitBox = new THREE.BoxGeometry(1, 1, 1);
const hitBox_material = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: .2,
});

const num_vehicles = 5; 
const models = {
  ferrari: {url: "./assets/cars/ferrari/scene.gltf"},
  road: {url: "./assets/environment/road/scene.gltf"},
  truck: {url: "./assets/cars/truck/scene.gltf"},
  fiat_500: {url: "./assets/cars/fiat_500/scene.gltf"},
  smart: {url: "./assets/cars/smart/scene.gltf"},
  police: {url: "./assets/cars/police_car/scene.gltf"},
  fuel_tank: {url: "./assets/environment/fuel_tank/scene.gltf"},
  cactus: {url: "./assets/environment/cactus/scene.gltf"},
}

const sounds = {
  soundtrack: {url: "./assets/music/cotton_eye_joe.wav"},
  carSound: {url: "./assets/music/carSound.wav"},
  pickupSound: {url: "./assets/music/pickup.wav"},
  crashSound: {url: "./assets/music/crash.wav"},
  gameoverSound: {url: "./assets/music/gameover_sound.wav"},
}

//For Collisions
var ferrari_hitbox;
var hitbox_toCheck = [];

function degtorad(degrees)
{
  var pi = Math.PI;
  return degrees * (pi/180);
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function initFerrari(){
  ferrari.mesh = new THREE.Object3D();
  ferrari.mesh.name = "Ferrari";

  ferrari.mesh.position.set(0,config.game.yspawn,0);
  ferrari.mesh.rotation.set(0,Math.PI,0);
  let body = models.ferrari.gltf.getObjectByName('RootNode');

  ferrari_hitbox = new THREE.Mesh(hitBox, hitBox_material);
  ferrari_hitbox.name = "ferrari_hitbox";
  ferrari_hitbox.scale.set(2.5, 2, 6.5);
  ferrari_hitbox.position.set(0, 1, 0.3);
  ferrari_hitbox.visible = config.utils.hitbox_visible;

  ferrari.mesh.add(body);
  ferrari.mesh.add(ferrari_hitbox);
  scene.add(ferrari.mesh);

  initFerrariElements();
}
function initFerrariElements() {

	ferrari.mesh.traverse( o => {
		
		if (o.name === 'Cylinder') { 
			ferrari.elements.wheel.forward = o;
    }
    if (o.name === 'Cylinder001') { 
			ferrari.elements.wheel.backward = o;
    }

	} );

}

function InitFerrariPosition(){
  ferrari.mesh.position.set(0, 5, config.utils.initialPositionz);
  ferrari.mesh.rotation.set(0, degtorad(90) ,0);
  moveWheels();
}

function moveWheels(){
  var delta = { z: 0 };
    objectsTween = new TWEEN.Tween(delta)
    .to({ z: 0.3 },config.game.velocity) 
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate( 
          () => {
            ferrari.elements.wheel.forward.rotation.z = ferrari.elements.wheel.forward.rotation.z + degtorad(100*delta.z);
            ferrari.elements.wheel.backward.rotation.z = ferrari.elements.wheel.backward.rotation.z + degtorad(100*delta.z);
          }
    ).onComplete(()=>{
      moveWheels();
    }).start();
}

function pushFerrariOnInitPosition(){
  performRotationTo(degtorad(180));
  ferrariOnStreet();
}

function ferrariOnStreet(){
  if (ferrari.mesh.position.y < config.game.yspawn + 0.23) return;
  var delta = { y: 0 };
  objectsTween = new TWEEN.Tween(delta)
  .to({ y: 0.1 },config.game.velocity) 
  .easing(TWEEN.Easing.Linear.None)
  .onUpdate( 
        () => {
          ferrari.mesh.position.y = ferrari.mesh.position.y - delta.y;
          ferrari.mesh.position.z = ferrari.mesh.position.z - delta.y;
        }
  ).onComplete(() =>{
    ferrariOnStreet();
  }).start();
}


function initRoad(){
  const texLoader = new THREE.TextureLoader();
  const geometry = new THREE.BoxGeometry(1,1,1);

  var texture = texLoader.load("./assets/environment/road_texture.jpg");
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set( 200, 1 );

  const material = new THREE.MeshBasicMaterial({
    map: texture,
  });
  road.mesh = new THREE.Mesh( geometry, material );
  road.mesh.position.set(0, config.game.yspawn - 0.5 , 0);
  road.mesh.rotation.set(0,Math.PI/2,0);
  road.mesh.scale.set(15000,1,20);
  road.mesh.receiveShadow = true;
  scene.add( road.mesh );
}
var cubeNormalMaterial;

function initGrassRight(){
  
  const geometry = new THREE.BoxGeometry(1,1,1);
  cubeNormalMaterial =  new THREE.MeshPhongMaterial();
  cubeNormalMaterial.map = THREE.ImageUtils.loadTexture("./assets/environment/sand.jpg");
  cubeNormalMaterial.map.wrapS = THREE.RepeatWrapping;
  cubeNormalMaterial.map.wrapT = THREE.RepeatWrapping;
  cubeNormalMaterial.map.repeat.set( 200, 2 );
  cubeNormalMaterial.normalMap = THREE.ImageUtils.loadTexture("./assets/environment/sand_bump.jpg");
  cubeNormalMaterial.normalMap.wrapS = THREE.RepeatWrapping;
  cubeNormalMaterial.normalMap.wrapT = THREE.RepeatWrapping;
  cubeNormalMaterial.normalMap.repeat.set( 200, 2 );

  grassRight.mesh = new THREE.Mesh(
    geometry, cubeNormalMaterial);
  grassRight.mesh.position.set(config.game.x_lane_3 +12.7, config.game.yspawn - 0.5 , 0);
  grassRight.mesh.rotation.set(0,Math.PI/2,0);
  grassRight.mesh.scale.set(15000,1,20);
  grassRight.mesh.receiveShadow = true;
  scene.add(grassRight.mesh);
  

}

function initGrassLeft(){
  const geometry = new THREE.BoxGeometry(1,1,1);
  cubeNormalMaterial =  new THREE.MeshPhongMaterial();
  cubeNormalMaterial.map = THREE.ImageUtils.loadTexture("./assets/environment/sand.jpg");
  cubeNormalMaterial.map.wrapS = THREE.RepeatWrapping;
  cubeNormalMaterial.map.wrapT = THREE.RepeatWrapping;
  cubeNormalMaterial.map.repeat.set( 200, 2 );
  cubeNormalMaterial.normalMap = THREE.ImageUtils.loadTexture("./assets/environment/sand_bump.jpg");
  cubeNormalMaterial.normalMap.wrapS = THREE.RepeatWrapping;
  cubeNormalMaterial.normalMap.wrapT = THREE.RepeatWrapping;
  cubeNormalMaterial.normalMap.repeat.set( 200, 2 );

  grassLeft.mesh = new THREE.Mesh(
    geometry, cubeNormalMaterial);
  grassLeft.mesh.position.set(config.game.x_lane_0 -12.7, config.game.yspawn - 0.5 , 0);
  grassLeft.mesh.rotation.set(0,Math.PI/2,0);
  grassLeft.mesh.scale.set(15000,1,20);
  grassLeft.mesh.receiveShadow = true;
  scene.add(grassLeft.mesh);


}

function spawnTruck(corsia,offset){

  var truck = new THREE.Object3D();
  truck.name = "Truck";
  truck.corsia = corsia;
  let body = models.truck.gltf.clone();
  let hitbox_truck = createHitBox("truck");
  
  truck.add(body);
  truck.add(hitbox_truck);

  truck.rotation.y = -Math.PI;
  if (corsia == 0) truck.position.set(config.game.x_lane_0, 0, -vehicles.position.z - config.game.z_lane + offset);
  else if (corsia == 1) truck.position.set(config.game.x_lane_1,  0,-vehicles.position.z - config.game.z_lane+ offset);
  else if (corsia == 2) truck.position.set(config.game.x_lane_2, 0,   -vehicles.position.z - config.game.z_lane+ offset);
  else if (corsia == 3) truck.position.set(config.game.x_lane_3, 0,  -vehicles.position.z - config.game.z_lane+ offset);
  truck.scale.set(0.04,0.04,0.04);
  

  vehicles.add(truck);
}

function spawn500(corsia,offset){
  var fiat_500 = new THREE.Object3D();
  fiat_500.name = "Fiat_500";
  fiat_500.corsia = corsia;
  let body = models.fiat_500.gltf.clone();
  let hitbox_fiat_500 = createHitBox("fiat_500");
  
  fiat_500.add(body);
  fiat_500.add(hitbox_fiat_500);

  fiat_500.rotation.y = -Math.PI;
  if (corsia == 0) fiat_500.position.set(config.game.x_lane_0, 1.2,   -vehicles.position.z - config.game.z_lane+ offset);
  else if (corsia == 1) fiat_500.position.set(config.game.x_lane_1,  1.2,-vehicles.position.z - config.game.z_lane+ offset);
  else if (corsia == 2) fiat_500.position.set(config.game.x_lane_2, 1.2,   -vehicles.position.z - config.game.z_lane+ offset);
  else if (corsia == 3) fiat_500.position.set(config.game.x_lane_3, 1.2,  -vehicles.position.z - config.game.z_lane+ offset);
  fiat_500.scale.set(2.7,2.7,2.7);
  
  vehicles.add(fiat_500);
}

function spawnSmart(corsia,offset){
  var smart = new THREE.Object3D();
  smart.name = "smart";
  smart.corsia = corsia
  let body = models.smart.gltf.clone();
  let hitbox_smart = createHitBox("smart");
  
  smart.add(body);
  smart.add(hitbox_smart);

  smart.rotation.y = -Math.PI;
  if (corsia == 0) smart.position.set(config.game.x_lane_0, 0,   -vehicles.position.z - config.game.z_lane+ offset);
  else if (corsia == 1) smart.position.set(config.game.x_lane_1,  0,-vehicles.position.z - config.game.z_lane+ offset);
  else if (corsia == 2) smart.position.set(config.game.x_lane_2, 0,   -vehicles.position.z - config.game.z_lane+ offset);
  else if (corsia == 3) smart.position.set(config.game.x_lane_3, 0,  -vehicles.position.z - config.game.z_lane+ offset);
  smart.scale.set(0.016,0.016,0.016);
  
  vehicles.add(smart);

}

function spawnpolice(corsia,offset){
  var police = new THREE.Object3D();
  police.name = "police";
  police.corsia = corsia;
  let body = models.police.gltf.clone();
  let hitbox_police = createHitBox("police");
  
  police.add(body);
  police.add(hitbox_police);

  police.rotation.y = -Math.PI;
  if (corsia == 0) police.position.set(config.game.x_lane_0-0.5, 0,   -vehicles.position.z - config.game.z_lane+ offset);
  else if (corsia == 1) police.position.set(config.game.x_lane_1-0.5,  0,-vehicles.position.z - config.game.z_lane+ offset);
  else if (corsia == 2) police.position.set(config.game.x_lane_2-0.5, 0,   -vehicles.position.z - config.game.z_lane+ offset);
  else if (corsia == 3) police.position.set(config.game.x_lane_3-0.5, 0,  -vehicles.position.z - config.game.z_lane+ offset);
  police.scale.set(1.3,1.3, 1.3);
  
  vehicles.add(police);

}

function spawnFuelTanks(corsia){
  var fuel_tank = new THREE.Object3D();
  fuel_tank.name = "fuel_tank";
  fuel_tank.corsia = corsia;
  let body = models.fuel_tank.gltf.clone();
  let hitbox_fuel = createHitBox("fuel_tank");
  
  fuel_tank.add(body);
  fuel_tank.add(hitbox_fuel);

  fuel_tank.rotation.y = -Math.PI;
  if (corsia == 0) fuel_tank.position.set(config.game.x_lane_0-0.5, 1.8,   -vehicles.position.z - config.game.z_lane);
  else if (corsia == 1) fuel_tank.position.set(config.game.x_lane_1-0.5, 1.8,-vehicles.position.z - config.game.z_lane);
  else if (corsia == 2) fuel_tank.position.set(config.game.x_lane_2-0.5, 1.8,   -vehicles.position.z - config.game.z_lane);
  else if (corsia == 3) fuel_tank.position.set(config.game.x_lane_3-0.5, 1.8,  -vehicles.position.z - config.game.z_lane);
  fuel_tank.scale.set(1,1, 1);
  
  vehicles.add(fuel_tank);
}

function initvehicles(){
  vehicles = new THREE.Group();
  scene.add(vehicles);
}

function initPlants(){
  plants = new THREE.Group();
  scene.add(plants);
}


var modelsLoaded = false;
var soundsLoaded = false;
loadModels();
loadSounds();


function loadModels(){
  const modelsLoadMngr = new THREE.LoadingManager();
  modelsLoadMngr.onLoad = () => {
    modelsLoaded = true;

    document.querySelector('#models_loading').hidden = true;

    if (modelsLoaded && soundsLoaded){
      init();
    }
  };
  modelsLoadMngr.onProgress = (url, itemsLoaded, itemsTotal) => {
    console.log("Loading the models... ", itemsLoaded/itemsTotal*100, "%");
    document.getElementById("get_models_progress").innerHTML = `${itemsLoaded / itemsTotal * 100 | 0}%`;
  };
  {
		const gltfLoader = new GLTFLoader(modelsLoadMngr);
		for (const model of Object.values(models)) {
      console.log("Loading Model: ", model);
			gltfLoader.load(model.url, (gltf) => {

				gltf.scene.traverse( function ( child ) {

					if ( child.isMesh ) {
						if( child.castShadow !== undefined ) {
							child.castShadow = true;
							child.receiveShadow = true;
						}
					}
			
				} );

				model.gltf = gltf.scene;
			});
		}
	} 
}


//Difficulty
function readDiff(){
  var diff = document.getElementById("difficulty").innerHTML;
  if (diff =="Easy") config.game.difficulty = 1;
  else if (diff == "Medium") config.game.difficulty = 2;
  else config.game.difficulty = 3;
}

function init(){
  //Set up of the camera
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 200 );
  camera.position.set(0, 10, 100);
  camera.position.z = 30;
  camera.lookAt(0, 0, 0);

  //Set up of the scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color( config.colors.sky );

	// FOG
	if(config.utils.showFog) scene.fog = new THREE.Fog( config.colors.sky, 5, 200 );


  //Set up of the renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  document.body.appendChild( renderer.domElement );

  //declaring control variable
  //const controls = new OrbitControls(camera, renderer.domElement);

  clock = new THREE.Clock(false);
  

  listener = new THREE.AudioListener();
  camera.add(listener);

  sound = new THREE.Audio(listener);
  carSound = new THREE.Audio(listener);
  pickupSound = new THREE.Audio(listener);

  audioLoader = new THREE.AudioLoader();

  
  //Setting the Lights
  const color = 0xFFFFFF;
  const intensity = 5;
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(30, 20, 100);
  light.target.position.set(0, 0, 0);
  scene.add(light);
  

  document.getElementById("main_menu").hidden = false;
  document.getElementById("authors").hidden = false;
  document.getElementById("settings").hidden = false;
  setSpawnRefuel();
  initFerrari();
  initvehicles();
  initPlants();
  initRoad();
  initGrassRight();
  initGrassLeft();
  initListenerKeyboard();
  InitFerrariPosition();
    
  const animate = function() {
    requestAnimationFrame( animate );
    frames += 1;
    TWEEN.update();
    updateTime();
    renderer.render( scene, camera );
  }
  animate();

}

function start(){

  readDiff();
  document.getElementById("main_menu").hidden = true;
  document.getElementById("authors").hidden = true;
  document.getElementById("health_and_score").hidden = false;
  document.getElementById("tank1").hidden = true;
  document.getElementById("tank2").hidden = true;
  document.getElementById("tank3").hidden = false;
  document.getElementById("game_over").hidden = true;
  document.getElementById("time_img").hidden = false;
  document.getElementById("time_counter").hidden = false;
  document.getElementById("settings").hidden = true;

  

  if (config.utils.soundsOn || config.utils.soundAfterPlay) {
    config.utils.soundsOn = true;
    playSoundTrack();
  }

  clock.start();
  pushFerrariOnInitPosition();
  moveVehicles();
  movePlants();
  animateFuel();
  moveFerrari();
}
function resumePlaying(){
  resumeSounds();
  moveVehicles();
  movePlants();
  animateFuel();
  moveFerrari();
}



function gameOver(){
  config.utils.isPlaying = false;
  config.utils.isStarted = false;
  counter_time = 0;
  if (config.utils.soundsOn) {
    config.utils.soundAfterPlay = true;
    playGameOverSound();
    pauseSounds();
  }
  removeAllVehicles();
  removeAllPlants();
  ferrari.mesh.position.set(0,config.game.yspawn,0);
  document.getElementById("tank1").hidden = true;
  document.getElementById("game_over").hidden = false;
  document.getElementById("time_img").hidden = true;
  document.getElementById("time_counter").hidden = true;
  document.getElementById("score_number").innerHTML = score_number;
}

// SETTING THE LISTENER FOR THE ANIMATIONS
var keyPressed = false;
function initListenerKeyboard(){
  document.onkeydown = function(e){
    keyPressed = true;
    switch(e.code){
      case 'KeyA':
      case 'ArrowLeft':
        moveLeft();
        performRotationTo(ferrari.rotations.left);
        break;
      case 'KeyD':
      case 'ArrowRight':
        moveRight();
        performRotationTo(ferrari.rotations.right);
        break;
      case 'KeyW':
      case 'ArrowUp':
        moveAhead();
        break;
      case 'KeyS':
      case 'ArrowDown':
        moveBack();
        break;

      case 'Enter':
        if (!config.utils.isStarted) {
          config.utils.isStarted = true;
          config.utils.isPlaying = true;
          start();
          break;
        }
        break;
      case 'Escape':
      case 'Space':
        if (config.utils.isStarted && config.utils.isPlaying){
          clock.stop();
          elapsedTime =  clock.getElapsedTime();
          counter_time += elapsedTime;
          config.utils.isPlaying = false;
          pauseSounds();
          break;
        }
        else if (config.utils.isStarted && !config.utils.isPlaying){
          config.utils.isPlaying = true;
          clock.start();
          resumeSounds();
          resumePlaying();
          break;
        }
        break;
      case 'KeyM':
        if (config.utils.isStarted){
          if (config.utils.soundsOn) {
            config.utils.soundAfterPlay = false;
            pauseSounds();
          }
          else resumeSounds();
        }
        break;
      case 'KeyC':
        if(!config.utils.isStarted){
          if (!config.utils.displayMenu) displayMenu();
          else hideMenu();
        }
        break;
    }
  }
  document.onkeyup = function(e){
    keyPressed = false;
  }
}

function displayMenu(){
  config.utils.displayMenu = true;
  document.getElementById("display_start").hidden = true;
  document.getElementById("commands").hidden = false;
}
function hideMenu(){
  config.utils.displayMenu = false;
  document.getElementById("display_start").hidden = false;
  document.getElementById("commands").hidden = true;
}

function moveLeft(){
  if (ferrari.mesh.position.x < config.game.x_lane_0) return;
  performMovementTo(ferrari.positions.left);
}
function moveRight(){
  if (ferrari.mesh.position.x > config.game.x_lane_3) return;
  performMovementTo(ferrari.positions.right);
}

function moveAhead(){
  if (ferrari.mesh.position.z < -config.game.z_max) return; 
  performMovementTo(ferrari.positions.ahead);
}

function moveBack(){
  if (ferrari.mesh.position.z > config.game.z_min) return;
  performMovementTo(ferrari.positions.back);
}

function align(){
  if (config.utils.isPlaying){
    if ( ferrari.mesh.rotation.y != Math.PI){
      var rotation = { y: ferrari.mesh.rotation.y }; 
      var tween = new TWEEN.Tween(rotation)
        .to({ y: Math.PI }, config.game.velocity)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate( 
              () => {
                ferrari.mesh.rotation.y = rotation.y;
              }
        );
    
      tween.start();
      } 
  }
}

function performRotationTo( rad){
  if (config.utils.isPlaying){
    var rotation = { y: ferrari.mesh.rotation.y }; 
    var tween = new TWEEN.Tween(rotation)
      .to({ y: rad }, config.game.velocity)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate( 
            () => {
              ferrari.mesh.rotation.y = rotation.y;
            }
      );

    tween.start();
  }
}

function performMovementTo( pos){
  if (config.utils.isPlaying){
    var delta = { x: 0 };
    switch (pos) {
      case -1:
        objectsTween = new TWEEN.Tween(delta)
        .to({ x: -0.1 },config.game.velocity) 
        .easing(TWEEN.Easing.Linear.None)
        .onUpdate( 
              () => {
                ferrari.elements.wheel.forward.rotation.set(0, ferrari.elements.wheel.forward.rotation.y ,ferrari.elements.wheel.forward.rotation.z);
                ferrari.mesh.position.x = ferrari.mesh.position.x + delta.x;
              }
        ).onComplete(() =>{
          if (!keyPressed) align();
        }).start();
        break;
      case 1:
        objectsTween = new TWEEN.Tween(delta)
        .to({ x: 0.1 },config.game.velocity) 
        .easing(TWEEN.Easing.Linear.None)
        .onUpdate( 
              () => {
                ferrari.mesh.position.x = ferrari.mesh.position.x + delta.x;
              }
        ).onComplete(() =>{
          if (!keyPressed) align();
        }).start();
        break;
      case 0:
        objectsTween = new TWEEN.Tween(delta)
        .to({ x: 0.1 },config.game.velocity) 
        .easing(TWEEN.Easing.Linear.None)
        .onUpdate( 
              () => {
                ferrari.mesh.position.z = ferrari.mesh.position.z - delta.x;
              }
        ).onComplete(() =>{
          if (!keyPressed) align();
        }).start();
        break;
      case 2:
        objectsTween = new TWEEN.Tween(delta)
        .to({ x: 0.1 },config.game.velocity) 
        .easing(TWEEN.Easing.Linear.None)
        .onUpdate( 
              () => {
                ferrari.mesh.position.z = ferrari.mesh.position.z + delta.x;
              }
        ).onComplete(() =>{
          if (!keyPressed) align();
        }).start();
        break;
    }
  }
}

var frame_ref = 0;
var frame_ref_cactus = 0;
function moveFerrari(){
	if (config.utils.isPlaying){
    var delta = { z: 0 };
    objectsTween = new TWEEN.Tween(delta)
    .to({ z: 0.3 },config.game.velocity) 
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate( 
          () => {
            ferrari.elements.wheel.forward.rotation.z = ferrari.elements.wheel.forward.rotation.z + degtorad(100*delta.z);
            ferrari.elements.wheel.backward.rotation.z = ferrari.elements.wheel.backward.rotation.z + degtorad(100*delta.z);
            road.mesh.position.z = road.mesh.position.z + delta.z;
            grassRight.mesh.position.z = grassRight.mesh.position.z + delta.z;
            grassLeft.mesh.position.z = grassLeft.mesh.position.z + delta.z;
            
          }
    ).onComplete(
          () => {
            if (frames -frame_ref > 150){
              frame_ref = frames;
              spawnVehicles();
            if (frames - frame_ref_cactus > 100){
              spawnPlants();
            }
            }
            moveFerrari();
          }
    ).start();
  }
}
 
function removeAllVehicles(){
  let carsToRemove = [];

  vehicles.traverse( function (child) {
    if ( child.isMesh){
      let object=child.parent;
      carsToRemove.push(object);
    }
  });
  carsToRemove.forEach((object)=>{
    vehicles.remove(object);   
  });
}

function removeAllPlants(){
  let plantsToRemove = [];

  vehicles.traverse( function (child) {
    if ( child.isMesh){
      let object=child.parent;
      plantsToRemove.push(object);
    }
  });
  plantsToRemove.forEach((object)=>{
    plants.remove(object);   
  });
}



function removeSorpassedVehicles(){
  let carsToRemove = [];

  vehicles.traverse( function (child) {
    if ( child.isMesh){
      let object=child.parent;
      let objectPos = vehicles.position.z + object.position.z;
      if (object.name == 'Truck' || object.name == 'smart' || object.name == 'police' || object.name == 'Fiat_500'){
        if (objectPos > config.game.z_remove) {
          carsToRemove.push(object);
        }
      }
    }
  });
  carsToRemove.forEach((object)=>{
    vehicles.remove(object);   
  });
}

function removeSorpassedPlants(){
  let plantsToRemove = [];

  plants.traverse( function (child) {
    if ( child.isMesh){
      let object=child.parent;
      let objectPos = plants.position.z + object.position.z;
      if (object.name == 'Cactus'){
        if (objectPos > config.game.z_remove) {
          plantsToRemove.push(object);
        }
      }
    }
  });
  plantsToRemove.forEach((object)=>{
    plants.remove(object);   
  });
}

function detectCollisionWrapper(){

  hitbox_toCheck = [];

  vehicles.traverse( function (child) {
    if (child.isMesh){
      let hitBox = child.getObjectByName("hitbox");
      if (hitBox) hitbox_toCheck.push(hitBox);
    }
  });

  hitbox_toCheck.forEach( (child) => {
    detectCollision(child);
  });
}

var hit_ref = 0;

function ferrariIsIn(){
  if (ferrari.mesh.position.x >= 5.25 ) return 3;
  if (ferrari.mesh.position.x >= config.game.x_lane_2 ) return 2;
  if (ferrari.mesh.position.x >=-4.13 ) return 1;
  if (ferrari.mesh.position.x >= config.game.x_lane_0 ) return 0;
}

function detectCollision(hitbox){

  var originPoint = ferrari_hitbox.position.clone();
  const positionAttribute = ferrari_hitbox.geometry.getAttribute( 'position' );

  const localVertex = new THREE.Vector3();
  const globalVertex = new THREE.Vector3();

  for ( let vertexIndex = 0; vertexIndex < positionAttribute.count; vertexIndex ++ ) {

    localVertex.fromBufferAttribute( positionAttribute, vertexIndex );
    globalVertex.copy( localVertex ).applyMatrix4( ferrari_hitbox.matrixWorld );
    var directionVector = globalVertex.sub( ferrari_hitbox.position );
    var ray = new THREE.Raycaster( originPoint, directionVector.clone().normalize() );
    var hitResult = ray.intersectObject(hitbox);
      if (hitResult.length > 0 && hitResult[0].distance < directionVector.length()){
        //console.log("HIT");
        hitManager(hitbox, hitResult[0].distance);
      }
  }
}

//Nyawa setelah collision
function hitManager(hitBox, hitDistance){
  let collision_object = hitBox.parent;
  var ferrari_pos = ferrariIsIn();
  if (frames - hit_ref > 10){
    hit_ref = frames;
    if (collision_object.name == 'fuel_tank'){
      playSoundPickUp();
      if (config.game.health == 1 && ((ferrari_pos ==1 || ferrari_pos == 2) || ferrari_pos == collision_object.corsia)){
        vehicles.remove(collision_object);
        config.game.health =2;
        document.getElementById("tank1").hidden = true;
        document.getElementById("tank2").hidden = false;
        document.getElementById("tank3").hidden = true;
      }
      else if (config.game.health == 2 && ((ferrari_pos ==1 || ferrari_pos == 2) || ferrari_pos == collision_object.corsia)){
        vehicles.remove(collision_object);
        config.game.health = 3;
        document.getElementById("tank1").hidden = true;
        document.getElementById("tank2").hidden = true;
        document.getElementById("tank3").hidden = false;
      }
      else if (config.game.health == 3 && ((ferrari_pos ==1 || ferrari_pos == 2) || ferrari_pos == collision_object.corsia)){
        vehicles.remove(collision_object);
      }
    }
    else{
      
      if (config.game.health == 3 && ((ferrari_pos ==1 || ferrari_pos == 2) || ferrari_pos == collision_object.corsia)){
        vehicles.remove(collision_object);
        playCrashSound();
        config.game.health =2;
        document.getElementById("tank1").hidden = true;
        document.getElementById("tank2").hidden = false;
        document.getElementById("tank3").hidden = true;
      }
      else if (config.game.health == 2 &&  ((ferrari_pos ==1 || ferrari_pos == 2) || ferrari_pos == collision_object.corsia)){

        vehicles.remove(collision_object);
        playCrashSound();
        config.game.health = 1;
        document.getElementById("tank1").hidden = false;
        document.getElementById("tank2").hidden = true;
        document.getElementById("tank3").hidden = true;
      }
      else if (config.game.health == 1 &&  ((ferrari_pos ==1 || ferrari_pos == 2) || ferrari_pos == collision_object.corsia)){

        //GAMEOVER
        vehicles.remove(collision_object);
        playCrashSound();
        config.game.health = 3;
        gameOver();
      }
    }
  }

}

function moveVehicles(){
  
	if (config.utils.isPlaying){
    var delta = { z: 0 };
    objectsTween = new TWEEN.Tween(delta)
    .to({ z: 0.5 },config.game.velocity) 
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate( 
          () => {
            vehicles.position.z = vehicles.position.z + delta.z;
            removeSorpassedVehicles();
            detectCollisionWrapper(); 
            
          }
    ).onComplete(
          () => {
            moveVehicles();
          }
    ).start();
  }
}

function movePlants(){
  
	if (config.utils.isPlaying){
    var delta = { z: 0 };
    objectsTween = new TWEEN.Tween(delta)
    .to({ z: 0.1 },config.game.velocity) 
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate( 
          () => {
            plants.position.z = plants.position.z + delta.z;
            removeSorpassedPlants();            
          }
    ).onComplete(
          () => {
            movePlants();
          }
    ).start();
  }
}

var score_number = 0;

function updateTime(){
  let time;
  if (config.utils.isPlaying)  time = (clock.getElapsedTime()+counter_time).toFixed(0) * 100;
  else  time = (counter_time).toFixed(0) * 100; 
  document.getElementById("time_counter").innerHTML = time;
  score_number = document.getElementById("time_counter").innerHTML;
}

var goDown = true;
function moveUpDown(obj){
  if (goDown){
    if (obj.position.y > 0.7) obj.position.y -= 0.02;
    else goDown = false;

  }
  if (!goDown){
    if (obj.position.y < 2) obj.position.y += 0.02;
    else goDown = true;
  }
}


function animateFuel(){
  var rotation = { y: 0 };
	fuelTween = new TWEEN.Tween(rotation)
	.to({ y: degtorad(360) }, 2500) 
	.easing(TWEEN.Easing.Linear.None)
	.onUpdate( () => { 
		
		let fuel_tanks = [];
    vehicles.traverse( function (child){
      if (child.name == 'fuel_tank') {
        fuel_tanks.push(child);
      }
    });
    fuel_tanks.forEach((child) =>{
      child.rotation.y = rotation.y;
      moveUpDown(child);
    });

	}	)
	.onComplete( () => { 
		animateFuel(); 
	} )
	.start();
}

function createHitBox(codice_veicolo){
  let hitbox = new THREE.Mesh(hitBox, hitBox_material);
  switch(codice_veicolo){
    case 'truck':
      hitbox.scale.set(83, 70, 205);
      hitbox.position.set(0,35, -6);
      hitbox.name = "hitbox"
      hitbox.visible = config.utils.hitbox_visible;
      return hitbox;
    case 'fiat_500':
      hitbox.scale.set(0.8, 0.7 ,1.85);
      hitbox.position.set(0,0,0);
      hitbox.name = "hitbox"
      hitbox.visible = config.utils.hitbox_visible;
      return hitbox;
    case 'smart':
      hitbox.scale.set(135, 100 ,250);
      hitbox.position.set(0,50, 0);
      hitbox.name = "hitbox"
      hitbox.visible = config.utils.hitbox_visible;
      return hitbox;
    case 'police':
      hitbox.scale.set(2.2, 1 ,6.3);
      hitbox.position.set(-0.45,0,0);
      hitbox.name = "hitbox"
      hitbox.visible = config.utils.hitbox_visible;
      return hitbox;
    case 'fuel_tank':
      hitbox.scale.set(1.5, 4 ,0.9);
      hitbox.position.set(0,0,0);
      hitbox.name = "hitbox"
      hitbox.visible = config.utils.hitbox_visible;
      return hitbox;
  }

  


}

var spawnRefuel = 0;
var counter = 0;
//
function setSpawnRefuel(){
  if (config.game.difficulty == 1) spawnRefuel = 1;
  if (config.game.difficulty == 2) spawnRefuel = 3;
  if (config.game.difficulty == 3) spawnRefuel = 5;
}

var minLeft = -36;
var maxLeft = -20;
var minRight= 10;
var maxRight= 22;

function spawnCactus(pos){
  var cactus = new THREE.Object3D();
  cactus.name = "cactus";
  cactus.pos = pos;
  let body = models.cactus.gltf.clone();
  
  cactus.add(body);

  cactus.rotation.y = -Math.PI/2;
  cactus.position.set(pos, 0,  -vehicles.position.z - config.game.z_lane);
  cactus.scale.set(0.7,0.7,0.7);
  

  vehicles.add(cactus);

}

function spawnPlants(){
  var positionLeft = getRandomInt(minLeft, maxLeft);
  var positionRight = getRandomInt(minRight, maxRight);
  spawnCactus(positionLeft);
  spawnCactus(positionRight);


}


function spawnVehicles(){
  var max = 3;
  var min = 0;
  var offsets = [10,15,20,25,30];
  let spawnAtPosition = [];
  for (let i = 0; i < 4; i ++) spawnAtPosition.push(false);
  for(var i = 0; i < 4; i++){
    var p = Math.random();
    if (config.game.difficulty == 1 && p > 0.8){
      spawnAtPosition[i] = true;
    }
    else if (config.game.difficulty == 2 && p > 0.6){
      spawnAtPosition[i] = true;
    }
    else if (config.game.difficulty == 3 && p > 0.2){
      spawnAtPosition[i] = true;
    }
  }
  if (!spawnAtPosition.includes(false)){
    var p = getRandomInt(0,3);
    spawnAtPosition[p] = false;
  }
  for(let i = 0; i < spawnAtPosition.length; i ++){
    if (spawnAtPosition[i]) {
      var cod = getRandomInt(1, num_vehicles);
      var offset = getRandomInt(0, offsets.length-1);
      offset = offsets[offset];
      switch(cod){
        case 1:
          spawnTruck(i,offset);
          break;
        case 2:
          spawn500(i,offset);
          break;
        case 3:
          spawnSmart(i,offset);
          break;
        case 4:
          spawnpolice(i,offset);
          break;
        case 5:
          if (counter < spawnRefuel) counter += 1;
          else{
            counter = 0;
            spawnFuelTanks(i); 
          }
      }
    }
  }
}

//Sounds functions

function loadSounds() {

	const soundsLoaderMngr = new THREE.LoadingManager();
	soundsLoaderMngr.onLoad = () => {

		soundsLoaded = true;

    document.querySelector('#sounds_loading').hidden = true;

	
		if(modelsLoaded & soundsLoaded) {
			init();
		}
	};

	soundsLoaderMngr.onProgress = (url, itemsLoaded, itemsTotal) => {
		console.log("Loading sounds... ", itemsLoaded / itemsTotal * 100, '%');
    document.getElementById("get_sounds_progress").innerHTML = `${itemsLoaded / itemsTotal * 100 | 0}%`;
	};
	{
		const audioLoader = new THREE.AudioLoader(soundsLoaderMngr);
		for (const sound of Object.values(sounds)) {
			audioLoader.load( sound.url, function( buffer ) {
				
				sound.sound = buffer;

				console.log("Loaded ", buffer);
			});
		}
	} 
}



function playSoundTrack(){
  sound.isPlaying = false;
  sound.setBuffer(sounds.soundtrack.sound);
  sound.setLoop(true);
  sound.setVolume(0.3);
  sound.play();
  carSound.isPlaying = false;
  carSound.setBuffer(sounds.carSound.sound);
  carSound.setLoop(true);
  carSound.setVolume(0.2)
  carSound.play();
}

function playSoundPickUp(){
  if (config.utils.soundsOn){
    pickupSound.isPlaying = false;
    pickupSound.setBuffer(sounds.pickupSound.sound);
    pickupSound.setLoop(false);
    pickupSound.setVolume(0.2)
    pickupSound.play();
  }
}

function playCrashSound(){
  if (config.utils.soundsOn){
    pickupSound.isPlaying = false;
    pickupSound.setBuffer(sounds.crashSound.sound);
    pickupSound.setLoop(false);
    pickupSound.setVolume(0.5)
    pickupSound.play();
  }
}

function playGameOverSound(){
  if (config.utils.soundsOn){
    pickupSound.isPlaying = false;
    pickupSound.setBuffer(sounds.gameoverSound.sound);
    pickupSound.setLoop(false);
    pickupSound.setVolume(0.5)
    pickupSound.play();
  }
}

function pauseSounds(){
  config.utils.soundsOn = false;
  sound.pause();
  carSound.pause();
}

function resumeSounds(){
  config.utils.soundsOn = true;
  sound.play();
  carSound.play();
}