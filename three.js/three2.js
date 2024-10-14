// 다중 캔버스, 다중 씬
// 다중 씬을 위해선 여러 캔버스를 만들어, 각 캔버스마다 Renderer 를 생성하면 될 것처럼 보일 수 있다.

// 하지만 이 방법은 문제가 생긴다.

// 브라우저의 WebGL 컨텍스트(context)는 제한적
// 일반적으로 약 8개가 최대다. 9번째 컨텍스트를 생성하면 처음만든 컨텍스트가 사라진다.
// WebGL 자원은 컨텍스트끼리 공유 불가능
// 10MB짜리 모델을 캔버스 두 개에서 사용하려면 각각 총 두 번 로드해야 하므로 20MB 자원을 사용한다는 의미다.
// 컨텍스트끼리는 공유가 안되므로 초기화, 쉐이더 컴파일, 등 같은 동작을 두 번 실행해야한다. 캔버스 개수가 많을수록 문제가 생긴다.
// 방법 중 하나는 캔버스 하나로 화면 전체를 채우고, 각 "가상" 캔버스를 대신할 HTML 요소를 두는 것이다. Renderer 는 하나만 만들되 가상 캔버스에 각각 Scene 을 만드는 것이다. 그리고 가상 HTML 요소의 좌표를 계산해 요소가 화면에 보이게 되면 해당 Scene 을 가상 요소의 좌표에 맞춰 렌더링하도록 한다.

// 두 번째 방법은 1, 2번 모두 해결할 수 있다.
// 컨텍스트 하나만 사용하므로 WebGL 컨텍스트 제한을 걱정할 일이 없다.

// 2개의 장면만 만들어 간단히 테스트 해보자.

// <canvas id="c"></canvas>
// <p>
//   <span id="box" class="diagram left"></span>
//   I love boxes. Presents come in boxes.
//   When I find a new box I'm always excited to find out what's inside.
// </p>
// <p>
//   <span id="pyramid" class="diagram right"></span>
//   When I was a kid I dreamed of going on an expedition inside a pyramid
//   and finding a undiscovered tomb full of mummies and treasure.
// </p>
// css 를 작성한다.

// #c {
//   position: fixed;
//   left: 0;
//   top: 0;
//   width: 100%;
//   height: 100%;
//   display: block;
//   z-index: -1;
// }
// .diagram {
//   display: inline-block;
//   width: 5em;
//   height: 3em;
//   border: 1px solid black;
// }
// .left {
//   float: left;
//   margin-right: .25em;
// }
// .right {
//   float: right;
//   margin-left: .25em;
// }
// 캔버스 화면 전체를 채우도록하고 z-index 를 -1로 설정해 요소를 뒤로 가도록 했다.
// 가상 요소에 컨텐츠가 없어 크기가 0이니 별도의 width 와 height 도 지정해준다.

// 이제 각각의 카메라와 조명이 있는 장면 2개를 만든다. 하나에는 정육면체, 다른 하나에는 다이아몬드 모양을 넣는다.

// function makeScene(elem) {
//   const scene = new THREE.Scene();
 
//   const fov = 45;
//   const aspect = 2;  // 캔버스 기본값
//   const near = 0.1;
//   const far = 5;
//   const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
//   camera.position.z = 2;
//   camera.position.set(0, 1, 2);
//   camera.lookAt(0, 0, 0);
 
//   {
//     const color = 0xFFFFFF;
//     const intensity = 1;
//     const light = new THREE.DirectionalLight(color, intensity);
//     light.position.set(-1, 2, 4);
//     scene.add(light);
//   }
 
//   return { scene, camera, elem };
// }
 
// function setupScene1() {
//   const sceneInfo = makeScene(document.querySelector('#box'));
//   const geometry = new THREE.BoxGeometry(1, 1, 1);
//   const material = new THREE.MeshPhongMaterial({color: 'red'});
//   const mesh = new THREE.Mesh(geometry, material);
//   sceneInfo.scene.add(mesh);
//   sceneInfo.mesh = mesh;
//   return sceneInfo;
// }
 
// function setupScene2() {
//   const sceneInfo = makeScene(document.querySelector('#pyramid'));
//   const radius = .8;
//   const widthSegments = 4;
//   const heightSegments = 2;
//   const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
//   const material = new THREE.MeshPhongMaterial({
//     color: 'blue',
//     flatShading: true,
//   });
//   const mesh = new THREE.Mesh(geometry, material);
//   sceneInfo.scene.add(mesh);
//   sceneInfo.mesh = mesh;
//   return sceneInfo;
// }
 
// const sceneInfo1 = setupScene1();
// const sceneInfo2 = setupScene2();
// 이제 각 요소가 화면에 보일때만 렌더링할 함수를 만든다.
// Renderer.setScissorTest 를 호출해 가위(scissor) 테스트를 활성화하여 Three.js 가 캔버스의 특정 부분만 렌더링하도록 할 수 있다. 그리고 Renderer.setScissor 로 가위를 설정한 뒤 Renderer.setViewport 로 장면의 좌표를 설정한다.

