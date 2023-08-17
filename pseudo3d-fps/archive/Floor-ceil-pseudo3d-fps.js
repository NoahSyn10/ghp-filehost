// Javascript Pseudo-3D FPS
// Author: Noah Synowiec

import {Maps} from '../Maps.js';
import {Sprite} from '../Sprite.js';

/*******************
 * Canvas Variables
 *******************/
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
canvas.height = window.innerHeight*4/5;
canvas.width = window.innerWidth*4/5;
var scrHeight = canvas.height;
var scrWidth = canvas.width;
var miniCellSize = 4;

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
var playerX = 2;    // = 11;
var playerY = 2;    // = 13;
var playerZ = 0;
var playerA = Math.PI * (.25);  // *(2.5);
var playerVA = .5; // vertical angle
var playerFOV = Math.PI/3;
// The map!
var maplist = new Maps();
var mapSelection = maplist.map1;
var mapWidth = mapSelection[0];
var mapHeight = mapSelection[1];
var map = mapSelection[2];
var floorMap = mapSelection[3];
var ceilMap = mapSelection[4];
var maxDepth = 64;

// png files
// var URL = "walltexture.png";

var textureList = [null];

/*1*/ textureList.push(await Sprite.create("concretePillar.png"));

/*2*/ textureList.push(await Sprite.create("mossyWall.png"));

/*3*/ textureList.push(await Sprite.create("hdBrickWall.png"));

/*4*/ textureList.push(await Sprite.create("concreteWall.png"));

/*5*/ textureList.push(await Sprite.create("712px_colors.png"));

/*6*/ textureList.push(await Sprite.create("4ktexture.png"));

/*******************
 * Event Listeners
 *******************/
// detect click
document.addEventListener("mouseup", mouseUpHandler);
document.addEventListener("mousemove", mouseMoveHandler);
document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);
// trap mouse in canvas
canvas.addEventListener("click", async () => {
    await canvas.requestPointerLock();
  });
// prevent right click
document.addEventListener("contextmenu", (event) => {
    event.preventDefault();});
// track key presses
var wPressed, aPressed, sPressed, dPressed ;
var leftArrowPressed, rightArrowPressed, upArrowPressed, downArrowPressed;
var shiftPressed, spacePressed;
var sprintPresed;
var mouseX=0, mouseY=0, mouseDX=0, mouseDY=0;

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

    drawRectImgData(0, 0, scrHeight, scrWidth, 0, 0, 0);

    move();
    castRays();
    //OLDcastRays();
    drawMiniMap();

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

    ctx.fillText(document.pointerLockElement == canvas, scrWidth-(scrWidth/5), 25)

}

function move() {
    var keyTurnSpeed = 0.002;
    var mouseTurnSpeed = 0.0001;
    var mouseMode = document.pointerLockElement == canvas;
    var moveSpeed = 0.01;
    var verticalMoveSpeed = .5;
    var strafeSpeed = moveSpeed/2;
    if (sprintPresed) {
        moveSpeed *= 2; 
        strafeSpeed *= 2; 
        keyTurnSpeed*= 2;
        mouseTurnSpeed *= 2;
    }
    var dx, dy, da;

    // Look around
    if ((mouseDX < 0 && mouseMode) || (leftArrowPressed && !mouseMode)) {  // turn left
        if (mouseMode) {
            playerA += mouseTurnSpeed * elapsed * mouseDX;
            mouseDX = 0;
        } else {
            playerA -= keyTurnSpeed * elapsed;
        }
    }
    if ((mouseDX > 0 && mouseMode) || (rightArrowPressed && !mouseMode)) { // turn right  
        if (mouseMode) {
            playerA += mouseTurnSpeed * elapsed * mouseDX;
            mouseDX = 0;
        } else {
            playerA += keyTurnSpeed * elapsed;
        }
    }
    if ((mouseDY < 0 && mouseMode) || (upArrowPressed && !mouseMode)) {  // turn left
        if ( mouseMode ) {
            da = mouseTurnSpeed * elapsed * mouseDY;
        } else {
            da = -keyTurnSpeed * elapsed;
        }
        //if (playerVA + da <=2.5)
            playerVA -= da;
        mouseDY = 0;
    }
    if ((mouseDY > 0 && mouseMode) || (downArrowPressed && !mouseMode)) { // turn right  
        if ( mouseMode ) {
            da = mouseTurnSpeed * elapsed * mouseDY;
        } else {
            da = keyTurnSpeed * elapsed;
        }
        //if (playerVA + da >= -1.5)
            playerVA -= da;
        mouseDY = 0;
    }
    // Walk around
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
    /*/ Vertical movement
    if (spacePressed) {
        playerZ += verticalMoveSpeed * elapsed;
    }
    if (shiftPressed) {
        playerZ -= verticalMoveSpeed * elapsed;
    }*/
}

