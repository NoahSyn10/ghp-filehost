// Javascript Minesweeper
// Author: Noah Synowiec
import {maps} from './maps.js';

/*******************
 * Canvas Variables
 *******************/
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
canvas.height = window.innerHeight*4/5;
canvas.width = window.innerWidth*4/5;
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
// Player attributes
var playerX = 2;
var playerY = 2;
var playerA = Math.PI * (.25);
var playerFOV = Math.PI/3;
// The map!
var maplist = new maps();
var map = maplist.map1;
var mapWidth = map[0];
var mapHeight = map[1];
map = map[2]
var maxDepth = 64;

// png files
var wallTexture;
// var URL = "walltexture.png";
//var URL = "mossyWall.png";
var URL = "hdBrickWall.png";
await readPng(URL).then(pngData => wallTexture = pngData)

var pillarTexture;
var URL = "concretePillar.png"
await readPng(URL).then(pngData => pillarTexture = pngData)

var concreteWallTexture;
var URL = "concreteWall.png"
await readPng(URL).then(pngData => concreteWallTexture = pngData)

/*******************
 * Event Listeners
 *******************/
// detect click
document.addEventListener("mouseup", mouseUpHandler);
document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);
// prevent right click
document.addEventListener("contextmenu", (event) => {
    event.preventDefault();});
// track key presses
var wPressed, aPressed, sPressed, dPressed ;
var leftArrowPressed, rightArrowPressed;
var sprintPresed;
var mouseX=0, mouseY=0;

ctx.font = "24px serif";
ctx.fillStyle = "orange";
var fps = 0;
var elapsedFrames = 0;
var elapsedTime = 0;

// vars to track time
let start, elapsed, prevTimeStamp;

// step through frames, record elapsed time, call draw()
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
    drawMiniMap();

    drawRectImgData(scrHeight/2, scrWidth/2, 1, 1, 255, 0, 0);
    //drawLineImgData(500, 300, mouseX, mouseY, 0 , 255, 0);

    //writePng(wallTexture);

    ctx.putImageData(imgdata, 0, 0); 

    // calculate and draw framerate
    if (elapsedFrames == 30) {
        fps = Math.trunc((1000/elapsedTime) * elapsedFrames);
        elapsedFrames = 0;
        elapsedTime = 0;
    } else {
        elapsedFrames += 1; 
        elapsedTime += elapsed;
    }
    ctx.fillText(fps + " fps", scrWidth-(scrWidth/15), 25)
}

function readPng(URL) {
    return new Promise(resolve => {
        var tmpCanvas = document.createElement('canvas');
        var tmpCtx = tmpCanvas.getContext('2d');
        var img = new Image();
        img.onload = () => {
            tmpCanvas.width = img.width;
            tmpCanvas.height = img.height;
            tmpCtx.drawImage(img, 0, 0);
            var pngData = tmpCtx.getImageData(0, 0, img.width, img.height);
            resolve(pngData);
        }
        img.src = URL;
    })
}

function writePng(pngData) {
    if (!pngData) return;
    var pngPxls = pngData.data;

    var r, g, b;
    for (var i = 0; i < pngData.width; i += 1) {
        for (var j = 0; j < pngData.height; j += 1) {
            var scrOff = i*4*scrWidth + j*4;
            var pngOff = i*4*pngData.width + j*4;
            
            r = pngPxls[pngOff];
            g = pngPxls[pngOff+1];
            b = pngPxls[pngOff+2];
            var xPrcnt = i / pngData.width;
            var yPrcnt = j / pngData.height;

            //var rgba = samplePng(pngData, xPrcnt, yPrcnt);

            pixels[scrOff]  = r;
            pixels[scrOff+1]  = g;
            pixels[scrOff+2]  = b;

        
            //pixels[off] = 255;
           // pixels[off+1] = 255;
           // pixels[off+2] = 255;
        }
    }
}

