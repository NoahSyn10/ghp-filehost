const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const player = {
    x: canvas.width / 2,
    y: 100,
    width: 30,
    height: 30,
    rotation: 270, // Player rotation in degrees
    thrustPower: 0.8,
    dx: 0,
    dy: 0,
    gravity: 0.1,
    damping: 0.97, // Damping factor to slow down the player gradually
    onGround: false
};

const platforms = [
    { x: 0, y: 500, width: 800, height: 50 }, // Ground platform
    { x: 200, y: 400, width: 150, height: 20 }, // Mid-air platform
    { x: 500, y: 300, width: 120, height: 20 }  // Higher platform
];

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.rotation * Math.PI / 180); // Convert degrees to radians
    ctx.fillStyle = 'red';
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
    ctx.restore();
}

function drawPlatforms() {
    ctx.fillStyle = 'brown';
    platforms.forEach(platform => {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });
}

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function newPos() {
    if (!player.onGround) {
        player.dy += player.gravity; // Apply gravity if not on the ground
    }
    
    // Apply damping to reduce velocity gradually
    player.dx *= player.damping;
    player.dy *= player.damping;

    // Update position based on velocity
    player.y += player.dy;
    player.x += player.dx;

    // Wrap around the canvas horizontally
    if (player.x > canvas.width) player.x = 0;
    if (player.x < 0) player.x = canvas.width;

    checkCollisions();
}

function checkCollisions() {
    player.onGround = false;
    platforms.forEach(platform => {
        if (player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y < platform.y + platform.height &&
            player.y + player.height > platform.y) {
            player.dy = 0;
            player.onGround = true;
            player.y = platform.y - player.height; // Place player on top of the platform
        }
    });
}

function update() {
    clear();
    newPos();
    drawPlayer();
    drawPlatforms();
    requestAnimationFrame(update);
}

document.addEventListener('keydown', function(e) {
    switch(e.key) {
        case 'ArrowLeft':
            rotatePlayer(-5);
            break;
        case 'ArrowRight':
            rotatePlayer(5);
            break;
        case ' ':
            applyThrust();
            break;
    }
});

function rotatePlayer(direction) {
    player.rotation += direction;
}

function applyThrust() {
    // Apply thrust in the direction the player is facing, if not on the ground
    if (!player.onGround) {
        player.dx += player.thrustPower * Math.cos(player.rotation * Math.PI / 180);
        player.dy += player.thrustPower * Math.sin(player.rotation * Math.PI / 180);
    }
}

update();
