// Import Three.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.module.js';

// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add a simple floor
const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x555555, side: THREE.DoubleSide });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = Math.PI / 2;
scene.add(floor);

// Player controls
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let velocity = new THREE.Vector3();
let health = 100;

// Pointer lock for mouse look
const pointerLockElement = document.body;

pointerLockElement.addEventListener('click', () => {
  pointerLockElement.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement === pointerLockElement) {
    document.addEventListener('mousemove', onMouseMove, false);
  } else {
    document.removeEventListener('mousemove', onMouseMove, false);
  }
}, false);

let yaw = 0, pitch = 0;
function onMouseMove(event) {
  yaw -= event.movementX * 0.002;
  pitch -= event.movementY * 0.002;
  pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

  camera.rotation.x = pitch;
  camera.rotation.y = yaw;
}

// Keyboard controls
function onKeyDown(event) {
  switch (event.code) {
    case 'KeyW': moveForward = true; break;
    case 'KeyS': moveBackward = true; break;
    case 'KeyA': moveLeft = true; break;
    case 'KeyD': moveRight = true; break;
    case 'Space': shoot(); break; // Space to shoot
  }
}

function onKeyUp(event) {
  switch (event.code) {
    case 'KeyW': moveForward = false; break;
    case 'KeyS': moveBackward = false; break;
    case 'KeyA': moveLeft = false; break;
    case 'KeyD': moveRight = false; break;
  }
}

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// Shooting mechanics
function shoot() {
  const bullet = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );
  bullet.position.copy(camera.position);
  bullet.velocity = new THREE.Vector3(
    -Math.sin(camera.rotation.y),
    0,
    -Math.cos(camera.rotation.y)
  ).multiplyScalar(0.5);

  scene.add(bullet);
  bullets.push(bullet);
}

let bullets = [];

// Enemies
function createEnemy(x, z) {
  const enemy = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2, 1),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  enemy.position.set(x, 1, z);
  enemy.health = 50;
  enemy.speed = 0.02; // Enemy movement speed
  enemy.attackCooldown = 0; // Cooldown timer for attacks
  scene.add(enemy);
  enemies.push(enemy);
}

let enemies = [];
createEnemy(5, -5);
createEnemy(-5, -10);

// Damage handling
function checkCollisions() {
  bullets.forEach((bullet, bulletIndex) => {
    enemies.forEach((enemy, enemyIndex) => {
      if (bullet.position.distanceTo(enemy.position) < 1) {
        enemy.health -= 25;
        scene.remove(bullet);
        bullets.splice(bulletIndex, 1);

        if (enemy.health <= 0) {
          scene.remove(enemy);
          enemies.splice(enemyIndex, 1);
        }
      }
    });
  });
}

// Enemy behavior
function updateEnemies(deltaTime) {
  enemies.forEach((enemy) => {
    const direction = new THREE.Vector3().subVectors(camera.position, enemy.position).normalize();
    enemy.position.add(direction.multiplyScalar(enemy.speed));

    if (enemy.attackCooldown > 0) {
      enemy.attackCooldown -= deltaTime;
    }
  });
}

// Enemy attacks with cooldown
function enemyAttack() {
  enemies.forEach((enemy) => {
    if (camera.position.distanceTo(enemy.position) < 2 && enemy.attackCooldown <= 0) {
      health -= 1;
      enemy.attackCooldown = 1000; // 1-second cooldown

      if (health <= 0) {
        alert('Game Over');
        window.location.reload();
      }
    }
  });
}

// Display health
const healthDisplay = document.createElement('div');
healthDisplay.style.position = 'absolute';
healthDisplay.style.top = '10px';
healthDisplay.style.left = '10px';
healthDisplay.style.color = 'white';
healthDisplay.style.fontSize = '20px';
healthDisplay.style.fontWeight = 'bold'; // Added bold font
healthDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Added background color
healthDisplay.style.padding = '5px 10px'; // Added padding
healthDisplay.style.borderRadius = '5px'; // Added border radius
document.body.appendChild(healthDisplay);

function updateHealthDisplay() {
  healthDisplay.textContent = `Health: ${health}`;
}

// Main game loop
let lastTime = performance.now();
function animate() {
  requestAnimationFrame(animate);

  const currentTime = performance.now();
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;

  const speed = 0.1;
  if (moveForward) velocity.z = -speed;
  if (moveBackward) velocity.z = speed;
  if (moveLeft) velocity.x = -speed;
  if (moveRight) velocity.x = speed;

  camera.translateX(velocity.x);
  camera.translateZ(velocity.z);

  bullets.forEach((bullet) => {
    bullet.position.add(bullet.velocity);
  });

  checkCollisions();
  updateEnemies(deltaTime); // Pass deltaTime to updateEnemies
  enemyAttack();
  updateHealthDisplay();

  velocity.set(0, 0, 0);

  renderer.render(scene, camera);
}

camera.position.y = 1.6; // Camera height like a real person
animate();
