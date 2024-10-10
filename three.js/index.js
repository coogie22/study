import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// 씬, 카메라, 렌더러 설정
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 조명 추가
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7).normalize();
scene.add(light);

// 본체 생성
const bodyGeometry = new THREE.SphereGeometry(1.5, 32, 32);
const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
scene.add(body);

// 귀 생성
const earGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 32);
const earMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

const leftEar = new THREE.Mesh(earGeometry, earMaterial);
leftEar.position.set(-0.8, 2.5, 0);
leftEar.rotation.x = Math.PI / 2;
scene.add(leftEar);

const rightEar = new THREE.Mesh(earGeometry, earMaterial);
rightEar.position.set(0.8, 2.5, 0);
rightEar.rotation.x = Math.PI / 2;
scene.add(rightEar);

// 눈 생성
const eyeGeometry = new THREE.SphereGeometry(0.2, 32, 32);
const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
leftEye.position.set(-0.6, 0.7, 1.4);
scene.add(leftEye);

const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
rightEye.position.set(0.6, 0.7, 1.4);
scene.add(rightEye);

// 볼 생성
const cheekGeometry = new THREE.SphereGeometry(0.3, 32, 32);
const cheekMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });

const leftCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
leftCheek.position.set(-1, 0.4, 1.3);
scene.add(leftCheek);

const rightCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
rightCheek.position.set(1, 0.4, 1.3);
scene.add(rightCheek);

// 꼬리 생성
const tailGeometry = new THREE.BoxGeometry(0.5, 2, 0.1);
const tailMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
const tail = new THREE.Mesh(tailGeometry, tailMaterial);
tail.position.set(0, -1.5, -1.3);
tail.rotation.z = Math.PI / 4;
scene.add(tail);

// 카메라 위치 설정
camera.position.set(0, 2, 5); // 카메라 위치 조정

// OrbitControls 설정
const controls = new OrbitControls(camera, renderer.domElement);

// 윈도우 리사이즈 이벤트 처리
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 애니메이션 루프 설정
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // OrbitControls 업데이트
    renderer.render(scene, camera);
}

animate();
