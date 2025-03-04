// Javascript Pseudo-3D FPS
// Author: Noah Synowiec

import {Maps} from './Maps.js';
import {Sprite} from './Sprite.js';

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
var zBuffer = new Array(scrWidth * scrHeight);

/*******************
 * Game Variables
 *******************/
// Player attributes
var playerX = 2;    // = 11;
var playerY = 2;    // = 13;
var playerZ = 0;
var currLayer = 0
var playerA = Math.PI * (.25);  // *(2.5);
var playerVA = .5; // vertical angle
var playerFOV = Math.PI/3;

// list of maps corresponding to each layer
var layerList = [];

var maplist = new Maps();
var mapSelection = maplist.map1;
var mapWidth = mapSelection.width;
var mapHeight = mapSelection.height;
var layerCount = mapSelection.layers.length;
var maxDepth = 32;

/*1*/ layerList.push(mapSelection.layers[0]);
/*2*/ layerList.push(mapSelection.layers[1]);
/*3*/ layerList.push(mapSelection.layers[2]);

// The map!
//var maplist = new Maps();
//var mapSelection = maplist.map1;
//var mapWidth = mapSelection[0];
//var mapHeight = mapSelection[1];
//var map = mapSelection[2];
///var floorMap = mapSelection[3];
//var ceilMap = mapSelection[4];

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

var wallMid

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

    currLayer = Math.trunc((playerZ+1)/2);

    drawRectImgData(0, 0, scrHeight, scrWidth, 0, 0, 0);
    zBuffer = new Array(scrHeight*scrWidth)

    move();
    castRays(0);
    castRays(1);
    castRays(2);

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

    ctx.fillText(Math.round(playerZ*100)/100 + ", " + Math.round(wallMid) + " / " + scrHeight, scrWidth-(scrWidth/5), 25)

}

function move() {
    if (currLayer >= 0 && currLayer < layerCount)
        var map = layerList[currLayer].map;
    else    
        var map = null;

    var keyTurnSpeed = 0.002;
    var mouseTurnSpeed = 0.0001;
    var mouseMode = document.pointerLockElement == canvas;
    var moveSpeed = 0.01;
    var verticalMoveSpeed = .0025;
    var strafeSpeed = moveSpeed/2;
    if (sprintPresed) {
        moveSpeed *= 2; 
        strafeSpeed *= 2; 
        keyTurnSpeed*= 2;
        mouseTurnSpeed *= 2;
    }
    var dx, dy, dz, da;

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
        if (!coordsInWall(map, playerX + dx, playerY)) 
            playerX += dx;
        if (!coordsInWall(map, playerX, playerY + dy)) 
            playerY += dy;
    }
    if (sPressed) { // back
        dx = -Math.sin(playerA) * moveSpeed * elapsed;
        dy = -Math.cos(playerA) * moveSpeed * elapsed;
        if (!coordsInWall(map, playerX + dx, playerY)) 
            playerX += dx;
        if (!coordsInWall(map, playerX, playerY + dy)) 
            playerY += dy;
    }
    if (aPressed) { // left
        dx = -Math.cos(playerA) * strafeSpeed * elapsed;
        dy = Math.sin(playerA) * strafeSpeed * elapsed;
        if (!coordsInWall(map, playerX + dx, playerY)) 
            playerX += dx;
        if (!coordsInWall(map, playerX, playerY + dy)) 
            playerY += dy;
    }
    if (dPressed) { // right
        dx = Math.cos(playerA) * strafeSpeed * elapsed;
        dy = -Math.sin(playerA) * strafeSpeed * elapsed;
        if (!coordsInWall(map, playerX + dx, playerY)) 
            playerX += dx;
        if (!coordsInWall(map, playerX, playerY + dy)) 
            playerY += dy;
    }
    // Vertical movement
    if (spacePressed) {
        dz = verticalMoveSpeed * elapsed
        playerZ += dz;
        var dLayer = Math.trunc((playerZ+1)/2);
        if (dLayer >= 0 && dLayer < layerCount && coordsInWall(layerList[dLayer].map, playerX, playerY)) {
            playerZ -= dz
        }
    }
    if (shiftPressed) {
        dz = -verticalMoveSpeed * elapsed
        playerZ += dz;
        var dLayer = Math.trunc((playerZ+1)/2);
        if (dLayer >= 0 && dLayer < layerCount && coordsInWall(layerList[dLayer].map, playerX, playerY)) {
            playerZ -= dz
        }
    }
}

