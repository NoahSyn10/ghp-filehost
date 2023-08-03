// Javascript Minesweeper
// Author: Noah Synowiec

// canvas variables
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
// size canvas based on orientation
if (window.innerWidth < window.innerHeight) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight*4/5;
} else {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight*4/5;
}
let width = canvas.width;
let height = canvas.height;
let frameRate = 100;

// game variables
let grid_size = parseInt(document.getElementById("grid_size").value);
let mine_percentage = parseInt(document.getElementById("mine_percentage").value);
let grid_width = grid_size;
let grid_height = grid_width;
if (grid_width < grid_height) {
    var cell_size = canvas.height / grid_height;
} else {
    var cell_size = canvas.width / grid_width;
}
var cell_size = Math.min(canvas.height / grid_height, canvas.width / grid_width)
var canvas_left_offset = (canvas.width - (cell_size*grid_width))/2
var canvas_top_offset = (canvas.height - (cell_size*grid_height))/2
var reverseClick = false;

console.log(canvas.width, canvas.height)
console.log(cell_size*grid_width, cell_size*grid_height)
console.log(canvas_left_offset, canvas_top_offset)

let percent_fill = mine_percentage/100;
let grid = []


// prevent right click
document.addEventListener("contextmenu", (event) => {
    event.preventDefault();});

// set event listeners and begin draw loop
document.addEventListener("mouseup", mouseUpHandler);
document.getElementById("refreshBtn").addEventListener("click", refresh);
const drawInt = setInterval(draw, frameRate);
draw();

function refresh() {
    // size canvas based on orientation
    if (window.innerWidth < window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight*4/5;
    } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight*4/5;
    }
    width = canvas.width;
    height = canvas.height;
    frameRate = 100;

    // game variables
    grid_size = parseInt(document.getElementById("grid_size").value);
    mine_percentage = parseInt(document.getElementById("mine_percentage").value);
    grid_width = grid_size;
    grid_height = grid_width;

    var cell_size = Math.min(canvas.height / grid_height, canvas.width / grid_width)
    var canvas_left_offset = canvas.width - (cell_size*grid_width)/2
    var canvas_top_offset = canvas.height - (cell_size*grid_height)

    percent_fill = mine_percentage/100;
    grid = []

    // generate grid before beginning execution
    generateGrid();
}

function generateGrid() {
    for (let row = 0; row < grid_width; row++) {    // loop through grid
        grid.push([]);
        for (let col = 0; col< grid_height; col++) {
            const cell = new Cell(row, col);        // initialize cells and push
            grid[row].push(cell);

            if (Math.random() < percent_fill) {     // set percent_fill cells to mines
                grid[row][col].is_mine = true;
            }
        }
    }

    for (let row = 0; row < grid_width; row++) {    // loop through grid
        for (let col = 0; col< grid_height; col++) {
            const curr_cell = grid[row][col];       // get cell from grid
            
            if (!curr_cell.is_mine) {
                for (let i = -1; i <= 1; i++) {     // loop through cells around curr_cell
                    for (let j = -1; j <=1; j++) {
                                                    // if within range and cell is mine, increment curr_cell num
                        if (0 <= row+i && row+i < grid_width && 0 <= col+j && col+j < grid_height) {
                            if (grid[row + i][col + j].is_mine) {
                                curr_cell.cell_num++;      
                            }
                        }
                    }
                }
            }
        }
    }
}

// looped function that handles the drawing of each frame
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)           

    for (let row = 0; row < grid_width; row++) {        // loop through whole grid
        for (let col = 0; col < grid_height; col++) {
            const cell = grid[row][col];                // get cell from grid
            
            cell.drawSelf();                            // draw cell
        }
    }
}

// handle the mouse click event
function mouseUpHandler(e) {
    if (e.button == 0) {
        if (e.button == 0) {
            if (reverseClick) { flag(e.offsetX, e.offsetY); }
            else              { click(e.offsetX, e.offsetY); }
            
        } else if (e.button == 2) {
            if (reverseClick) { click(e.offsetX, e.offsetY); }
            else              { flag(e.offsetX, e.offsetY); }
        }
    }
}