// cast a ray using DDA for each column of pixels
function castRays() {
    for (var col = 0; col < scrWidth; col += 1) { 
        // calculate ray angle and unit vector
        var rayAngle = (playerA - playerFOV/2) + (col/scrWidth) * playerFOV;
        var eyeX = Math.sin(rayAngle);
        var eyeY = Math.cos(rayAngle);

        // coefficient to correct draw distance based on ray angle
        var fisheyeCoeff = Math.cos(rayAngle - playerA);

        // calculate hypotenuse for a step of 1 for x and y
        var xRayUnitStep = Math.sqrt(1 + (eyeY/eyeX)**2);
        var yRayUnitStep = Math.sqrt(1 + (eyeX/eyeY)**2);

        // init test coords at players location
        var testX = Math.trunc(playerX);
        var testY = Math.trunc(playerY);

        // track current length of each ray
        var xRayLen;
        var yRayLen;

        // track step direction for each ray
        var xStep;
        var yStep;

        // set step directions and start each ray at first axis collision
        if (eyeX < 0) {
            xStep = -1;
            xRayLen = (playerX - testX) * xRayUnitStep
        } else {
            xStep = 1;
            xRayLen = (1 - playerX + testX) * xRayUnitStep
        }

        if (eyeY < 0) {
            yStep = -1;
            yRayLen = (playerY - testY) * yRayUnitStep;
        } else {    
            yStep = 1;
            yRayLen = (1 - playerY + testY) * yRayUnitStep;
        }

        var hitWall = false;
        var distance = 0;   // distance from eye to wall
        var range = 0;      // distance from eye 'plane' to wall
        var wallType = '.';

        // track ray being tested to determine the axis which is hit
        var testingXray = false, testingYray = false;

        while (!hitWall && distance < maxDepth) {
            // walk along shortest ray
            if (xRayLen <= yRayLen) {
                testingXray = true, testingYray = false;
                testX += xStep;
                distance = xRayLen;
                xRayLen += xRayUnitStep;
            } else {
                testingXray = false, testingYray = true;
                testY += yStep;
                distance = yRayLen;
                yRayLen += yRayUnitStep;
            }
            // test for collision
            if (//testX >= 0 && testX < mapWidth && testY >= 0 && testY < mapHeight &&
                coordsInWall(testX, testY)) {
                hitWall = true;
                wallType = getCell(testX, testY);
                // Adjust distance to fix fisheye
                range = distance * fisheyeCoeff;
            }
        }
        
        // Draw FOV lines for collision
        //if (col % 10 == 0) 
        //if (col == 0 || col == Math.trunc(scrWidth/2) || col == scrWidth-1)
        //    drawLineImgData(playerY * miniCellSize, playerX * miniCellSize, playerY*miniCellSize + eyeY * distance * miniCellSize, playerX*miniCellSize + eyeX * distance * miniCellSize, 0 , 255, 0);

        // get exact coords of collision
        var hitX = playerX + eyeX * distance;
        var hitY = playerY + eyeY * distance;

        // hold x and y value to sample from texture
        var sampleX;
        var sampleY;
        
        // determine which side of the cell was hit
        // get corresponding x-coord in that plane
        if (testingXray) {
            if (xStep > 0) {
                sampleX = 1 - hitY + Math.trunc(hitY);
            } else {
                sampleX = hitY - Math.trunc(hitY);
            }
        } else if (testingYray) {
            if (yStep > 0) {
                sampleX = hitX - Math.trunc(hitX);
            } else {
                sampleX = 1 - hitX + Math.trunc(hitX);
            }
        }

        // Loop up/down with mouse
        //playerVA = (scrHeight-mouseY)/scrHeight;

        // vertical angle coefficient
        // screen height is divided by the vaCoef
        var vaCoef = 1/(playerVA);

        // calculate ceiling and floor sizes for col based on distance
        var ceiling = (scrHeight/vaCoef) - scrHeight/range;
        var floor = (scrHeight/vaCoef) + scrHeight/range;
        //var floor = scrHeight - ceiling;

        // write ceiling, wall, and floor to column
        for (var row = 0; row < scrHeight; row += 1) {
            var rgba = [0, 0, 0, 0], r, g, b;
            // ceiling
            if (row < ceiling) {
                rgba = [255, 0, 0, 0]
                // calculate the sample coordinates used for ceiling
                
                var ceilDistance = ( vaCoef/( 1-( (row) / (scrHeight/vaCoef) ) ) ) / fisheyeCoeff;
                
                var ceilX = (eyeX * ceilDistance + playerX);
                var ceilY = (eyeY * ceilDistance + playerY);
                var ceilSampleX = (ceilX) - Math.trunc(ceilX) 
                var ceilSampleY = (ceilY) - Math.trunc(ceilY)
                
                var ceilType = ceilMap[Math.trunc(ceilX) * mapWidth + Math.trunc(ceilY)];
                rgba = textureList[ceilType].sample(ceilSampleX, ceilSampleY);
                
                r = rgba[0];
                g = rgba[1];
                b = rgba[2];
            // wall
            } else if (row > ceiling && row <= floor) {
                rgba = [0, 255, 0, 0]
                // calculate sampleY based on current row in column
                
                var sampleY = (row - ceiling) / (floor - ceiling);
                rgba = textureList[wallType].sample(sampleX, sampleY);

                r = rgba[0];
                g = rgba[1];
                b = rgba[2];
            // floor
            } else {
                rgba = [0, 0, 255, 0]
                // calculate the sample coordinates used for the floor and ceiling
                
                var floorDistance = ( vaCoef/( ( row-(scrHeight/vaCoef) ) / ( scrHeight/vaCoef ) ) ) / fisheyeCoeff;

                var floorX = (eyeX * floorDistance + playerX);
                var floorY = (eyeY * floorDistance + playerY);
                var floorSampleX = (floorX) - Math.trunc(floorX) 
                var floorSampleY = (floorY) - Math.trunc(floorY)

                var floorType = floorMap[Math.trunc(floorX) * mapWidth + Math.trunc(floorY)];
                rgba = textureList[floorType].sample(floorSampleX, floorSampleY)
                
                r = rgba[0];
                g = rgba[1];
                b = rgba[2];
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
    var size = miniCellSize;
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
                break;
            }
            drawRectImgData(Math.trunc(miniPlayerX*(size-1)) + drawX, Math.trunc(miniPlayerY*(size-1)) + drawY, 1, 1, r, g, b);
        }
    }
    return false
}