// function renderSceneInfo(sceneInfo) {
//   const { scene, camera, elem } = sceneInfo;
 
//   // 해당 요소의 화면 대비 좌표를 가져옵니다
//   const { left, right, top, bottom, width, height } =
//       elem.getBoundingClientRect();
 
//   const isOffscreen =
//       bottom < 0 ||
//       top > renderer.domElement.clientHeight ||
//       right < 0 ||
//       left > renderer.domElement.clientWidth;
 
//   if (isOffscreen) {
//     return;
//   }
 
//   camera.aspect = width / height;
//   camera.updateProjectionMatrix();
 
//   const positiveYUpBottom = canvasRect.height - bottom;
//   renderer.setScissor(left, positiveYUpBottom, width, height);
//   renderer.setViewport(left, positiveYUpBottom, width, height);
 
//   renderer.render(scene, camera);
// }
// 다음으로 render 함수에 먼저 캔버스 전체를 비운 후 각 장면을 렌더링 한다.

// function render(time) {
//   time *= 0.001;
 
//   resizeRendererToDisplaySize(renderer);
 
//   renderer.setScissorTest(false);
//   renderer.clear(true, true);
//   renderer.setScissorTest(true);
 
//   sceneInfo1.mesh.rotation.y = time * .1;
//   sceneInfo2.mesh.rotation.y = time * .1;
 
//   renderSceneInfo(sceneInfo1);
//   renderSceneInfo(sceneInfo2);
 
//   requestAnimationFrame(render);
// }


// 첫 번째 <span> 요소가 있는 곳엔 빨간 정육면체, 두 번째 <span> 요소가 있는 곳엔 파란 다이아몬드가 보인다.

// 동기화하기
// 위 코드는 나쁘지 않지만, 복잡한 장면에선 렌더링에 시간이 오래 걸린다면, 장면의 좌표가 더디게 내려올 수 있는 작은 문제가 있다.

// 각 가상 요소에 테두리를 넣고,

// .diagram {
//   display: inline-block;
//   width: 5em;
//   height: 3em;
//   border: 1px solid black;
// }
// 각 장면에 배경색도 넣어보자.

// const scene = new THREE.Scene();
// scene.background = new THREE.Color('red');
// 그런 다음 빠르게 스크롤을 위아래 반복하면 문제가 보인다.

// image

// 추가로 처리할 것이 있지만, 캔버스의 CSS 를 position: fixed 에서 position: absolute 로 바꿔 문제를 해결할 수 있다.

// #c {
//   position: absolute;
// }
// 그러면 스크롤에 상관 없이 캔버스가 항상 상단에 위치하도록 캔버스에 transform 스타일을 지정해준다.

// function render(time) {
//   ...
 
//   const transform = `translateY(${ window.scrollY }px)`;
//   renderer.domElement.style.transform = transform;
// 캔버스에 position: fixed 를 적용하면 캔버스는 스크롤 영향을 받지 않는다.
// position: absolute 를 적용하면 렌더링하는 데 시간이 걸리더라도 일단 다른 페이지와 같이 스크롤 된다. 그리고 렌더링 전에 캔버스를 다시 움직여 화면 전체에 맞추어 캔버스를 렌더링하는 것이다. 이러면 화면 가장자리가 살짝 렌더링되지 않은 부분이 보이지만 버벅이지 않고 제자리를 지킨다.

// image

// 확장하기 쉽게 만들기
// 여러 장면을 구현했으니 좀 더 확장하자.

// 먼저 캔버스 전체를 렌더링하는 render 함수는 두고, 각 장면에 해당하는 가상 요소, 해당 장면을 렌더링하는 함수로 이루어진 객체의 배열을 만든다. render 함수에서 가상 요소가 보이는지 확인 후, 가상 요소가 화면에 보인다면 상응하는 렌더링 함수를 호출한다. 이러면 확장성은 물론 각 장면의 렌더링 함수를 작성할 때도 전체를 신경쓸 필요가 없다.

// 아래는 전체를 담당하는 render 함수다.

// const sceneElements = [];
// function addScene(elem, fn) {
//   sceneElements.push({ elem, fn });
// }
 
// function render(time) {
//   time *= 0.001;
 
//   resizeRendererToDisplaySize(renderer);
 
//   renderer.setScissorTest(false);
//   renderer.setClearColor(clearColor, 0);
//   renderer.clear(true, true);
//   renderer.setScissorTest(true);
 
//   const transform = `translateY(${ window.scrollY }px)`;
//   renderer.domElement.style.transform = transform;
 
//   for (const { elem, fn } of sceneElements) {
//     // 해당 요소의 화면 대비 좌표를 가져옵니다
//     const rect = elem.getBoundingClientRect();
//     const {left, right, top, bottom, width, height} = rect;
 
