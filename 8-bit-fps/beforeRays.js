// Javascript Minesweeper
// Author: Noah Synowiec

/*******************
 * Canvas Variables
 *******************/
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
canvas.height = 600;
canvas.width = 1000;
var width = canvas.width;
var height = canvas.height;
var frameRate = 1;

/*******************
 * Init ImageData
 *******************/
var imgdata = ctx.getImageData(0, 0, width, height);
var pixels = imgdata.data;
// set all alphas to 255
for (var i = 0; i < pixels.length; i += 4) {
    pixels[i+3] = 255;
}

/*******************
 * Game Variables
 *******************/
// list of columns containing Uint8ClampedArrays for rows
var columns = [];
for (var col = 0; col < width; col+=1) {
    columns[col] = new Uint8ClampedArray(height*4);
}

// detect click
document.addEventListener("mouseup", mouseUpHandler);
// prevent right click
document.addEventListener("contextmenu", (event) => {
    event.preventDefault();});

const drawInt = setInterval(draw, frameRate);
draw();

function draw() {
    populateCols();
    drawCols();
}

function populateCols() {
    var i, r, g, b;
    for (var col = 0; col < width; col += 1) {
        for (var row = 0; row < height; row += 1) {
            i = row*4;

            r = (row / height) * 255
            g = (col / width) * 255
            b = ((row+col) / (width+height)) * 255
            
            columns[col][i] = r;
            columns[col][i+1] = g;
            columns[col][i+2] = b;
        }
    }
}

function drawCols() {        
    var i, j;
    for (var col = 0; col < width; col += 1) {
        for (var row = 0; row < height; row += 1) {
            // calculate pixel in imagedata
            i = (row * width * 4) + (col * 4)
            j = row*4

            pixels[i]   = columns[col][j];    // r
            pixels[i+1] = columns[col][j+1];  // g
            pixels[i+2] = columns[col][j+2];  // b
        }
    }
    ctx.putImageData(imgdata, 0, 0);
}

function mouseUpHandler(e) {

    var off = (e.offsetY * width + e.offsetX) * 4
    pixels[off] = Math.random() * 255;    // r
    pixels[off+1] = Math.random() * 255;  // g
    pixels[off+2] = Math.random() * 255;  // b

}