// Javascript Minesweeper
// Author: Noah Synowiec

/*******************
 * Canvas Variables
 *******************/
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
canvas.height = 600;
canvas.width = 1000;
var scrHeight = canvas.height;
var scrWidth = canvas.width;
var miniMapCellSize = 4;

/*******************
 * Init ImageData
 *******************/
var imgdata = ctx.getImageData(0, 0, scrWidth, scrHeight);
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
for (var col = 0; col < scrWidth; col+=1) {
    columns[col] = new Uint8ClampedArray(scrHeight*4);
}
// Player attributes
var playerX = 8.0;
var playerY = 8.0;
var playerA = 0.0;
var playerFOV = 3.141/3;
// The map!
var map = 
 "################################"+
 "#...............#..............#"+
 "#...............#..............#"+
 "#...............#..............#"+
 "#...............#..............#"+
 "#...............#..............#"+
 "#..............................#"+
 "#..............................#"+
 "#...............#..............#"+
 "#...............#..............#"+
 "#...............#..............#"+
 "#...............#..............#"+
 "#...............#..............#"+
 "#...............#..............#"+
 "#...............#..............#"+
 "#######..##############..#######"+
 "#..............................#"+
 "#..............................#"+
 "#..............................#"+
 "#..............................#"+
 "#..............................#"+
 "#..............................#"+
 "#..............................#"+
 "#..#.#.#.#.#.#.#.#.#.#.#.#.#.#.#"+
 "#..............................#"+
 "#.#.#.#.#.#.#.#.#.#.#.#.#.#.#..#"+
 "#..............................#"+
 "#..#.#.#.#.#.#.#.#.#.#.#.#.#.#.#"+
 "#..............................#"+
 "#.#.#.#.#.#.#.#.#.#.#.#.#.#.#..#"+
 "#..............................#"+
 "################################";
var mapWidth = 32;
var mapHeight = 32;
var maxDepth = 32;


// detect click
document.addEventListener("mouseup", mouseUpHandler);
document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);
// track key presses
var wPressed, aPressed, sPressed, dPressed = false;
var leftArrowPressed, rightArrowPressed = false;

// prevent right click
document.addEventListener("contextmenu", (event) => {
    event.preventDefault();});

//const drawInt = setInterval(draw, frameRate);
//draw();




let start, elapsed, prevTimeStamp;

function step(timeStamp) {
    if (start === undefined) {
        start = timeStamp;
    }
    elapsed = timeStamp - prevTimeStamp;

    if (prevTimeStamp !== timeStamp) {
        draw();
    }

    prevTimeStamp = timeStamp;
    window.requestAnimationFrame(step);
}

window.requestAnimationFrame(step);

function draw() {
    move();
    castRays();
    drawCols();
    drawMiniMap();
    ctx.putImageData(imgdata, 0, 0);
}

function move() {
    var turnSpeed = 0.002;
    var moveSpeed = 0.01;
    var strafeSpeed = moveSpeed/2;
    var dx, dy;

    // rotate
    if (leftArrowPressed) {  // turn left
        playerA -= turnSpeed * elapsed;
    }
    if (rightArrowPressed) { // turn right  
        playerA += turnSpeed * elapsed;
    }
    // walk
    if (wPressed) { // forward
        dx = Math.sin(playerA) * moveSpeed * elapsed;
        dy = Math.cos(playerA) * moveSpeed * elapsed;
        if (!coordsInWall(playerX + dx, playerY + dy)) {
            playerX += dx;
            playerY += dy;
        }
    }
    if (sPressed) { // back
        dx = -Math.sin(playerA) * moveSpeed * elapsed;
        dy = -Math.cos(playerA) * moveSpeed * elapsed;
        if (!coordsInWall(playerX + dx, playerY + dy)) {
            playerX += dx;
            playerY += dy;
        }
    }
    if (aPressed) { // left
        dx = -Math.cos(playerA) * strafeSpeed * elapsed;
        dy = Math.sin(playerA) * strafeSpeed * elapsed;
        if (!coordsInWall(playerX + dx, playerY + dy)) {
            playerX += dx;
            playerY += dy;
        }
    }
    if (dPressed) { // right
        dx = Math.cos(playerA) * strafeSpeed * elapsed;
        dy = -Math.sin(playerA) * strafeSpeed * elapsed;
        if (!coordsInWall(playerX + dx, playerY + dy)) {
            playerX += dx;
            playerY += dy;
        }
    }
}

function castRays() {
    for (var col = 0; col < scrWidth; col += 1) {
        // calculate ray angle and unit vector
        var rayAngle = (playerA - playerFOV/2) + (col/scrWidth) * playerFOV;
        var eyeX = Math.sin(rayAngle);
        var eyeY = Math.cos(rayAngle);

        // vars to track ray
        var distanceToWall = 0;
        var stepLen = 0.025;
        var hitWall = false;
        
        // increment ray length until inside of a wall
        while (!hitWall && distanceToWall < maxDepth) {
            distanceToWall += stepLen;
            var testX = Math.trunc((playerX + eyeX * distanceToWall));
            var testY = Math.trunc((playerY + eyeY * distanceToWall));

            if (testX < 0 || testX >= mapWidth || testY < 0 || testY >= mapHeight) {
                hitWall = true;
                distanceToWall = maxDepth;
            } else {
                if (coordsInWall(testX, testY)) {
                    hitWall = true;
                }
            }
        }
        
        
        // calculate ceiling and floor sizes for col based on distance
        var ceiling = (scrHeight/2) - scrHeight/distanceToWall;
        var floor = scrHeight - ceiling;

        var ceilShade;
        var wallShade = 255 - (distanceToWall/maxDepth) * 255
        var floorShade = 0;

        for (var row = 0; row < scrHeight; row += 1) {
            var r, g, b;
            if (row < ceiling) {
                ceilShade = ((scrHeight-(row**1.05)) / scrHeight) * 100;
                r = ceilShade;
                g = ceilShade;
                b = ceilShade;
            } else if (row > ceiling && row <= floor) {
                r = wallShade;
                g = wallShade;
                b = wallShade;
            } else {
                floorShade = (row / scrHeight) * 150;
                r = floorShade;
                g = floorShade * .75;
                b = floorShade * .65;
            }

            i = row*4;
            columns[col][i] = r;
            columns[col][i+1] = g;
            columns[col][i+2] = b;
        }
    }
}