//     const isOffscreen =
//         bottom < 0 ||
//         top > renderer.domElement.clientHeight ||
//         right < 0 ||
//         left > renderer.domElement.clientWidth;
 
//     if (!isOffscreen) {
//       const positiveYUpBottom = renderer.domElement.clientHeight - bottom;
//       renderer.setScissor(left, positiveYUpBottom, width, height);
//       renderer.setViewport(left, positiveYUpBottom, width, height);
 
//       fn(time, rect);
//     }
//   }
 
//   requestAnimationFrame(render);
// }
// render 함수는 elem 과 fn 속성의 객체로 이루어진 sceneElements 배열을 순회한다.

// 그리고 각 요소가 화면에 보이는지 확인 후, 화면에 보인다면 fn 에 해당 장면이 들어가야할 사각 좌표와 현재 시간값을 넘겨줘 호출한다.

// 이제 각 장면을 만들고 상응하는 요소와 렌더링 함수를 추가한다.

// {
//   const elem = document.querySelector('#box');
//   const { scene, camera } = makeScene();
//   const geometry = new THREE.BoxGeometry(1, 1, 1);
//   const material = new THREE.MeshPhongMaterial({ color: 'red' });
//   const mesh = new THREE.Mesh(geometry, material);
//   scene.add(mesh);
//   addScene(elem, (time, rect) => {
//     camera.aspect = rect.width / rect.height;
//     camera.updateProjectionMatrix();
//     mesh.rotation.y = time * .1;
//     renderer.render(scene, camera);
//   });
// }
 
// {
//   const elem = document.querySelector('#pyramid');
//   const { scene, camera } = makeScene();
//   const radius = .8;
//   const widthSegments = 4;
//   const heightSegments = 2;
//   const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
//   const material = new THREE.MeshPhongMaterial({
//     color: 'blue',
//     flatShading: true,
//   });
//   const mesh = new THREE.Mesh(geometry, material);
//   scene.add(mesh);
//   addScene(elem, (time, rect) => {
//     camera.aspect = rect.width / rect.height;
//     camera.updateProjectionMatrix();
//     mesh.rotation.y = time * .1;
//     renderer.render(scene, camera);
//   });
// }
// sceneInfo1, sceneInfo2 는 더 이상 필요 없으니 제거한다. 대신 각 mesh 의 회전은 해당 장면에서 처리해야 한다.



// HTML Dataset 사용
// HTML 의 dataset 을 이용하면 좀 더 확장하기 쉬운 환경을 만들 수 있다. id="..." 대신 data-diagram="..." 을 이용해 데이터를 직접 HTML 요소에 지정하는 것이다.

// <canvas id="c"></canvas>
// <p>
//   <span data-diagram="box" class="left"></span>
//   I love boxes. Presents come in boxes.
//   When I find a new box I'm always excited to find out what's inside.
// </p>
// <p>
//   <span data-diagram="pyramid" class="right"></span>
//   When I was a kid I dreamed of going on an expedition inside a pyramid
//   and finding a undiscovered tomb full of mummies and treasure.
// </p>
// 요소의 id 를 제거했으니 css 도 변경한다.

// *[data-diagram] {
//   display: inline-block;
//   width: 5em;
//   height: 3em;
// }
// 또한 각 장면을 만드는 코드를 scene initialization functions 라는 맵으로 만든다. 이 맵은 키 값에 대응하는 장면 렌더링 함수를 반환할 것이다.

// const sceneInitFunctionsByName = {
//   'box': () => {
//     const { scene, camera } = makeScene();
//     const geometry = new THREE.BoxGeometry(1, 1, 1);
//     const material = new THREE.MeshPhongMaterial({color: 'red'});
//     const mesh = new THREE.Mesh(geometry, material);
//     scene.add(mesh);
//     return (time, rect) => {
//       mesh.rotation.y = time * .1;
//       camera.aspect = rect.width / rect.height;
//       camera.updateProjectionMatrix();
//       renderer.render(scene, camera);
//     };
//   },
//   'pyramid': () => {
//     const { scene, camera } = makeScene();
//     const radius = .8;
//     const widthSegments = 4;
//     const heightSegments = 2;
//     const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
//     const material = new THREE.MeshPhongMaterial({
//       color: 'blue',
//       flatShading: true,
//     });
//     const mesh = new THREE.Mesh(geometry, material);
//     scene.add(mesh);
//     return (time, rect) => {
//       mesh.rotation.y = time * .1;
//       camera.aspect = rect.width / rect.height;
//       camera.updateProjectionMatrix();
//       renderer.render(scene, camera);
//     };
//   },
// };
// 그리고 querySelectorAll 로 가상 요소를 전부 불러와 해당 요소에 상응하는 렌더링 함수를 실행한다.

