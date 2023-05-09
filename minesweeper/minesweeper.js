// Javascript Minesweeper
// Author: Noah Synowiec

// canvas variables
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerHeight*4/5;
canvas.height = window.innerHeight*4/5;
const width = canvas.width;
const height = canvas.height;
const frameRate = 100;

// game variables
const grid_width = 11;
const grid_height = grid_width;
const cell_size = canvas.height / grid_height;
const percent_fill = 0.1;
const grid = []

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
        const row_mod = (Math.floor(155 / grid_width)) * this.row + 50
        const col_mod = (Math.floor(155 / grid_height)) * this.col + 50
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
            drawShape(vertices["outer_tri_NW"], colors["lighter"]); 
            drawShape(vertices["outer_tri_SE"], colors["darker"]); 
            drawShape(vertices["inner_sq"], colors["middle"]); 

        // if clicked, show flat cell
        } else {
            drawShape(vertices["outer_sq"], colors["darker"]); 
            drawShape(vertices["bordered_sq"], colors["middle"]); 
        }

        // if clicked and cell has num > 0, show num
        if (this.clicked && this.cell_num > 0) {
            ctx.font = `${cell_size/(5/3)}px verdana`;
            ctx.fillStyle = "white";
            ctx.fillText(this.cell_num, this.row*cell_size + cell_size / (3.3), this.col*cell_size + cell_size / (1.33));
        }

        // if flagged, show flag
        if (this.flagged) {
            let x = this.row*cell_size + cell_size / (4);
            let y = this.col*cell_size + cell_size / (1.5);
            ctx.font = `${cell_size/(2.5)}px verdana`;
            ctx.fillStyle = "white";
            ctx.fillText("🚩", x,  y);
        }      
        
        // if mine, show mine
        if (this.is_mine && this.clicked) {
            let x = this.row*cell_size + cell_size / (3.3);
            let y = this.col*cell_size + cell_size / (1.5);
            ctx.font = `${cell_size/(2.25)}px verdana`;
            ctx.fillStyle = "white";
            ctx.strokeText("☼", x,  y);
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
//document.getElementById("refreshBtn").addEventListener("click", refresh);
const drawInt = setInterval(draw, frameRate);
draw();

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
                        if (0 <= row+i && row+i < grid_height && 0 <= col+j && col+j < grid_width) {
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

// 'click' on the cell corresponding to the mouse's x, y position
function click(x, y) {
    row = Math.floor(x / cell_size);
    col = Math.floor(y / cell_size);
    const cell = grid[row][col]         // get cell from grid

    cell.clicked = true;                // set cell to clicked
}

// flag the cell corresponding to the mouse's x, y position
function flag(x, y) {
    row = Math.floor(x / cell_size);
    col = Math.floor(y / cell_size);
    const cell = grid[row][col]         // get cell from grid

    cell.flagged = !cell.flagged;       // toggle flagged
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

// draw a shape using the given vertices and color
function drawShape(vertexList, color) {
    ctx.beginPath();

    ctx.moveTo(vertexList[0][0], vertexList[0][1])
    for (let i = 1; i < vertexList.length; i++) {
        ctx.lineTo(vertexList[i][0], vertexList[i][1]);
    }
    ctx.fillStyle = color;
    ctx.fill();
}

// handle the mouse click event
function mouseUpHandler(e) {
    if (e.button == 0) {
        click(e.offsetX, e.offsetY);
    } else if (e.button == 2) {
        flag(e.offsetX, e.offsetY);
    }
}