function samplePng(pngData, xPrcnt, yPrcnt) {
    var pngPxls = pngData.data;
    var xInd = Math.trunc(pngData.width * xPrcnt);
    var yInd = Math.trunc(pngData.height * yPrcnt);

    var off = yInd*4*pngData.height + xInd*4
    return [pngPxls[off], pngPxls[off+1], pngPxls[off+2], pngPxls[off+3]]
}

function move() {
    var turnSpeed = 0.002;
    var moveSpeed = 0.01;
    var strafeSpeed = moveSpeed/2;
    if (sprintPresed) {
        moveSpeed *= 2; 
        strafeSpeed *= 2; 
        turnSpeed*= 2;
    }
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
        if (!coordsInWall(playerX + dx, playerY)) 
            playerX += dx;
        if (!coordsInWall(playerX, playerY + dy)) 
            playerY += dy;
    }
    if (sPressed) { // back
        dx = -Math.sin(playerA) * moveSpeed * elapsed;
        dy = -Math.cos(playerA) * moveSpeed * elapsed;
        if (!coordsInWall(playerX + dx, playerY)) 
            playerX += dx;
        if (!coordsInWall(playerX, playerY + dy)) 
            playerY += dy;
    }
    if (aPressed) { // left
        dx = -Math.cos(playerA) * strafeSpeed * elapsed;
        dy = Math.sin(playerA) * strafeSpeed * elapsed;
        if (!coordsInWall(playerX + dx, playerY)) 
            playerX += dx;
        if (!coordsInWall(playerX, playerY + dy)) 
            playerY += dy;
    }
    if (dPressed) { // right
        dx = Math.cos(playerA) * strafeSpeed * elapsed;
        dy = -Math.sin(playerA) * strafeSpeed * elapsed;
        if (!coordsInWall(playerX + dx, playerY)) 
            playerX += dx;
        if (!coordsInWall(playerX, playerY + dy)) 
            playerY += dy;
    }
}

// cast a ray for each column of pixels
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

        var sampleX, sampleY;
        var wallType = ".";
        
        // increment ray length until inside of a wall
        while (!hitWall && distanceToWall < maxDepth) {
            distanceToWall += stepLen;
            var testX = (playerX + eyeX * distanceToWall);
            var testY = (playerY + eyeY * distanceToWall);

            if (testX < 0 || testX >= mapWidth || testY < 0 || testY >= mapHeight) {
                //hitWall = true;
                //distanceToWall = maxDepth;
            } else {
                if (coordsInWall(testX, testY)) {
                    hitWall = true;
                    wallType = getCell(testX, testY)

                    var cellMidX = Math.trunc(testX) + 0.5;
                    var cellMidY = Math.trunc(testY) + 0.5;

                    var testAngle = Math.atan2((testY - cellMidY), (testX - cellMidX));

                    if (testAngle >= -Math.PI*(1/4) && testAngle < Math.PI*(1/4)) {
                        sampleX = testY - Math.trunc(testY);
                    }
                    if (testAngle >= Math.PI*(1/4) && testAngle < Math.PI*(3/4)) {
                        sampleX = testX- Math.trunc(testX);
                    }
                    if (testAngle < -Math.PI*(1/4) && testAngle >= -Math.PI*(3/4)) {
                        sampleX = testX - Math.trunc(testX);
                    }
                    if (testAngle >= Math.PI*(3/4) || testAngle < -Math.PI*(3/4)) {
                        sampleX = testY - Math.trunc(testY);
                    }
                }
            }

            
        }
        
        // calculate ceiling and floor sizes for col based on distance
        var ceiling = (scrHeight/2) - scrHeight/distanceToWall;
        var floor = scrHeight - ceiling;

        // shading vars
        var ceilShade;
        var wallShade = 255 - (distanceToWall/maxDepth) * 255
        var floorShade = 0;

        // write ceiling, wall, and floor to column
        for (var row = 0; row < scrHeight; row += 1) {
            var r, g, b;
            // ceiling
            if (row < ceiling) {
                ceilShade = ((scrHeight-(row**1.05)) / scrHeight) * 100;
                r = ceilShade;
                g = ceilShade;
                b = ceilShade;
            // wall
            } else if (row > ceiling && row <= floor) {
                var rgba = [0, 0, 0, 0];
                sampleY = (row - ceiling) / (floor - ceiling);
                if (wallType == "#")
                    rgba = samplePng(wallTexture, sampleX, sampleY)
                if (wallType == "P")
                    rgba = samplePng(pillarTexture, sampleX, sampleY)
                if (wallType == "C")
                    rgba = samplePng(concreteWallTexture, sampleX, sampleY)
                r = rgba[0];
                g = rgba[1];
                b = rgba[2];

            // floor
            } else {
                floorShade = (row / scrHeight) * 150;
                r = floorShade;
                g = floorShade * .75;
                b = floorShade * .65;
            }
            // write column to imagedata
            var off = row*4*scrWidth + col*4
            pixels[off] = r;
            pixels[off+1] = g;
            pixels[off+2] = b;
        }
    }
}

