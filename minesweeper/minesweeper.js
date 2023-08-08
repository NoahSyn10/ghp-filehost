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

// Cell Class
class Cell {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.is_mine = false;
        this.flagged = false;
        this.clicked = false;
        this.cell_num = 0;
    }

    // get the colors of cell based on its attributes
    getColors() {
        // set colors based on position
        const row_mod = (Math.floor(155 / grid_width)) * this.row + 75
        const col_mod = (Math.floor(155 / grid_height)) * this.col + 75
        const r = row_mod
        const g = Math.floor((row_mod + col_mod) / 4)
        const b = col_mod
        
        // initialize colors as gradient values
        let lighter = `rgb(${r}, ${g}, ${b})`;
        let darker  = `rgb(${Math.floor(r/(5/2))}, ${Math.floor(g/(5/2))}, ${Math.floor(b/(5/2))})`;
        let middle  = `rgb(${Math.floor(r/(5/3))}, ${Math.floor(g/(5/3))}, ${Math.floor(b/(5/3))})`;

        if (this.is_mine && this.clicked) {
            lighter = `rgb(${255}, ${100}, ${100})`;
            darker  = `rgb(${125}, ${25}, ${50})`;
            middle  = `rgb(${225}, ${25}, ${50})`;
        }

        return {"lighter" : lighter,
                "darker"  : darker,
                "middle"  : middle}
    }
    
    // get the vertices of a cell's shapes based on its attributes
    getVertices() {
        // calculate offsets
        const inner_offset = Math.floor(cell_size / 6)
        const border_offset = Math.floor(cell_size / 30)

        // verts for NW outer triangle
        const outer_tri_NW = [[this.row*cell_size              , this.col*cell_size              ], //  ·-·  
                              [this.row*cell_size + cell_size+3, this.col*cell_size              ], //  |/
                              [this.row*cell_size              , this.col*cell_size + cell_size+3]] //  ·

        const outer_tri_SE = [[this.row*cell_size + cell_size+1, this.col*cell_size              ], //    ·
                              [this.row*cell_size + cell_size+1, this.col*cell_size + cell_size+1], //   /|
                              [this.row*cell_size              , this.col*cell_size + cell_size+1]] //  ·-·

        // verts for outer cell square
        const outer_sq = [[this.row*cell_size              , this.col*cell_size              ],     //  · - ·    
                          [this.row*cell_size + cell_size+1, this.col*cell_size              ],     //  |   | 
                          [this.row*cell_size + cell_size+1, this.col*cell_size + cell_size+1],     //  · - · 
                          [this.row*cell_size              , this.col*cell_size + cell_size+1]]     

        const inner_sq = [[outer_sq[0][0] + inner_offset, outer_sq[0][1] + inner_offset],
                          [outer_sq[1][0] - inner_offset, outer_sq[1][1] + inner_offset],
                          [outer_sq[2][0] - inner_offset, outer_sq[2][1] - inner_offset],
                          [outer_sq[3][0] + inner_offset, outer_sq[3][1] - inner_offset]]

        const bordered_sq = [[outer_sq[0][0] + border_offset, outer_sq[0][1] + border_offset],
                             [outer_sq[1][0] - border_offset, outer_sq[1][1] + border_offset],
                             [outer_sq[2][0] - border_offset, outer_sq[2][1] - border_offset],
                             [outer_sq[3][0] + border_offset, outer_sq[3][1] - border_offset]]

        return {"outer_tri_NW" : outer_tri_NW,
                "outer_tri_SE" : outer_tri_SE,
                "outer_sq"     : outer_sq,
                "inner_sq"     : inner_sq,
                "bordered_sq"  : bordered_sq}
    }  

    // handle the drawing of the current cell
    drawSelf() {
        // get vertices and colors
        const vertices = this.getVertices(); 
        const colors = this.getColors();

        // if not clicked, show 3d cell
        if (!this.clicked) {
            drawShapeWithOffset(vertices["outer_tri_NW"], colors["lighter"]); 
            drawShapeWithOffset(vertices["outer_tri_SE"], colors["darker"]); 
            drawShapeWithOffset(vertices["inner_sq"], colors["middle"]); 

        // if clicked, show flat cell
        } else {
            drawShapeWithOffset(vertices["outer_sq"], colors["darker"]); 
            drawShapeWithOffset(vertices["bordered_sq"], colors["middle"]); 
        }

        // if clicked and cell has num > 0, show num
        if (this.clicked && this.cell_num > 0) {
            let x = this.row*cell_size + cell_size / (3.3)
            let y = this.col*cell_size + cell_size / (1.33)

            drawTextWithOffset(this.cell_num, x, y, `${cell_size/(5/3)}px verdana`, "white", "fill");
        }

        // if flagged, show flag
        if (this.flagged) {
            let x = this.row*cell_size + cell_size / (4)
            let y = this.col*cell_size + cell_size / (1.5)

            drawTextWithOffset("🚩", x, y, `${cell_size/(2.5)}px verdana`, "white", "fill");
        }      
        
        // if mine, show mine
        if (this.is_mine && this.clicked) {
            let x = this.row*cell_size + cell_size / (3.3)
            let y = this.col*cell_size + cell_size / (1.5)

            drawTextWithOffset("☼", x, y, `${cell_size/(2.25)}px verdana`, "black", "stroke");
        }        
    }
};

