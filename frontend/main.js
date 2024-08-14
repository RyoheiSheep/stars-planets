// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Function to handle window resizing
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

// Add ambient light and directional light
const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

// Function to create a color gradient background
function createBackground() {
    const geometry = new THREE.SphereGeometry(10000, 32, 32);
    const material = new THREE.MeshBasicMaterial({
        color: 0x000000, // Dark color for night sky
        side: THREE.BackSide
    });
    const background = new THREE.Mesh(geometry, material);
    scene.add(background);
}

// Function to create a dense star field with realistic colors and twinkling effect
function createStarField() {
    const starCount = 20000;
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ size: 0.5, depthWrite: false });

    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
        // Generate a random point within a sphere
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(1 - 2 * Math.random());
        const radius = Math.cbrt(Math.random()) * 10000; // cbrt to ensure uniform distribution in 3D

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);

        starPositions[i * 3] = x;
        starPositions[i * 3 + 1] = y;
        starPositions[i * 3 + 2] = z;

        // Randomize star colors
        const color = new THREE.Color();
        color.setHSL(Math.random(), 0.8, Math.random() * 0.5 + 0.5); // Hue, Saturation, Lightness
        starColors[i * 3] = color.r;
        starColors[i * 3 + 1] = color.g;
        starColors[i * 3 + 2] = color.b;

        // Randomize star sizes
        starSizes[i] = Math.random() * 1.5 + 0.5;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

    starMaterial.vertexColors = true;

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Animate star twinkling
    function animateStars() {
        const time = Date.now() * 0.002;
        for (let i = 0; i < starCount; i++) {
            starSizes[i] = Math.sin(time + i * 0.1) * 1.5 + 0.5; // Twinkling effect
        }
        starGeometry.attributes.size.needsUpdate = true;
        requestAnimationFrame(animateStars);
    }
    animateStars();
}

// Function to create a celestial body with shading for planets and no shading for the Sun
function createCelestialBody(radius, color, position, isSun = false) {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = isSun ? 
        new THREE.MeshBasicMaterial({
            color: color,
            emissive: color // Use emissive color for the Sun
        }) : 
        new THREE.MeshStandardMaterial({
            color: color,
            roughness: 1, // More roughness for matte appearance
            metalness: 0 // Less metallic
        });
        
    const body = new THREE.Mesh(geometry, material);
    body.position.set(position.x, position.y, position.z);
    scene.add(body);
    return body;
}

// Create the solar system
function createSolarSystem() {
    // Create the sun with orange color and no shading
    const sun = createCelestialBody(500, 0xFFA500, { x: 0, y: 0, z: 0 }, false);

    // Create planets with shading
    const planets = [
        { name: 'Mercury', radius: 20, distance: 800, color: 0x888888 },
        { name: 'Venus', radius: 40, distance: 1000, color: 0xFFCC99 },
        { name: 'Earth', radius: 50, distance: 1200, color: 0x3399FF },
        { name: 'Mars', radius: 30, distance: 1500, color: 0xFF6666 },
        { name: 'Jupiter', radius: 100, distance: 2000, color: 0xFFCC00 },
        { name: 'Saturn', radius: 85, distance: 2500, color: 0xFFCC99 },
        { name: 'Uranus', radius: 70, distance: 3000, color: 0x99CCFF },
        { name: 'Neptune', radius: 60, distance: 3500, color: 0x6666FF }
    ];

    const planetMeshes = planets.map(planet => {
        return createCelestialBody(planet.radius, planet.color, { x: planet.distance, y: 0, z: 0 });
    });

    return { sun, planetMeshes };
}

// Create the solar system and get the sun and planet meshes
const { sun, planetMeshes } = createSolarSystem();

// Create the star field (make sure this is done before adding solar system)
createStarField();

// Animate the planets and the camera
function animate() {
    requestAnimationFrame(animate);

    const time = Date.now() * 0.001;

    // Orbit planets around the sun
    planetMeshes.forEach((planetMesh, index) => {
        const planet = {
            distance: [800, 1000, 1200, 1500, 2000, 2500, 3000, 3500][index],
            speed: 0.1 / (index + 1)
        };
        const orbitRadius = planet.distance;
        const speed = planet.speed;
        planetMesh.position.x = orbitRadius * Math.cos(time * speed);
        planetMesh.position.z = orbitRadius * Math.sin(time * speed);

        // Ensure planets face the Sun
        planetMesh.lookAt(sun.position);
    });

    // Animate the camera to orbit around the Sun
    const initialCameraDistance = 8000;
    const initialCameraAngle = 0.05;
    camera.position.x = initialCameraDistance * Math.cos(time * initialCameraAngle);
    camera.position.z = initialCameraDistance * Math.sin(time * initialCameraAngle);
    camera.position.y = 1000 * Math.sin(time * 0.1); // Adjust the vertical position to get a better angle
    camera.lookAt(scene.position); // Point camera towards the center of the scene

    renderer.render(scene, camera);
}

animate();