// cast a ray using DDA for each column of pixels
function castRays(layerNum) {
    // get map
    var currMap = layerList[layerNum];
    var map = currMap.map;
    var floorMap = currMap.floor;
    var ceilMap = currMap.ceiling;

    // layer height based on layer and playerZ
    var layerHeight = playerZ - layerNum*2;
    // detect if player is in layer
    var playerAboveLayer = layerHeight >= 1
    var playerBelowLayer = -1 >= layerHeight
    var playerInLayer = !playerAboveLayer && !playerBelowLayer
    var maxWallLineHeight = scrHeight/maxDepth;

    for (var col = 0; col < scrWidth; col += 1) { 
        var rayAngle = (playerA - playerFOV/2) + (col/scrWidth) * playerFOV;    // ray angle
        var eyeX = Math.sin(rayAngle), eyeY = Math.cos(rayAngle);               // unit vector
        var fisheyeCoeff = Math.cos(rayAngle - playerA);                        // fisheye correction coefficient 
        var viewMidPoint = scrHeight*playerVA                                   // midpoint serves as starting point for drawing
        wallMid = viewMidPoint  // temp var to write midpoint

        var xRayUnitStep = Math.sqrt(1 + (eyeY/eyeX)**2);               // hypotenuse for step of x+=1
        var yRayUnitStep = Math.sqrt(1 + (eyeX/eyeY)**2);               // hypotenuse for step of y+=1
        var testX = Math.trunc(playerX), testY = Math.trunc(playerY);   // init test coords at players location
        var xStep, yStep;                                               // track step direction of each ray
        var xRayLen, yRayLen;                                           // track length of each ray

        var hitWall = false, wallType = 0;              // track if a wall is hit and save the wall's type
        var distance = 0, range = 0;                    // range is distance corrected for fisheye (after distance found)                        
        var testingXray = false, testingYray = false;   // track ray being tested to determine the axis which is hit

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

        while (!(playerInLayer && hitWall) && distance < maxDepth) {
            // walk along shortest ray
            if (xRayLen <= yRayLen) {
                testingXray = true, testingYray = false;    // xRay being tested
                testX += xStep;                             // step x by 1 in chosen direction
                distance = xRayLen;                         // set old distance to xRaylen 
                xRayLen += xRayUnitStep;                    // increment xRayLen by 1 xRayUnitStep
            } else {
                testingXray = false, testingYray = true;
                testY += yStep;
                distance = yRayLen;
                yRayLen += yRayUnitStep;
            }
            if (distance > maxDepth) distance = maxDepth;             
            
            // test for collision
            if (coordsInWall(map, testX, testY) || distance >= maxDepth) {
                hitWall = true;
                wallType = textureList[getCell(map, testX, testY)];
                range = distance * fisheyeCoeff;    // Adjust distance to fix fisheye
            } else continue;
        
            // Draw FOV lines for collision
            //if (col % 10 == 0) 
            //if (col == 0 || col == Math.trunc(scrWidth/2) || col == scrWidth-1)
            //    drawLineImgData(playerY * miniCellSize, playerX * miniCellSize, playerY*miniCellSize + eyeY * distance * miniCellSize, playerX*miniCellSize + eyeX * distance * miniCellSize, 0 , 255, 0);

            var hitX = playerX + eyeX * distance, hitY = playerY + eyeY * distance; // precise collision coords
            var sampleX, sampleY;   // normalized texture sampling coords
            
            // determine side of cell hit, get normalized sampleX coord in that plane
            if (testingXray) {
                if (xStep > 0) {
                    if (coordsInWall(map, testX-1, testY)) continue; // if wall faces another wall, exit draw routine
                    sampleX = 1 - hitY + Math.trunc(hitY);
                } else {
                    if (coordsInWall(map, testX+1, testY)) continue;
                    sampleX = hitY - Math.trunc(hitY);
                }
            } else if (testingYray) {
                if (yStep > 0) {
                    if (coordsInWall(map, testX, testY-1)) continue;
                    sampleX = hitX - Math.trunc(hitX);
                } else {
                    if (coordsInWall(map, testX, testY+1)) continue;
                    sampleX = 1 - hitX + Math.trunc(hitX);
                }
            }

            // calculate wall start and end for col based on distance
            var wallLineHeight = scrHeight/range;                                   // height of wall in current column
            var wallStart= viewMidPoint - wallLineHeight + layerHeight*wallLineHeight   // starting row of the wall line
            var wallEnd= viewMidPoint + wallLineHeight + layerHeight*wallLineHeight     // ending row

            /************************************************
             * Draw wall if a closer wall has not been drawn
             ************************************************/
            var rgba = [0, 0, 0, 0];
            /* ?? Why is it slower to do `var row = wallStart` ?? */
            for (var row = 0; row < scrHeight; row += 1) {
                if ((row > wallStart && row <= wallEnd) && 
                    (!zBuffer[row * scrWidth + col] || range < zBuffer[row * scrWidth + col])) {
                    // Set zbuff to mark wall as drawn at depth = 'range'
                    zBuffer[row * scrWidth + col] = range;
                    rgba = [0, 255, 0, 0]
                    
                    var sampleY = (row - wallStart) / (wallLineHeight*2);    // normalized sampleY based on current row
                    if (wallType)
                        rgba = wallType.sample(sampleX, sampleY);

                    var off = row*4*scrWidth + col*4
                    pixels[off] = rgba[0];      // r
                    pixels[off+1] = rgba[1];    // g
                    pixels[off+2] = rgba[2];    // b
                }
            }
        }
        
        /************************************************
         * Draw ceiling and floor when outside of layer
         ************************************************/
        
        var rgba = [0, 0, 0, 0];
        if (layerNum != 0) continue;

        for (var row = 0; row < scrHeight; row += 1) {
            /***************
             * Draw Ceiling
             ***************/
            
            if ((!playerAboveLayer && row < viewMidPoint) || ( playerAboveLayer && row > viewMidPoint)) {
                var ceilDistance = ( ( ( (1-layerHeight) / playerVA ) / ( 1-( (row) / (viewMidPoint) ) ) ) ) / fisheyeCoeff;
                var ceilX = (eyeX * ceilDistance + playerX);    // collision coordinates
                var ceilY = (eyeY * ceilDistance + playerY);
                ceilType = textureList[ceilMap[Math.trunc(ceilX) * mapWidth + Math.trunc(ceilY)]];

                if (((!zBuffer[row * scrWidth + col] && !playerAboveLayer && ceilType) || (playerAboveLayer && layerList[layerNum] && coordsInWall(layerList[layerNum].map, ceilX, ceilY))) &&
                    (0 <= ceilX && ceilX < mapWidth && 0 <= ceilY && ceilY < mapHeight && ceilDistance < maxDepth)) {
                    zBuffer[row * scrWidth + col] = ceilDistance    // mark celing as drawn so floor doesn't override
                    rgba = [255, 0, 0, 0];

                    var ceilSampleX = (ceilX) - Math.trunc(ceilX);  // normalized texture sample coordinates
                    var ceilSampleY = (ceilY) - Math.trunc(ceilY);  
                    
                    var ceilType;
                    if (coordsInWall(layerList[layerNum].map, ceilX, ceilY)) 
                        ceilType = textureList[getCell(layerList[layerNum].map, ceilX, ceilY)];
                    //else 
                    //    ceilType = textureList[ceilMap[Math.trunc(ceilX) * mapWidth + Math.trunc(ceilY)]];
                    
                    if (ceilType)
                        rgba = ceilType.sample(ceilSampleX, ceilSampleY);
                
                    var off = row*4*scrWidth + col*4
                    pixels[off] = rgba[0];      // r
                    pixels[off+1] = rgba[1];    // g
                    pixels[off+2] = rgba[2];    // b
                }
            }
            /***************
             * Draw Floor
             ***************/
            /*
            if ((!playerBelowLayer && row > viewMidPoint) || (playerBelowLayer && row < viewMidPoint)) {
                var floorDistance = ( ( (1 + layerHeight) / playerVA ) / ( ( row-(viewMidPoint) ) / ( viewMidPoint ) ) ) / fisheyeCoeff;
                var floorX = (eyeX * floorDistance + playerX);
                var floorY = (eyeY * floorDistance + playerY);
                if (((!zBuffer[row * scrWidth + col] && !playerBelowLayer) || (playerBelowLayer && coordsInWall(floorX, floorY))) &&
                    (0 <= floorX && floorX < mapWidth && 0 <= floorY && floorY < mapHeight && floorDistance < maxDepth)) {
                    rgba = [0, 0, 255, 0];

                    var floorSampleX = (floorX) - Math.trunc(floorX) ;
                    var floorSampleY = (floorY) - Math.trunc(floorY);

                    var floorType
                    if (coordsInWall(floorX, floorY))
                        floorType = textureList[getCell(floorX, floorY)];
                    else 
                        floorType = textureList[floorMap[Math.trunc(floorX) * mapWidth + Math.trunc(floorY)]];

                    if (floorType)
                        rgba = floorType.sample(floorSampleX, floorSampleY)
                
                    var off = row*4*scrWidth + col*4
                    pixels[off] = rgba[0];      // r
                    pixels[off+1] = rgba[1];    // g
                    pixels[off+2] = rgba[2];    // b
                }
            }*/
        }
    }
}