// document.querySelectorAll('[data-diagram]').forEach((elem) => {
//   const sceneName = elem.dataset.diagram;
//   const sceneInitFunction = sceneInitFunctionsByName[sceneName];
//   const sceneRenderFunction = sceneInitFunction(elem);
//   addScene(elem, sceneRenderFunction);
// });
// 이제 코드를 확장하기가 한결 편해졌다.

// 각 요소에 액션 추가
// 사용자 액션, 예를 들어 TrackballControls 를 추가하는 건 아주 간단하다. 먼저 스크립트를 불러온다.

// import { TrackballControls } from '/examples/jsm/controls/TrackballControls.js';
// 그리고 각 장면에 대응하는 요소에 TrackballControls 를 추가한다.

// function makeScene(elem) {
//   const scene = new THREE.Scene();
 
//   const fov = 45;
//   const aspect = 2;  // 캔버스 기본값
//   const near = 0.1;
//   const far = 5;
//   const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
//   camera.position.set(0, 1, 2);
//   camera.lookAt(0, 0, 0);
//   scene.add(camera);
 
//   const controls = new TrackballControls(camera, elem);
//   controls.noZoom = true;
//   controls.noPan = true;
 
//   {
//     const color = 0xFFFFFF;
//     const intensity = 1;
//     const light = new THREE.DirectionalLight(color, intensity);
//     light.position.set(-1, 2, 4);
//     camera.add(light);
//   }
 
//  return { scene, camera, controls };
// }
// 위 코드에서는 카메라를 장면에 추가하고, 카메라에 조명을 추가했다.
// 이러면 조명이 카메라를 따라갈 것이다. TrackballControls 는 카메라를 조정하기 때문에 이렇게 해야 빛이 계속 바라보는 방향으로 나간다.

// 또한 컨트롤을 렌더링 함수에서 업데이트 해줘야 한다.

// const sceneInitFunctionsByName = {
//  'box': (elem) => {
//     const { scene, camera, controls } = makeScene(elem);
//     const geometry = new THREE.BoxGeometry(1, 1, 1);
//     const material = new THREE.MeshPhongMaterial({color: 'red'});
//     const mesh = new THREE.Mesh(geometry, material);
//     scene.add(mesh);
//     return (time, rect) => {
//       mesh.rotation.y = time * .1;
//       camera.aspect = rect.width / rect.height;
//       camera.updateProjectionMatrix();
//       controls.handleResize();
//       controls.update();
//       renderer.render(scene, camera);
//     };
//   },
//   'pyramid': (elem) => {
//     const { scene, camera, controls } = makeScene(elem);
//     const radius = .8;
//     const widthSegments = 4;
//     const heightSegments = 2;
//     const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
//     const material = new THREE.MeshPhongMaterial({
//       color: 'blue',
//       flatShading: true,
//     });
//     const mesh = new THREE.Mesh(geometry, material);
//     scene.add(mesh);
//     return (time, rect) => {
//       mesh.rotation.y = time * .1;
//       camera.aspect = rect.width / rect.height;
//       camera.updateProjectionMatrix();
//       controls.handleResize();
//       controls.update();
//       renderer.render(scene, camera);
//     };
//   },
// };
// 이제 각 물체를 자유롭게 회전시킬 수 있다.



// 이 기법은 이 사이트 전체를 사용한 기법이다. 원시 모델과 재질에서 다양한 예시를 위해 보여준 바 있다.

// 다른 방법으론 화면 밖의 캔버스에서 장면을 렌더링해 각 요소에 2D 캔버스 형태로 넘겨주는 방법이 있다. 이 방법의 장점은 각 영역을 어떻게 분리할지 고민하지 않아도 된다. 위에서 살펴본 방법은 캔버스를 화면 전체의 배경으로 써야 했지만, 이 방법은 일반 HTML 형태로 사용할 수 있다.

// 하지만 이 방법은 각 영역을 복사하는 것이라 성능이 더 느리다. 이는 GPU 성능과 브라우저에 따라 다르다.

// 먼저 배경에서 캔버스 요소를 제거한다.

// <body>
//   <!-- <canvas id="c"></canvas> -->
//   ...
// </body>
// css 도 바꿔준다.

// canvas {
//   width: 100%;
//   height: 100%;
//   display: block;
// }
// [data-diagram] {
//   display: inline-block;
//   width: 5em;
//   height: 3em;
// }
// 캔버스 요소가 부모에 꽉 차도록 변경했다.

// 이제 자바스크립트를 변경해보자. 먼저 캔버스를 참조할 필요가 없으니 대신 캔버스 요소를 새로 만든다. 또한 가위 테스트를 처음에 활성화한다.

// function main() {
//   // const canvas = document.querySelector('#c');
//   const canvas = document.createElement('canvas');
//   const renderer = new THREE.WebGLRenderer({canvas, alpha: true});
//   renderer.setScissorTest(true);
 
//   ...
// 다음으로 각 장면에 2D 렌더링 컨텍스트를 생성하고 장면에 대응하는 요소에 캔버스를 추가한다.