// generate grid before beginning execution
generateGrid();

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

// get cell from grid using offsets
function getCellCoords(x, y) {
    row = Math.floor((x-canvas_left_offset) / cell_size);
    col = Math.floor((y-canvas_top_offset) / cell_size);

    // detect coords out of grid
    if (0 > row || row >= grid_width || 0 > col || col >= grid_height) {
        return -1;
    }

    const cell = grid[row][col]         // get cell from grid
    return cell;
}

// swap right and left click functionality
function swapClick() {
    reverseClick = !reverseClick;
}

// 'click' on the cell corresponding to the mouse's x, y position
function click(x, y) {
    const cell = getCellCoords(x, y)

    if (cell == -1) {   // if coords are out of grid, handle and return
        swapClick();
    }   

    if (cell.flagged || cell.clicked) { // return if clicked or flagged
        return;
    }

    cell.clicked = true;                // set cell to clicked

    // if 0-cell, reveal neighboring 0-cells
    if (cell.cell_num == 0 && !cell.is_mine) {
        reveal_block(cell);
    }
}

// flag the cell corresponding to the mouse's x, y position
function flag(x, y) {
    const cell = getCellCoords(x, y);

    if (cell == -1) {   // if coords are out of grid, handle and return
        swapClick();
    }   

    if (cell.clicked) {                 // ignore if clicked
        return;
    }

    cell.flagged = !cell.flagged;       // toggle flagged
}

// detext neighboring 0-cells and "click" them all"
function reveal_block(cell) {
    cell.clicked = true     // click cell
    cell.flagged = false    // unflag

    // loop through cells around current cell
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <=1; j++) {
            // if within range and cell is 0-cell, click
            if (0 <= cell.row+i && cell.row+i < grid_height && 0 <= cell.col+j && cell.col+j < grid_width) {
                let neighbor = grid[cell.row + i][cell.col + j];
                if (neighbor.clicked) {
                    continue;               // ignore if clicked
                } else if (neighbor.cell_num == 0) {
                    reveal_block(neighbor); // continue recursion if 0-cell
                } else if (!neighbor.flagged) {
                    neighbor.clicked = true // just click if not 0-cell or flagged
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

    if (canvas.width<canvas.height) {
        var x = (canvas.width/2.15);
        var y = (canvas_top_offset/3) * -1;
    } else {
        var x = (grid_width*cell_size) + (canvas_left_offset/3);
        var y = (canvas.height/1.9);
    }
    
    // draw click type symbol
    if (reverseClick) {
        drawTextWithOffset("👉", x, y, `${cell_size/1.5}px verdana`, "white", "fill")
    } else {
        drawTextWithOffset("🚩", x, y, `${cell_size/1.5}px verdana`, "white", "fill")
    }
}

// draw a shape using the given vertices and color
// offset using calculated left and top canvas offset
function drawShapeWithOffset(vertexList, color) {
    ctx.beginPath();

    ctx.moveTo(vertexList[0][0] + canvas_left_offset, vertexList[0][1] + canvas_top_offset)
    for (let i = 1; i < vertexList.length; i++) {
        ctx.lineTo(vertexList[i][0] + canvas_left_offset, vertexList[i][1] + canvas_top_offset);
    }
    ctx.fillStyle = color;
    ctx.fill();
}

// draw text using the given font and fill/stroke
// offset using calculated left and top canvas offset
function drawTextWithOffset(text, x, y, font, color, style) {
    x += canvas_left_offset;
    y += canvas_top_offset;
    ctx.font = font;
    if (style == "fill") {
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
    } else if (style == "stroke") {
        ctx.strokeStyle = color;
        ctx.strokeText(text, x, y);
    }  
}

// handle the mouse click event
function mouseUpHandler(e) {
    if (e.button == 0) {
        if (reverseClick) { flag(e.offsetX, e.offsetY); }
        else              { click(e.offsetX, e.offsetY); }
        
    } else if (e.button == 2) {
        if (reverseClick) { click(e.offsetX, e.offsetY); }
        else              { flag(e.offsetX, e.offsetY); }
    }
}