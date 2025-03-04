const canvas = document.getElementById('minesweeperCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 10;
const cellSize = canvas.width / gridSize;
const totalMines = 15;

let grid = [];
let gameEnd = false;

function createGrid() {
    for (let i = 0; i < gridSize; i++) {
        grid[i] = [];
        for (let j = 0; j < gridSize; j++) {
            grid[i][j] = {
                x: i * cellSize,
                y: j * cellSize,
                mine: false,
                revealed: false,
                flagged: false,
                adjacentMines: 0
            };
        }
    }
}

function plantMines() {
    let minesPlanted = 0;
    while (minesPlanted < totalMines) {
        let i = Math.floor(Math.random() * gridSize);
        let j = Math.floor(Math.random() * gridSize);
        if (!grid[i][j].mine) {
            grid[i][j].mine = true;
            minesPlanted++;
        }
    }
}

function calculateMines() {
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            if (grid[i][j].mine) {
                continue;
            }
            let mines = 0;
            for (let di = -1; di <= 1; di++) {
                for (let dj = -1; dj <= 1; dj++) {
                    let ni = i + di, nj = j + dj;
                    if (ni >= 0 && ni < gridSize && nj >= 0 && nj < gridSize && grid[ni][nj].mine) {
                        mines++;
                    }
                }
            }
            grid[i][j].adjacentMines = mines;
        }
    }
}

function drawGrid() {
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            ctx.strokeStyle = '#BBB';
            ctx.strokeRect(grid[i][j].x, grid[i][j].y, cellSize, cellSize);
            if (grid[i][j].revealed) {
                if (grid[i][j].mine) {
                    ctx.fillStyle = 'red';
                    ctx.fillRect(grid[i][j].x, grid[i][j].y, cellSize, cellSize);
                } else {
                    ctx.fillStyle = '#DDD';
                    ctx.fillRect(grid[i][j].x, grid[i][j].y, cellSize, cellSize);
                    if (grid[i][j].adjacentMines > 0) {
                        ctx.fillStyle = '#000';
                        ctx.fillText(grid[i][j].adjacentMines, grid[i][j].x + cellSize / 2, grid[i][j].y + cellSize / 2 + 5);
                    }
                }
            }
        }
    }
}

function reveal(x, y) {
    let i = Math.floor(x / cellSize);
    let j = Math.floor(y / cellSize);
    if (grid[i][j].revealed || grid[i][j].flagged) {
        return;
    }
    grid[i][j].revealed = true;
    if (grid[i][j].mine) {
        alert('Game Over!');
        gameEnd = true;
        return;
    }
    if (grid[i][j].adjacentMines === 0) {
        for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
                let ni = i + di, nj = j + dj;
                if (ni >= 0 && ni < gridSize && nj >= 0 && nj < gridSize) {
                    if (!grid[ni][nj].revealed) {
                        reveal(ni * cellSize, nj * cellSize);
                    }
                }
            }
        }
    }
    drawGrid();
}

canvas.addEventListener('click', function (event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (!gameEnd) {
        reveal(x, y);
    }
});

function init() {
    createGrid();
    plantMines();
    calculateMines();
    drawGrid();
}

let snake = {
    body: [{x: 5, y: 5}], // Starting position of the snake
    direction: {x: 1, y: 0} // Initial movement direction
};

function moveSnake() {
    let head = {...snake.body[0]};
    head.x += snake.direction.x;
    head.y += snake.direction.y;

    // Wrap snake around the grid
    head.x = (head.x + gridSize) % gridSize;
    head.y = (head.y + gridSize) % gridSize;

    // Prevent snake from moving onto itself
    for (let part of snake.body) {
        if (head.x === part.x && head.y === part.y) {
            changeSnakeDirection(); // Change direction if moving into itself
            return;
        }
    }

    // Move the snake
    snake.body.unshift(head);
    snake.body.pop();
}

function changeSnakeDirection() {
    let possibleDirections = [
        {x: 1, y: 0}, {x: -1, y: 0},
        {x: 0, y: 1}, {x: 0, y: -1}
    ];

    // Filter out the reverse direction
    possibleDirections = possibleDirections.filter(dir =>
        !(dir.x === -snake.direction.x && dir.y === -snake.direction.y));

    // Randomly pick a new direction
    snake.direction = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
}

function drawSnake() {
    ctx.fillStyle = 'green';
    for (let part of snake.body) {
        ctx.fillRect(part.x * cellSize, part.y * cellSize, cellSize, cellSize);
    }
}

// Extend the game loop to include snake movement
window.setInterval(() => {
    if (!gameEnd) {
        moveSnake();
        drawGrid();
        drawSnake();
    }
}, 300);

// Add snake movement direction changes periodically
window.setInterval(() => {
    changeSnakeDirection();
}, 5000);

// ... (Rest of the existing Minesweeper code)

canvas.addEventListener('click', function (event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (!gameEnd) {
        reveal(x, y);
    }
});

function init() {
    createGrid();
    plantMines();
    calculateMines();
    drawGrid();
    drawSnake(); // Initial draw of the snake
}


init();