// const sceneElements = [];
// function addScene(elem, fn) {
//   const ctx = document.createElement('canvas').getContext('2d');
//   elem.appendChild(ctx.canvas);
//   // sceneElements.push({ elem, fn });
//   sceneElements.push({ elem, ctx, fn });
// }
// 만약 렌더링 시 렌더링 용 캔버스 크기가 장면의 크기보다 작을 때, 렌더링용 캔버스 크기를 키운다. 또한 2D 캔버스의 크기가 부모 요소와 다르면 2D 캔버스 크기를 조정한다. 마지막으로 가위와 화면을 설정하고, 해당 장면을 렌더링한 뒤, 요소의 캔버스로 렌더링 결과물을 복사한다.

// function render(time) {
//   time *= 0.001;
 
//   for (const { elem, fn, ctx } of sceneElements) {
//     // 해당 요소의 화면 대비 좌표를 가져옵니다
//     const rect = elem.getBoundingClientRect();
//     const { left, right, top, bottom, width, height } = rect;
//     const rendererCanvas = renderer.domElement;
 
//     const isOffscreen =
//         bottom < 0 ||
//         top > window.innerHeight ||
//         right < 0 ||
//         left > window.innerWidth;
 
//     if (!isOffscreen) {
//       // 렌더링용 캔버스 크기 조정
//       if (rendererCanvas.width < width || rendererCanvas.height < height) {
//         renderer.setSize(width, height, false);
//       }
 
//       // 2D 캔버스의 크기가 요소의 크기와 같도록 조정
//       if (ctx.canvas.width !== width || ctx.canvas.height !== height) {
//         ctx.canvas.width = width;
//         ctx.canvas.height = height;
//       }
 
//       renderer.setScissor(0, 0, width, height);
//       renderer.setViewport(0, 0, width, height);
 
//       fn(time, rect);
 
//       // 렌더링된 장면을 2D 캔버스에 복사
//       ctx.globalCompositeOperation = 'copy';
//       ctx.drawImage(
//           rendererCanvas,
//           0, rendererCanvas.height - height, width, height,  // 원본 사각 좌표
//           0, 0, width, height);                              // 결과물 사각 좌표
//     }
//   }
 
//   requestAnimationFrame(render);
// }
// 결과물은 위와 다르지 않다.



// 이 기법의 다른 장점은 OffscreenCanvas 웹 워커를 이용해 이 기능을 별도 스레드에서 구현할 수 있다는 것이다. 하지만 아쉽지만 2020.07 기준으로 OffscreenCanvas 는 아직 크로미움 기반 브라우저에서만 지원한다.

// 피킹(Picking)
// 피킹이란 사용자가 클릭 또는 터치한 물체를 가려내는 작업이다.
// 구현 방법은 많지만, 각각 장단점이 있다. 여기선 2가지 방법을 살펴본다.

// 피킹은 흔히 광선 투사(ray casting)일 것이다. 포인터(커서)에서 장면의 절두체로 광선을 쏴 광선이 닿는 물체를 감지하는 기법이다. 이는 가장 간단한 방법이다.

// 먼저 포인터의 좌표를 구한 뒤, 이 좌표를 카메라 시선과 방향에 따라 3D 좌표로 변환한다. 그리고 near 면에서 far 면 까지의 광선을 구해 이 광선이 장면 안 각 물체의 삼각형과 교차하는지 확인한다. 만약 장면에 1000개의 삼각형을 가진 물체가 1000개 있다면 백만 개의 삼각형을 모두 확인해야하는 셈이다.

// 이는 몇 가지 방법으로 최적화를 시도할 수 있다. 하나는 물체를 감싼 경계(bounding) 좌표가 광선과 교차하는지 확인하고, 교차하지 않는다면 해당 삼각형은 확인하지 않는다.

// Three.js에는 이런 작업을 대신해주는 RayCaster 클래스가 있다.

// 한 번 물체 100개가 있는 장면을 만들어 피킹을 구현해보자.
// 예제는 반응형 디자인의 예제를 사용한다.

// 우선 카메라를 별도로 Object3D 의 자식으로 추가해 카메라가 셀카봉처럼 장면 주위를 들 수 있도록 한다.

// const fov = 60;
// const aspect = 2;  // 캔버스 기본값
// const near = 0.1;
// const far = 200;
// const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
// camera.position.z = 30;
 
// const scene = new THREE.Scene();
// scene.background = new THREE.Color('white');
 
// // 카메라를 봉(pole)에 추가
// // 이러면 봉을 회전시켜 카메라가 장면 주위를 돌도록 할 수 있음
// const cameraPole = new THREE.Object3D();
// scene.add(cameraPole);
// cameraPole.add(camera);
// 그리고 render 함수 안에서 카메라 봉을 돌린다.

// cameraPole.rotation.y = time * .1;
// 또한 카메라에 조명을 추가해 조명이 카메라와 같이 움직이도록 한다.