function drawMiniMap() {
    var size = miniCellSize;
    var r, g, b;

    // draw floor
    r=200, g=220, b=255;
    drawRectImgData(0, 0, mapHeight*size, mapWidth*size, r, g, b);
    // draw FOV
    r=0, g=255, b=0;
    //drawFOV(r, g, b);
    // draw player
    r=0, g=100, b=225;
    drawRectImgData((playerX-0.5)*size, (playerY-0.5)*size, size, size, r, g, b);
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
    var size = miniCellSize;
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
        map[truncX * mapWidth + truncY]) {
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
    if (e.key == "ArrowUp") 
        upArrowPressed = true;
    if (e.key == "ArrowDown") 
        downArrowPressed = true;
    if (e.key == "Tab")
        sprintPresed = true;
    if (e.key == "Shift")
        shiftPressed = true;
    if (e.key == " ")
        spacePressed = true;
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
    if (e.key == "ArrowUp") 
        upArrowPressed = false;
    if (e.key == "ArrowDown") 
        downArrowPressed = false;
    if (e.key == "Tab")
        sprintPresed = false;
    if (e.key == "Shift")
        shiftPressed = false;
    if (e.key == " ")
        spacePressed = false;
    if (e.key in ["1","2","3","4","5","6","7","8","9"]) 
        miniCellSize = parseFloat(e.key);
}

function mouseMoveHandler(e) {
    if (e.srcElement.localName == "canvas") {
        mouseX = e.offsetX, mouseY = e.offsetY;
        mouseDX += e.movementX, mouseDY += e.movementY;
    }
}

function mouseUpHandler(e) {
    if (e.srcElement.localName == "canvas") {
        clickMiniMap(e.offsetX, e.offsetY);
        mouseX = e.offsetX, mouseY = e.offsetY;
    }
}