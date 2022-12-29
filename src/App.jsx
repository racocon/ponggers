import "./App.css";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

function App() {
  // Player score
  const [player1, setPlayer1] = useState(0);
  const [player2, setPlayer2] = useState(0);

  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#74b9ff");

    const movement = (model1, paddle1, model2, paddle2) => {
      window.onkeydown = (e) => {
        switch (e.key) {
          case "ArrowLeft":
            model1.position.x += -2;
            paddle1.position.x += -2;
            break;
          case "ArrowRight":
            model1.position.x += 2;
            paddle1.position.x += 2;
            break;
          case "a":
            model2.position.x += -2;
            paddle2.position.x += -2;
            break;
          case "d":
            model2.position.x += 2;
            paddle2.position.x += 2;
            break;
          default:
            break;
        }
      };
    };

    // Load grass texture
    const texture = new THREE.TextureLoader().load("/src/assets/grass2.png");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);

    // Set game window size
    const width = window.innerWidth * 0.9;
    const height = window.innerHeight * 0.8;

    // Set camera position
    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000);
    camera.position.set(0, 90, 96);

    const canvas = document.getElementById("myThreeJsCanvas");
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    });
    renderer.setSize(width, height);
    document.body.appendChild(renderer.domElement);

    // Set lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    ambientLight.castShadow = true;
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.castShadow = true;
    spotLight.position.set(0, 64, 32), scene.add(spotLight);

    // Floor object
    const baseGeometry = new THREE.PlaneGeometry(400, 200);
    const baseMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
    const grass = new THREE.Mesh(baseGeometry, baseMaterial);
    scene.add(grass);
    grass.rotation.x = Math.PI / 2;
    grass.position.set(0, -6, -25);

    // Ball object
    const ballGeometry = new THREE.SphereGeometry(3, 16, 8);
    const ballMaterial = new THREE.MeshToonMaterial({ color: 0xc23616 });
    const ball = new THREE.Mesh(ballGeometry, ballMaterial);
    scene.add(ball);
    ball.position.set(0, 0, 0);

    // Paddle mesh
    const paddleGeometry = new THREE.BoxGeometry(28, 4, 4);
    const paddleMaterial = new THREE.MeshBasicMaterial({
      opacity: 0,
      transparent: true,
    });

    const paddle1 = new THREE.Mesh(paddleGeometry, paddleMaterial);
    const paddle2 = new THREE.Mesh(paddleGeometry, paddleMaterial);

    // Load Maxwell model
    let maxwell;
    const gltfLoader = new GLTFLoader();

    gltfLoader.load("/src/assets/maxwell/scene.gltf", (gltf) => {
      maxwell = gltf.scene;

      scene.add(maxwell);
      scene.add(paddle1);

      // Player 1 Maxwell
      maxwell.position.set(0, -5, 50);
      paddle1.position.set(0, 0, 43);
      maxwell.rotation.y = Math.PI;

      // Player 2 Maxwell
      const maxwell2 = maxwell.clone();
      maxwell2.position.set(0, -5, -100);
      paddle2.position.set(0, 0, -93);
      maxwell2.rotation.y = Math.PI;
      scene.add(maxwell2);
      scene.add(paddle2);

      movement(maxwell, paddle1, maxwell2, paddle2);
    });

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);

    // Ball movement stuff
    let dx = 0;
    let dz = 1;

    const startBallMovement = () => {
      var direction = Math.random() > 0.5 ? -1 : 1;
      ball.$velocity = {
        x: dx,
        z: direction * dz,
      };
      ball.$stopped = false;
    };

    const processBallMovement = () => {
      if (!ball.$velocity) {
        startBallMovement();
      }

      if (ball.$stopped) {
        return;
      }

      updateBallPosition();

      if (isSideCollision()) {
        dx *= -1;
      }
    };

    const updateBallPosition = () => {
      ball.position.z += dz;
      ball.position.x += dx;

      // Adds arc to ball's flight
      ball.position.y =
        -(((ball.position.z - 20) * (ball.position.z + 70)) / 100) + 30;
    };

    // Bounce back when collide with walls
    const isSideCollision = () => {
      return ball.position.x - 3 < -50 || ball.position.x + 3 > 50;
    };

    const checkCollisionWith = (paddle) => {
      if (Math.abs(ball.position.z - paddle.position.z) <= 1) {
        if (
          ball.position.z + 3 >= paddle.position.z &&
          isBallAlignedWithPaddle(paddle)
        ) {
          dz *= -1;
          dx = (ball.position.x - paddle.position.x) / 15;
        }
      }
    };

    const isBallAlignedWithPaddle = (paddle) => {
      var halfPaddleWidth = 28 / 2,
        paddleX = paddle.position.x,
        ballX = ball.position.x;
      return (
        ballX > paddleX - halfPaddleWidth && ballX < paddleX + halfPaddleWidth
      );
    };

    function reset() {
      ball.position.set(0, 0, 0);
      dx = 0;
    }

    const checkOutOfBounds = () => {
      if (ball.position.z < -130) {
        setPlayer1((prev) => prev + 1);
        reset();
      } else if (ball.position.z > 80) {
        setPlayer2((prev) => prev + 1);
        reset();
      }
    };

    const render = () => {
      controls.update();
      renderer.render(scene, camera);

      checkCollisionWith(paddle1);
      checkCollisionWith(paddle2);
      startBallMovement();
      processBallMovement();
      checkOutOfBounds();

      window.requestAnimationFrame(render);
    };
    render();
  }, []);

  return (
    <div className="App">
      <div className="mx-auto w-[80vw] py-6 font-bold text-3xl text-[#00FF9C] uppercase flex flex-row justify-between">
        <code className="grid grid-cols-2">
          <div className="text-left">Player 1 </div>
          <div className="text-left px-4 pt-8 text-white">{player1} </div>
        </code>
        <code className="grid grid-cols-2">
          <div className="text-left">Player 2 </div>
          <div className="text-left px-4 pt-8 text-white">{player2} </div>
        </code>
      </div>
      <canvas
        className="mx-auto border-8 border-[#ff4081]"
        id="myThreeJsCanvas"
      />
    </div>
  );
}

export default App;