// // scene.add(light);
// camera.add(light);
// 정육면체 100개의 위치, 방향, 크기를 무작위로 설정해 생성한다.

// const boxWidth = 1;
// const boxHeight = 1;
// const boxDepth = 1;
// const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
 
// function rand(min, max) {
//   if (max === undefined) {
//     max = min;
//     min = 0;
//   }
//   return min + (max - min) * Math.random();
// }
 
// function randomColor() {
//   return `hsl(${ rand(360) | 0 }, ${ rand(50, 100) | 0 }%, 50%)`;
// }
 
// const numObjects = 100;
// for (let i = 0; i < numObjects; ++i) {
//   const material = new THREE.MeshPhongMaterial({
//     color: randomColor(),
//   });
 
//   const cube = new THREE.Mesh(geometry, material);
//   scene.add(cube);
 
//   cube.position.set(rand(-20, 20), rand(-20, 20), rand(-20, 20));
//   cube.rotation.set(rand(Math.PI), rand(Math.PI), 0);
//   cube.scale.set(rand(3, 6), rand(3, 6), rand(3, 6));
// }
// 이제 피킹을 구현해보자.
// 피킹을 관리할 간단한 클래스를 만든다.

// class PickHelper {
//   constructor() {
//     this.raycaster = new THREE.Raycaster();
//     this.pickedObject = null;
//     this.pickedObjectSavedColor = 0;
//   }
//   pick(normalizedPosition, scene, camera, time) {
//     // 이미 다른 물체를 피킹했다면 색을 복원합니다
//     if (this.pickedObject) {
//       this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
//       this.pickedObject = undefined;
//     }
 
//     // 절두체 안에 광선을 쏩니다
//     this.raycaster.setFromCamera(normalizedPosition, camera);
//     // 광선과 교차하는 물체들을 배열로 만듭니다
//     const intersectedObjects = this.raycaster.intersectObjects(scene.children);
//     if (intersectedObjects.length) {
//       // 첫 번째 물체가 제일 가까우므로 해당 물체를 고릅니다
//       this.pickedObject = intersectedObjects[0].object;
//       // 기존 색을 저장해둡니다
//       this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
//       // emissive 색을 빨강/노랑으로 빛나게 만듭니다
//       this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xFFFF00 : 0xFF0000);
//     }
//   }
// }
// 위 클래스는 먼저 RayCaster 인스턴스를 만들고 pick 메서드를 호출하면 장면에 광선을 솔 수 있게 해준다. 그리고 광선에 맞는 요소가 있으면 해당 요소 중 가장 첫 번째 요소 색을 변경한다.

// 사용자가 마우스를 눌렀을 때(down)만 이 함수가 작동하도록 할수 있지만, 예제에서는 마우스 포인터 아래에 있는 요소를 피킹하도록 한다. 이를 구현하려면 먼저 포인터를 추적해야 한다.

// const pickPosition = { x: 0, y: 0 };
// clearPickPosition();
 
// ...
 
// function getCanvasRelativePosition(event) {
//   const rect = canvas.getBoundingClientRect();
//   return {
//     x: (event.clientX - rect.left) * canvas.width  / rect.width,
//     y: (event.clientY - rect.top ) * canvas.height / rect.height,
//   };
// }
 
// function setPickPosition(event) {
//   const pos = getCanvasRelativePosition(event);
//   pickPosition.x = (pos.x / canvas.width ) *  2 - 1;
//   pickPosition.y = (pos.y / canvas.height) * -2 + 1;  // Y 축을 뒤집었음
// }
 
// function clearPickPosition() {
//   /**
//    * 마우스의 경우는 항상 위치가 있어 그다지 큰
//    * 상관이 없지만, 터치 같은 경우 사용자가 손가락을
//    * 떼면 피킹을 멈춰야 합니다. 지금은 일단 어떤 것도
//    * 선택할 수 없는 값으로 지정해두었습니다
//    **/
//   pickPosition.x = -100000;
//   pickPosition.y = -100000;
// }
 
// window.addEventListener('mousemove', setPickPosition);
// window.addEventListener('mouseout', clearPickPosition);
// window.addEventListener('mouseleave', clearPickPosition);
// 위 예제에선 마우스 좌표를 정규화(normalize)했다. 캔버스의 크기와 상관없이 왼쪽 끝이 -1, 오른쪽 끝이 +1인 벡터값이 필요해서이다. 마찬가지로 아래쪽 끝이 -1, 위쪽 끝이 +1이다.

// 모바일 환경도 지원하기 위해 리스터를 더 추가한다.

// window.addEventListener('touchstart', (event) => {
//   event.preventDefault(); // 스크롤 이벤트 방지
//   setPickPosition(event.touches[0]);
// }, { passive: false });
 
// window.addEventListener('touchmove', (event) => {
//   setPickPosition(event.touches[0]);
// });
 
// window.addEventListener('touchend', clearPickPosition);
// 마지막으로 render 함수에서 PickHelper 의 pick 메소드를 호출한다.