function drawMiniMap() {
    var size = miniMapCellSize;
    var r, g, b;

     for (var col = 0; col < mapWidth; col += 1) {
        for (var row = 0; row < mapHeight; row += 1) {
            if (Math.trunc(playerY) == col && Math.trunc(playerX) == row) {
                r=0, g=100, b=225;
            }
            else if(coordsInWall(row, col)) {
                r=255, g=100, b=75;
            }
            else if(cellInFOV(row, col)) {
                r=200, g=255, b=200;
            } else {
                r=200, g=220, b=225;
            }
            drawRectImgData(row*size, col*size, size, size, r, g, b);
        }
     }
}

function clickMiniMap(x, y) {
    var size = miniMapCellSize;
    var cellX = Math.trunc(x/size);
    var cellY = Math.trunc(y/size);
    var repl;

    if (cellX >= 0 || cellX < mapWidth || cellY >= 0 || cellY < mapHeight) {
        i = cellY * mapWidth + cellX;
        if (map[i]=="#")
            repl = "."
        else if (map[i]==".")
            repl = "#"
        map = map.substring(0, i) + repl + map.substring(i+1);
    }
}

function coordsInWall(x, y) {
    var truncX = Math.trunc(x);
    var truncY = Math.trunc(y);
    if (map[truncX * mapWidth + truncY] == "#") {
        return true;
    } else {
        return false;
    }
}

function cellInFOV(row, col) {
    // calculate ray angle and unit vector
    var granularity = 8;
    for (var i = 0; i < granularity; i += 1) {
        var rayAngle = (playerA - playerFOV/2) + (i/granularity) * playerFOV;
        var eyeX = Math.sin(rayAngle);
        var eyeY = Math.cos(rayAngle);

        // vars to track ray
        var distanceToWall = 0;
        var stepLen = 0.25;
        
        // increment ray length until inside of a wall
        while (distanceToWall < maxDepth) {
            distanceToWall += stepLen;
            var testX = Math.trunc((playerX + eyeX * distanceToWall));
            var testY = Math.trunc((playerY + eyeY * distanceToWall));

                if (coordsInWall(testX, testY)) {
                    break;
                }
                if (testX == row && testY == col) {
                    return true;
                }
            
        }
    }
    return false
}

function populateCols() {
    var i, r, g, b;
    for (var col = 0; col < scrWidth; col += 1) {
        for (var row = 0; row < scrHeight; row += 1) {
            i = row*4;

            r = (row / scrHeight) * 255
            g = (col / scrWidth) * 255
            b = ((row+col) / (scrWidth+scrHeight)) * 255
            
            columns[col][i] = r;
            columns[col][i+1] = g;
            columns[col][i+2] = b;
        }
    }
}

/**************************************************************************************
 * Draw a rectangle to ImgData at x,y with given width and height and given rgb values 
 **************************************************************************************/
function drawRectImgData(x, y, width, height, r, g, b) {
    var off;
    for(var i = x; i < x+width; i += 1) {
        for(var j = y; j < y+height; j += 1) {
            var off = i*4*scrWidth + j*4
            pixels[off] = r;
            pixels[off+1] = g;
            pixels[off+2] = b;
        }
    }
}

function drawCols() {        
    var i, j;
    for (var col = 0; col < scrWidth; col += 1) {
        for (var row = 0; row < scrHeight; row += 1) {
            // calculate pixel in imagedata
            i = (row * scrWidth * 4) + (col * 4)
            j = row*4

            pixels[i]   = columns[col][j];    // r
            pixels[i+1] = columns[col][j+1];  // g
            pixels[i+2] = columns[col][j+2];  // b
        }
    }
}

function keyDownHandler(e) {
    if (e.key.toLowerCase() == "w") {
        wPressed = true;
    }
    if (e.key.toLowerCase() == "a") {
        aPressed = true;
    }
    if (e.key.toLowerCase() == "s") {
        sPressed = true;
    }
    if (e.key.toLowerCase() == "d") {
        dPressed = true;
    }
    if (e.key == "ArrowLeft") {
        leftArrowPressed = true;
    }
    if (e.key == "ArrowRight") {
        rightArrowPressed = true;
    }
}

function keyUpHandler(e) {
    if (e.key.toLowerCase() == "w") {
        wPressed = false;
    }
    if (e.key.toLowerCase() == "a") {
        aPressed = false;
    }
    if (e.key.toLowerCase() == "s") {
        sPressed = false;
    }
    if (e.key.toLowerCase() == "d") {
        dPressed = false;
    }
    if (e.key == "ArrowLeft") {
        leftArrowPressed = false;
    }
    if (e.key == "ArrowRight") {
        rightArrowPressed = false;
    }
    if (e.key in ["1","2","3","4","5","6","7","8","9"]) {
        miniMapCellSize = parseFloat(e.key);
    }
}

function mouseUpHandler(e) {
    clickMiniMap(e.offsetX, e.offsetY);
}