function drawFOV(r, g, b) {
    // calculate ray angle and unit vector
    var size = miniMapCellSize;
    var granularity = 64;
    for (var i = 0; i < granularity; i += 1) {
        var rayAngle = (playerA - playerFOV/2) + (i/granularity) * playerFOV;
        var eyeX = Math.sin(rayAngle);
        var eyeY = Math.cos(rayAngle);

        // vars to track ray
        var distanceToWall = 1;
        var stepLen = 2/size;

        var miniPlayerX = Math.trunc(playerX) + .5
        var miniPlayerY = Math.trunc(playerY) + .5

        
        // increment ray length until inside of a wall
        while (distanceToWall < maxDepth) {
            distanceToWall += stepLen;
            var testX = Math.trunc((miniPlayerX + eyeX * (distanceToWall)));
            var testY = Math.trunc((miniPlayerY + eyeY * (distanceToWall)));

            var drawX = Math.trunc((miniPlayerX + eyeX * distanceToWall*size));
            var drawY = Math.trunc((miniPlayerY + eyeY * distanceToWall*size));

            if (coordsInWall(testX, testY)) {
                /** Draw with lines? *
                distanceToWall -= stepLen;
                
                var drawX = Math.trunc((eyeX * (distanceToWall*(size))));
                var drawY = Math.trunc((eyeY * (distanceToWall*(size))));

                var startX = Math.trunc(miniPlayerX*(size));
                var startY = Math.trunc(miniPlayerY*(size));

                drawLineImgData(startY, startX, startY + drawY, startX + drawX, r, g, b);
                /** */
                break;
            }
            drawRectImgData(Math.trunc(miniPlayerX*(size-1)) + drawX, Math.trunc(miniPlayerY*(size-1)) + drawY, 1, 1, r, g, b);
        }
    }
    return false
}

function drawMiniMap() {
    var size = miniMapCellSize;
    var r, g, b;

    // draw floor
    r=200, g=220, b=255;
    drawRectImgData(0, 0, mapHeight*size, mapWidth*size, r, g, b);
    // draw FOV
    r=0, g=255, b=0;
    drawFOV(r, g, b);
    // draw player
    r=0, g=100, b=225;
    drawRectImgData(Math.trunc(playerX)*size, Math.trunc(playerY)*size, size, size, r, g, b);
    // draw player and walls
    for (var col = 0; col < mapWidth; col += 1) {
        for (var row = 0; row < mapHeight; row += 1) {
            if(coordsInWall(row, col)) {
                r=255, g=100, b=75;
                drawRectImgData(row*size, col*size, size, size, r, g, b);
            }
        }
    }
    
}

