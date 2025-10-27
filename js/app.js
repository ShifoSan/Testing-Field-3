import * as THREE from 'https://cdn.skypack.dev/three@0.128.0/build/three.module.js';
import { gsap } from 'https://cdn.skypack.dev/gsap@3.9.1';
import { ScrollTrigger } from 'https://cdn.skypack.dev/gsap@3.9.1/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

class WebGLApp {
    constructor() {
        this.container = document.getElementById('webgl-canvas-container');
        this.camera = new THREE.PerspectiveCamera(75, this.container.offsetWidth / this.container.offsetHeight, 0.1, 1000);
        this.camera.position.z = 5;

        this.scene = new THREE.Scene();

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        this.setupLights();
        this.createModel();
        this.setupAnimations();

        window.addEventListener('resize', this.onWindowResize.bind(this));
        this.animate();
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);
    }

    createModel() {
        // Using a group to simulate an "explodable" model
        this.modelGroup = new THREE.Group();

        const coreGeo = new THREE.IcosahedronGeometry(1, 0);
        const coreMat = new THREE.MeshStandardMaterial({ color: 0x2a9d8f, roughness: 0.3, metalness: 0.8 });
        const core = new THREE.Mesh(coreGeo, coreMat);
        this.modelGroup.add(core);

        // Create "satellite" parts to explode outwards
        for (let i = 0; i < 8; i++) {
            const partGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
            const partMat = new THREE.MeshStandardMaterial({ color: 0xe9c46a, roughness: 0.5, metalness: 0.5 });
            const part = new THREE.Mesh(partGeo, partMat);

            const angle = (i / 8) * Math.PI * 2;
            part.position.set(Math.cos(angle) * 1.5, Math.sin(angle) * 1.5, 0);
            this.modelGroup.add(part);
        }

        this.scene.add(this.modelGroup);
    }

    setupAnimations() {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".scroll-container",
                scrub: 1,
                start: "top top",
                end: "bottom bottom"
            }
        });

        // Section 1 -> 2: Rotate and zoom in
        tl.to(this.modelGroup.rotation, { x: Math.PI * 2, y: Math.PI * 2 }, 0);
        tl.to(this.camera.position, { z: 3 }, 0);

        // Section 2 -> 3: Prepare for exploded view
        tl.to(this.camera.position, { z: 8 }, 'explode_start');
        tl.to(this.modelGroup.rotation, { x: Math.PI * 4, y: Math.PI * 4 }, 'explode_start');

        // Section 3 -> 4: Explode the view
        this.modelGroup.children.forEach((child, index) => {
            if (index > 0) { // Don't move the core
                const initialPosition = child.position.clone();
                const targetPosition = initialPosition.clone().multiplyScalar(2.5);
                tl.to(child.position, {
                    x: targetPosition.x,
                    y: targetPosition.y,
                    z: targetPosition.z,
                }, 'explode_start');
            }
        });

        // Section 4 -> End: Reassemble
        this.modelGroup.children.forEach((child, index) => {
            if (index > 0) {
                 tl.to(child.position, {
                    x: child.position.x / 2.5,
                    y: child.position.y / 2.5,
                    z: child.position.z / 2.5,
                });
            }
        });
        tl.to(this.camera.position, { z: 4 }, 'reassemble');
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
    }
}

new WebGLApp();