// const pickHelper = new PickHelper();
 
// function render(time) {
//   time *= 0.001;  // 초 단위로 변환
 
//   ...
 
//   pickHelper.pick(pickPosition, scene, camera, time);
 
//   renderer.render(scene, camera);
 
//   ...
// 결과는 다음과 같다.



// 문제 없어 보이지만, 실제로 다음 몇 가지 문제점이 있다.

// CPU 자원 사용
// 자바스크립트 엔진은 각 요소를 돌며 광선이 경계 좌표에 교차하는지 확인한다. 교차할 경우, 해당 요소의 삼각형을 전부 돌며 광선과 교차하는 삼각형이 있는지 확인한다.

// 이 방식의 장점은 교차점을 정확히 계산해 데이터를 넘겨줄 수 있다는 점이다. 교차한 지점에 특정 표시를 할 수 있을 것이다.

// 대신 CPU 사용률 증가의 단점이 있다. 요소가 가진 삼각형이 많을 수록 더 느려진다.

// 특이한 방식의 쉐이더나 변이는 감지 불가능
// 만약 장면에서 geometry 를 변형하는 쉐이더를 사용하면, 자바스크립트는 이 변형을 감지 못하여 잘못된 값을 내놓을 것이다.

// 요소의 투명한 구멍을 처리못함.
// 예제에 아래 텍스처를 정육면체에 적용해 보자.

// image

// const loader = new THREE.TextureLoader();
// const texture = loader.load('resources/images/frame.png');
 
// const numObjects = 100;
// for (let i = 0; i < numObjects; ++i) {
//   const material = new THREE.MeshPhongMaterial({
//     color: randomColor(),
//     +map: texture,
//     +transparent: true,
//     +side: THREE.DoubleSide,
//     +alphaTest: 0.1,
//   });
 
//   const cube = new THREE.Mesh(geometry, material);
//   scene.add(cube);
 
//   ...
// 예제를 실행시키면 문제가 보일 것이다.



// 정육면체 빈 공간을 통해 무언갈 선택할 수가 없다.

// image

// 이는 자바스크립트가 텍스터 재질을 보고 투명한지 판단하기 어렵다.

// 이 문제를 해결하기 위해 GPU 기반 피킹을 구현해야 한다. 이론적으론 간단하지만 광선 투사법보다 더 복잡하다.

// GPU 피킹을 구현하려면 각 요소를 별도 화면에서 고유 색상으로 렌더링해야 한다. 그리고 포인터 아래의 픽셀 색을 가져와 해당 요소가 선택됐는지 확인하는 것이다.

// 이러면 위에서 언급한 문제점 2,3번이 해결된다. 1번, 성능은 상황에 따라 다른데, 눈에 보이는 화면을 위해 한 번, 피킹을 위해 한 번, 이렇게 매 요소를 총 두 번씩 렌더링해야 한다. 더 복잡한 해결책을 쓰면 렌더링을 한 번만 할 수도 있지만, 이 글에선 더 간단한 방법을 사용한다.

// 성능 최적화를 위해 시도할 수 있는 방법이 하나 있다. 어차피 픽셀을 하나만 읽을 것이니, 카메라를 픽셀 하나만 렌더링하도록 설정하는 것이다.
// PerspectiveCamera.setViewOffset 메소드를 사용하면 카메라의 특정 부분만 렌더링하도록 할 수 있다. 이러면 성능 향상에 조금이나마 도움이 된다.

// 현재 Three.js 에서 이 방법을 통해 구현하려면 장면 2개 사용해야 한다. 하나는 기존 mesh 를 그대로 쓰고, 나머지 하나는 피킹용 재질을 적용한 mesh를 쓸 것이다.

// 먼저 두 번째 장면을 추가하고 배경을 검정으로 지정한다.

// const scene = new THREE.Scene();
// scene.background = new THREE.Color('white');
// const pickingScene = new THREE.Scene();
// pickingScene.background = new THREE.Color(0);
// 각 정육면체를 장면에 추가할 때 pickingScene 의 같은 위치에 피킹용 정육면체를 추가한다. 그리고 각 피킹용 정육면체에는 id로 쓸 고유 색상 값을 지정한 뒤, 이 id 색상값으로 재질을 만들어 추가한다. id 색상값을 정육면체의 키값으로 매핑해 놓으면 나중에 상응하는 정육면체를 바로 불러올 수 있다.

// const idToObject = {};
// const numObjects = 100;
// for (let i = 0; i < numObjects; ++i) {
//   const id = i + 1;
//   const material = new THREE.MeshPhongMaterial({
//     color: randomColor(),
//     map: texture,
//     transparent: true,
//     side: THREE.DoubleSide,
//     alphaTest: 0.1,
//   });
 
//   const cube = new THREE.Mesh(geometry, material);
//   scene.add(cube);
//   idToObject[id] = cube;
 