function clickMiniMap(x, y) {
    var size = miniMapCellSize;
    var cellX = Math.trunc(x/size);
    var cellY = Math.trunc(y/size);
    var repl;

    if  (cellX >= 0 && cellX < mapWidth && cellY >= 0 && cellY < mapHeight) {
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
    if (!(x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) && 
        map[truncX * mapWidth + truncY] != ".") {
        return true;
    } else {
        return false;
    }
}

function getCell(x, y) {
    var truncX = Math.trunc(x);
    var truncY = Math.trunc(y);
    if (!(x < 0 || x >= mapWidth || y < 0 || y >= mapHeight))
        return map[truncX * mapWidth + truncY];
    return ".";
}

/**************************************************************************************
 * Draw a rectangle to ImgData at x,y with given width and height and given rgb values 
 **************************************************************************************/
function drawRectImgData(x, y, width, height, fr, fg, fb) {
    var off, wr, wb, wg;
    var strokeOn=false, sr=200, sb=200, sg=255;
    x = Math.trunc(x);
    y = Math.trunc(y);
    width = Math.trunc(width);
    height = Math.trunc(height);
    for(var i = x; i < x+width; i += 1) {
        for(var j = y; j < y+height; j += 1) {
            if(strokeOn && (i == x || i == x+width-1 || j == y || j == y+height-1)) {
                wr=sr, wb=sb, wg=sg;
            } else {
                wr=fr, wg=fg, wb=fb
            }
            var off = i*4*scrWidth + j*4
            pixels[off] = wr;
            pixels[off+1] = wg;
            pixels[off+2] = wb;
        }
    }
}

/**************************************************************************************
 * Draw a line to ImgData from x1, y1 to x2, y2 with given rgb values 
 **************************************************************************************/
function drawLineImgData(x1, y1, x2, y2, r, g, b) {
    x1 = Math.trunc(x1); y1 = Math.trunc(y1);
    x2 = Math.trunc(x2); y2 = Math.trunc(y2);

    var angle = Math.atan2(x2-x1, y2-y1);

    if (!(-Math.PI/4 < angle && angle <= Math.PI * (3/4))) {
        var tx=x1, x1=x2, x2=tx;
        var ty=y1; y1=y2, y2=ty;
    }

    var slope = (y1-y2)/(x1-x2);
    var yint = (x1*y2 - x2*y1)/(x1-x2);

    if (Math.abs(x2-x1) >= Math.abs(y2-y1)) {
        for (var x = x1; x < x2; x +=1) {
            //var off = y2*4*scrWidth + x*4
            //pixels[off] = r; pixels[off+1] = g; pixels[off+2] = b;

            var y = Math.trunc(x*slope + yint);
            var off = y*4*scrWidth + x*4
            pixels[off] = r;
            pixels[off+1] = g;
            pixels[off+2] = b;
        }
    } else {
        for (var y = y1; y < y2; y +=1) {
            //var off = y*4*scrWidth + x2*4
            //pixels[off] = r; pixels[off+1] = g; pixels[off+2] = b;

            var x = Math.trunc((y - yint)/slope);
            var off = y*4*scrWidth + x*4
            pixels[off] = r;
            pixels[off+1] = g;
            pixels[off+2] = b;
        }
    }
}

function keyDownHandler(e) {
    if (e.key.toLowerCase() == "w") 
        wPressed = true;
    if (e.key.toLowerCase() == "a") 
        aPressed = true;
    if (e.key.toLowerCase() == "s") 
        sPressed = true;
    if (e.key.toLowerCase() == "d") 
        dPressed = true;
    if (e.key == "ArrowLeft") 
        leftArrowPressed = true;
    if (e.key == "ArrowRight") 
        rightArrowPressed = true;
    if (e.key == "Shift")
        sprintPresed = true;
}

function keyUpHandler(e) {
    if (e.key.toLowerCase() == "w") 
        wPressed = false;
    if (e.key.toLowerCase() == "a") 
        aPressed = false;
    if (e.key.toLowerCase() == "s") 
        sPressed = false;
    if (e.key.toLowerCase() == "d") 
        dPressed = false;
    if (e.key == "ArrowLeft") 
        leftArrowPressed = false;
    if (e.key == "ArrowRight") 
        rightArrowPressed = false;
    if (e.key == "Shift")
        sprintPresed = false;
    if (e.key in ["1","2","3","4","5","6","7","8","9"]) 
        miniMapCellSize = parseFloat(e.key);
}

function mouseUpHandler(e) {
    if (e.srcElement.localName == "canvas") {
        clickMiniMap(e.offsetX, e.offsetY);
        mouseX = e.offsetX, mouseY = e.offsetY;
    }
}
