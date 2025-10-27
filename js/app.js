import { GLTFLoader } from 'https://threejs.org/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://threejs.org/examples/jsm/loaders/DRACOLoader.js';

// --- Global Variables ---
let scene, camera, renderer, model;
const mouse = new window.THREE.Vector2();

// --- Initialization ---
function init() {
    // Scene
    scene = new window.THREE.Scene();

    // Camera
    camera = new window.THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Renderer
    renderer = new window.THREE.WebGLRenderer({
        canvas: document.querySelector('#webgl-canvas'),
        alpha: true,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = window.THREE.ACESFilmicToneMapping;
    renderer.outputEncoding = window.THREE.sRGBEncoding;

    // Lights
    const ambientLight = new window.THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const dirLight = new window.THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    // --- Load 3D Model ---
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    // NOTE: This is a placeholder model. Replace with your watch.glb
    // For this demo, we use a complex model that is publicly available.
    loader.load(
        'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
        (gltf) => {
            model = gltf.scene;
            model.scale.set(1.5, 1.5, 1.5);
            model.position.y = -1; // Center it
            scene.add(model);

            // We have the model, now set up animations
            setupScrollAnimations();
        },
        undefined,
        (error) => {
            console.error('An error happened while loading the model:', error);
        }
    );

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);

    // Start render loop
    animate();
}

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    // Mouse tilt effect
    if (model) {
        model.rotation.y = window.THREE.MathUtils.lerp(model.rotation.y, mouse.x * 0.2, 0.05);
        model.rotation.x = window.THREE.MathUtils.lerp(model.rotation.x, -mouse.y * 0.2, 0.05);
    }

    renderer.render(scene, camera);
}

// --- Event Handlers ---
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    // Normalize mouse position (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// --- GSAP Scrollytelling ---
function setupScrollAnimations() {
    window.gsap.registerPlugin(window.ScrollTrigger);

    // Make sections visible
    window.gsap.utils.toArray('.scroll-section').forEach((section, index) => {
        window.gsap.to(section, {
            opacity: 1,
            scrollTrigger: {
                trigger: section,
                start: "top 70%",
                end: "bottom 30%",
                toggleActions: "play reverse play reverse"
            }
        });
    });

    // --- Master 3D Animation Timeline ---
    const tl = window.gsap.timeline({
        scrollTrigger: {
            trigger: ".scroll-container",
            start: "top top",
            end: "bottom bottom",
            scrub: 1, // Smoothly link animation to scroll
        }
    });

    // --- ANIMATION STAGES ---

    // 1. Hero -> Feature 1: Zoom in on the "Face"
    tl.to(camera.position, { z: 2.5, y: 0.5 }, "start");
    tl.to(model.rotation, { x: 0.5, y: 0.2 }, "start");

    // 2. Feature 1 -> Feature 2: Rotate to show the "Back"
    tl.to(model.rotation, { y: Math.PI * 1.2, x: 0.2 }, "feature2");

    // 3. Feature 2 -> Feature 3: Move camera and prep for explosion
    tl.to(camera.position, { z: 4, y: 0 }, "feature3");
    tl.to(model.rotation, { y: Math.PI * 2, x: 0 }, "feature3");

    // 4. THE EXPLODED VIEW
    // We *assume* the model's parts are named.
    // In a real project, you'd open the .glb in Blender to get these names.
    // We will target the placeholder model's parts.
    const screen = model.getObjectByName('visor'); // Placeholder name
    const body = model.getObjectByName('backpack'); // Placeholder name
    const sensor = model.getObjectByName('Object_10'); // Placeholder name

    if (screen && body && sensor) {
        tl.to(screen.position, { z: 2 }, "explode");
        tl.to(body.position, { z: -1.5 }, "explode");
        tl.to(sensor.position, { y: 0.5, x: 1.5 }, "explode");

        // Animate labels
        tl.to("#label-screen", { opacity: 1, visibility: 'visible' }, "explode");
        tl.to("#label-body", { opacity: 1, visibility: 'visible' }, "explode");
        tl.to("#label-sensor", { opacity: 1, visibility: 'visible' }, "explode");
    }

    // 5. Feature 3 -> CTA: Reassemble the model
    if (screen && body && sensor) {
        tl.to(screen.position, { z: 0 }, "reassemble");
        tl.to(body.position, { z: 0 }, "reassemble");
        tl.to(sensor.position, { y: 0, x: 0 }, "reassemble");

        // Hide labels
        tl.to(".feature-label", { opacity: 0, visibility: 'hidden' }, "reassemble");
    }

    // 6. Final CTA: Reset camera
    tl.to(camera.position, { z: 5, y: 0 }, "end");
    tl.to(model.rotation, { x: 0, y: 0 }, "end");
}

// --- Start ---
init();