//   cube.position.set(rand(-20, 20), rand(-20, 20), rand(-20, 20));
//   cube.rotation.set(rand(Math.PI), rand(Math.PI), 0);
//   cube.scale.set(rand(3, 6), rand(3, 6), rand(3, 6));
 
//   const pickingMaterial = new THREE.MeshPhongMaterial({
//     emissive: new THREE.Color(id),
//     color: new THREE.Color(0, 0, 0),
//     specular: new THREE.Color(0, 0, 0),
//     map: texture,
//     transparent: true,
//     side: THREE.DoubleSide,
//     alphaTest: 0.5,
//     blending: THREE.NoBlending,
//   });
//   const pickingCube = new THREE.Mesh(geometry, pickingMaterial);
//   pickingScene.add(pickingCube);
//   pickingCube.position.copy(cube.position);
//   pickingCube.rotation.copy(cube.rotation);
//   pickingCube.scale.copy(cube.scale);
// }
// 위 코드에선 MeshPhongMeterial 로 편법을 사용했다. emissive 속성을 id 색상값으로, color 와 specular 속성을 0으로 설정하면 텍스처의 알파값이 alphaTest 보다 큰 부분만 id 색상값으로 보인다. 또 blending 속성을 THREE.NoBlending 으로 설정해 id 색상값이 알파값의 영향을 받지 않도록 했다.

// 이 편법은 해결책은 아니며 여러가지 옵션을 껐다 해도 여전히 조명 관련 연산을 실행할 것이다. 코드를 더 최적화하려면 alphaTest 값보다 높은 경우에만 id 색상을 렌더링하는 쉐이더를 직접 만들어야 한다.

// 광성 투사법을 쓸 때와 달리 픽셀 하나만 사용하므로 위치 값이 픽셀 하나만 가리키게 변경한다.

// function setPickPosition(event) {
//   const pos = getCanvasRelativePosition(event);

//   pickPosition.x = pos.x;
//   pickPosition.y = pos.y;
// }
// PickHelper 클래스도 GPUPickHelper 로 변경한다. 렌더 타겟에서 다룬 WebGLRenderTarget 을 써 구현하되, 이번 렌더 타겟의 크기는 1x1, 1픽셀이다.

// class GPUPickHelper {
//   constructor() {
//     // 1x1 픽셀 크기의 렌더 타겟을 생성합니다
//     this.pickingTexture = new THREE.WebGLRenderTarget(1, 1);
//     this.pixelBuffer = new Uint8Array(4);
//     this.pickedObject = null;
//     this.pickedObjectSavedColor = 0;
//   }
//   pick(cssPosition, scene, camera, time) {
//     const {pickingTexture, pixelBuffer} = this;
 
//     // 기존에 선택된 요소가 있는 경우 색을 복원합니다
//     if (this.pickedObject) {
//       this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
//       this.pickedObject = undefined;
//     }
 
//     // view offset을 마우스 포인터 아래 1픽셀로 설정합니다
//     const pixelRatio = renderer.getPixelRatio();
//     camera.setViewOffset(
//         renderer.getContext().drawingBufferWidth,   // 전체 너비
//         renderer.getContext().drawingBufferHeight,  // 전체 높이
//         cssPosition.x * pixelRatio | 0,             // 사각 x 좌표
//         cssPosition.y * pixelRatio | 0,             // 사각 y 좌표
//         1,                                          // 사각 좌표 width
//         1,                                          // 사각 좌표 height
//     );
//     // 장면을 렌더링합니다
//     renderer.setRenderTarget(pickingTexture)
//     renderer.render(scene, camera);
//     renderer.setRenderTarget(null);
 
//     // view offset을 정상으로 돌려 원래의 화면을 렌더링하도록 합니다
//     camera.clearViewOffset();
//     // 픽셀을 감지합니다
//     renderer.readRenderTargetPixels(
//         pickingTexture,
//         0,   // x
//         0,   // y
//         1,   // width
//         1,   // height
//         pixelBuffer);
 
//     const id =
//         (pixelBuffer[0] << 16) |
//         (pixelBuffer[1] <<  8) |
//         (pixelBuffer[2]      );
 
//     const intersectedObject = idToObject[id];
//     if (intersectedObject) {
//       // 첫 번째 물체가 제일 가까우므로 해당 물체를 고릅니다
//       this.pickedObject = intersectedObject;
//       // 기존 색을 저장해둡니다
//       this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
//       // emissive 색을 빨강/노랑으로 빛나게 만듭니다
//       this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xFFFF00 : 0xFF0000);
//     }
//   }
// }
// 인스턴스를 만드는 쪽도 수정한다.

// const pickHelper = new GPUPickHelper();
// pick 메소드를 호출할 때 scene 대신 pickScene 을 넘겨준다.

// pickHelper.pick(pickPosition, pickScene, camera, time);
// 이제 투명한 부분을 관통해 요소를 선택할 수 있다.

