let scene, camera, renderer, cube;

function init() {
    // Create the scene and a camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement); // Make sure the canvas is added to the body

    // Create a cube
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Set the camera position
    camera.position.z = 5;

    // Render the scene
    renderer.render(scene, camera);

    // Add event listeners for user input
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', onDocumentKeyDown, false);
}

function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

function onDocumentKeyDown(event) {
    var keyCode = event.which;
    if (keyCode == 87) camera.position.z -= 0.5; // W key
    if (keyCode == 83) camera.position.z += 0.5; // S key
    if (keyCode == 65) cube.rotation.y -= 0.1;    // A key
    if (keyCode == 68) cube.rotation.y += 0.1;    // D key
    render();
}

function render() {
    renderer.render(scene, camera);
}

init();
animate();
