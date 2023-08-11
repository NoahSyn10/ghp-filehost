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

/*******************
 * Game Variables
 *******************/
// Player attributes
var playerX = 2;
var playerY = 2;
var playerA = Math.PI * (.25);
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


var URL = "hdBrickWall.png";
var wallTexture = await Sprite.create(URL);

var URL = "concretePillar.png"
var pillarTexture = await Sprite.create(URL);

var URL = "concreteWall.png"
var concreteWallTexture = await Sprite.create(URL);

var URL = "mossyWall.png";
var mossyBrickTexture = await Sprite.create(URL);

var URL = "712px_colors.png";
var colorTileTexture = await Sprite.create(URL);

var URL = "4ktexture.png";
var fourKtexture = await Sprite.create(URL);


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

    drawRectImgData(0, 0, scrHeight, scrWidth, 0, 0, 0);

    move();
    castRays();
    //OLDcastRays();
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

// cast a ray using DDA for each column of pixels
function castRays() {
    for (var col = 0; col < scrWidth; col += 1) { 
        // calculate ray angle and unit vector
        var rayAngle = (playerA - playerFOV/2) + (col/scrWidth) * playerFOV;
        var eyeX = Math.sin(rayAngle);
        var eyeY = Math.cos(rayAngle);

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
        var distance = 0;
        var wallType = '.';

        // track ray being tested to determine the axis which is hit
        var testingXray = false;
        var testingYray = false;

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
            if (testX >= 0 && testX < mapWidth && testY >= 0 && testY < mapHeight 
                && coordsInWall(testX, testY)) {
                hitWall = true;
                wallType = getCell(testX, testY);
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

        // calculate ceiling and floor sizes for col based on distance
        var ceiling = (scrHeight/2) - scrHeight/distance;
        var floor = scrHeight - ceiling;

        // write ceiling, wall, and floor to column
        for (var row = 0; row < scrHeight; row += 1) {
            var rgba, r, g, b;
            // ceiling
            if (row < ceiling) {
                // calculate the sample coordinates used for ceiling
                var ceilDistance = ( 2/( 1-( (row) / (scrHeight/2) ) ) );

                var ceilX = (eyeX * ceilDistance + playerX);
                var ceilY = (eyeY * ceilDistance + playerY);

                var ceilSampleX = (ceilX) - Math.trunc(ceilX) 
                var ceilSampleY = (ceilY) - Math.trunc(ceilY)

                var ceilType = ceilMap[Math.trunc(ceilX) * mapWidth + Math.trunc(ceilY)];

                if (ceilType == 0)
                    rgba = pillarTexture.sample(ceilSampleX, ceilSampleY)
                if (ceilType == 1)
                    rgba = mossyBrickTexture.sample(ceilSampleX, ceilSampleY)

                r = rgba[0];
                g = rgba[1];
                b = rgba[2];
            // wall
            } else if (row > ceiling && row <= floor) {
                // calculate sampleY based on current row in column
                var sampleY = (row - ceiling) / (floor - ceiling);
                if (wallType == "#")
                    //rgba = wallTexture.sample(sampleX, sampleY);
                    rgba = wallTexture.sample(sampleX, sampleY);
                if (wallType == "P")
                    rgba = fourKtexture.sample(sampleX, sampleY);
                if (wallType == "C")
                    rgba = concreteWallTexture.sample(sampleX, sampleY);
                r = rgba[0];
                g = rgba[1];
                b = rgba[2];
            // floor
            } else {
                // calculate the sample coordinates used for the floor and ceiling
                var floorDistance = ( 2/( ( row-(scrHeight/2) ) / ( scrHeight/2 ) ) );

                var floorX = (eyeX * floorDistance + playerX);
                var floorY = (eyeY * floorDistance + playerY);

                var floorSampleX = (floorX) - Math.trunc(floorX) 
                var floorSampleY = (floorY) - Math.trunc(floorY)

                var floorType = floorMap[Math.trunc(floorX) * mapWidth + Math.trunc(floorY)];

                if (floorType == 0)
                    rgba = mossyBrickTexture.sample(floorSampleX, floorSampleY)
                if (floorType == 1)
                    rgba = colorTileTexture.sample(floorSampleX, floorSampleY)
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

/*
// cast a ray for each column of pixels
function OLDcastRays() {
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
                    //rgba = wallTexture.sample(sampleX, sampleY);
                    rgba = fourKtexture.sample(sampleX, sampleY);
                if (wallType == "P")
                    rgba = pillarTexture.sample(sampleX, sampleY);
                if (wallType == "C")
                    rgba = concreteWallTexture.sample(sampleX, sampleY);
                r = rgba[0];
                g = rgba[1];
                b = rgba[2];

            // floor
            } else {
                //floorShade = (row / scrHeight) * 150;
                //floorShade = ((2/((row-(scrHeight/2)) / (scrHeight/2))) / 10)*255
                //r = floorShade;
                //g = floorShade * .75;
                //b = floorShade * .65;

                
                var floorDistance = ((2/((row-(scrHeight/2)) / (scrHeight/2))));
                sampleX = (eyeX * floorDistance + playerX) - Math.trunc(eyeX * floorDistance + playerX) 
                sampleY = (eyeY * floorDistance + playerY) - Math.trunc(eyeY * floorDistance + playerY)

                var rgba = mossyBrickTexture.sample(sampleX, sampleY)
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
}*/


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
        miniCellSize = parseFloat(e.key);
}

function mouseUpHandler(e) {
    if (e.srcElement.localName == "canvas") {
        clickMiniMap(e.offsetX, e.offsetY);
        mouseX = e.offsetX, mouseY = e.offsetY;
    }
}