function drawFOV(r, g, b) {
    if (currLayer >= 0 && currLayer < layerCount)
        var map = layerList[currLayer].map;
    else    
        var map = null;
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

        var miniPlayerX = playerX
        var miniPlayerY = playerY

        // increment ray length until inside of a wall
        while (distanceToWall < maxDepth) {
            distanceToWall += stepLen;
            var testX = Math.trunc((miniPlayerX + eyeX * (distanceToWall)));
            var testY = Math.trunc((miniPlayerY + eyeY * (distanceToWall)));

            var drawX = Math.trunc((miniPlayerX + eyeX * distanceToWall*size));
            var drawY = Math.trunc((miniPlayerY + eyeY * distanceToWall*size));

            if (coordsInWall(map, testX, testY)) {
                break;
            }
            drawRectImgData(Math.trunc(miniPlayerX*(size-1)) + drawX, Math.trunc(miniPlayerY*(size-1)) + drawY, 1, 1, r, g, b);
        }
    }
    return false
}

function drawMiniMap() {
    if (currLayer >= 0 && currLayer < layerCount)
        var map = layerList[currLayer].map;
    else    
        var map = null;
    var size = miniCellSize;
    var r, g, b;

    // draw floor
    r=200, g=220, b=255;
    drawRectImgData(0, 0, mapHeight*size, mapWidth*size, r, g, b);
    // draw FOV
    r=0, g=255, b=0;
    drawFOV(r, g, b);
    // draw player
    r=0, g=100, b=225;
    drawRectImgData((playerX-0.5)*size, (playerY-0.5)*size, size, size, r, g, b);
    // draw player and walls
    for (var col = 0; col < mapWidth; col += 1) {
        for (var row = 0; row < mapHeight; row += 1) {
            if(coordsInWall(map, row, col)) {
                r=255, g=100, b=75;
                drawRectImgData(row*size, col*size, size, size, r, g, b);
            }
        }
    }
    
}

function clickMiniMap(x, y) {
    if (currLayer >= 0 && currLayer < layerCount)
        var map = layerList[currLayer].map;
    else    
        var map = null;
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

function coordsInWall(map, x, y) {
    if (!map) return false;

    var truncX = Math.trunc(x);
    var truncY = Math.trunc(y);
    if ((x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) && 
        map[truncX * mapWidth + truncY] ) {
        return true;
    } else {
        return false;
    }
}

function getCell(map, x, y) {
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