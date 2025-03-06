// Javascript Cave Viewer
// Author: Noah Synowiec

/*******************
 * Canvas Variables
 *******************/
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
canvas.height = window.innerHeight*3/4;
canvas.width = window.innerWidth*3/5;
canvas.style.borderRadius = "1%";
let scrHeight = canvas.height;
let scrWidth = canvas.width;
let originY = Math.trunc(scrHeight/2)
let originX = Math.trunc(scrWidth/2)
let scale = 1


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
 * Init Survey Data
 *******************/
let surveyData = await readCompassFile("Kepler_Sink_Lineplot.dat") // Farrell_Data_Isolated.dat
await displaySurveyDataTable(surveyData)

/*******************
 * Event Listeners
 *******************/
document.addEventListener("keydown", keyDownHandler)
document.addEventListener("keyup", keyUpHandler)
document.addEventListener("wheel", wheelHandler)
document.addEventListener("mousedown", mouseUpHandler)
document.addEventListener("mouseup", mouseDownHandler)
document.addEventListener("mousemove", mouseMoveHandler)

let wPressed, aPressed, sPressed, dPressed
let leftArrowPressed, rightArrowPressed, upArrowPressed, downArrowPressed
let mousePressed

/*************************
 * Define Animation Loop
 *************************/
// vars to track time
ctx.font = "24px serif", ctx.fillStyle = "orange";
let fps = 0, elapsedFrames = 0, elapsedTime = 0;
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
    drawRectImgData(0, 0, scrWidth, scrHeight, 0, 0, 0);

    move()
    drawLinePlot()

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
    if (wPressed || upArrowPressed) { originY-- }
    if (aPressed || leftArrowPressed) { originX-- }
    if (sPressed || downArrowPressed) { originY++ }
    if (dPressed || rightArrowPressed) { originX++ }
}

/*************************
 * Line Plot Rendering
 *************************/
async function drawLinePlot() {

    let stations = {}
    stations[surveyData.Shots[0].FROM] = {x: originX, y: originY, connections: []}

    surveyData.Shots.forEach(shot => {
        // console.log(`${shot.FROM} => ${shot.TO}`)
        stations[shot.FROM].connections.push(shot.TO)
        if (stations[shot.TO] == undefined) {
            stations[shot.TO] = {x: 0, y: 0, connections: []}
        }

        var dx = shot.LENGTH * Math.cos(toRadians(shot.BEARING)) // dx=r*cos(theta)
        var dy = shot.LENGTH * Math.sin(toRadians(shot.BEARING)) // dx=r*sin(theta)
        stations[shot.TO].x = stations[shot.FROM].x + dx
        stations[shot.TO].y = stations[shot.FROM].y + dy

        if (shot.FLAGS.trim() == "") {
            drawLineImgDataScaled(
                    scale,
                    stations[shot.FROM].x, 
                    stations[shot.FROM].y, 
                    stations[shot.TO].x, 
                    stations[shot.TO].y, 
                    255, 255, 255)
        }
    })

    // console.log(stations)
}

/***************************************
 * Read and parse a Compass (.dat) file
 ***************************************/
async function readCompassFile(filePath) {
    let file = await fetch(filePath)
    let lines = (await file.text()).split("\n")

    let surveyData = {}

    surveyData["Cave"] = lines[0].trim()
    surveyData["Survey_Name"] = lines[1].split(":")[1].trim()
    surveyData["Date"] = lines[2].split(":")[1].replace("COMMENT", "").trim()
    surveyData["Comment"] = lines[2].split(":")[2].trim()
    surveyData["Team"] = lines[4].trim()
    
    surveyData["Settings"] = {}
    let settings = lines[5].trim().split(/: *|  +/)
    for (let i = 0; i < settings.length; i+=2) {
        surveyData["Settings"][settings[i]] = settings[i+1]
    }

    surveyData["Shot_Headers"] = lines[7].trim().split(/\s+/)

    surveyData["Shots"] = []

    lines.slice(9).forEach(line => {
        let shot = {}
        let shotData = line.trim().split(/\s\s+/)

        if (shotData.length <=1) {
            return
        }

        for (let i = 0; i < surveyData["Shot_Headers"].length; i++) {
            switch (surveyData["Shot_Headers"][i]) {
                case "FLAGS":
                    if (!shotData[i]?.includes("#|")) {
                        shot[surveyData["Shot_Headers"][i]] = undefined
                    } else {
                        shot[surveyData["Shot_Headers"][i]] = shotData[i]
                    }
                    break

                case "COMMENTS":
                    if (!shotData[i] && !shotData[i-1]?.includes("#|")) {
                        shot[surveyData["Shot_Headers"][i]] = shotData[i-1]
                    } else if(shotData[i]?.includes("#|")) {
                        shot[surveyData["Shot_Headers"][i]] = undefined
                    } else {
                        shot[surveyData["Shot_Headers"][i]] = shotData[i]
                    }
                    break

                default:
                    shot[surveyData["Shot_Headers"][i]] = shotData[i]
            }

            if (shot[surveyData["Shot_Headers"][i]] == undefined) {
                shot[surveyData["Shot_Headers"][i]] = ""
            }
        }

        surveyData["Shots"].push(shot)
    })

    return surveyData
}

/***************************************
 * Display survey data as an HTML table
 ***************************************/
async function displaySurveyDataTable(surveyData) {
    const table = document.getElementById("dataTable")

    const tableHeader = table.getElementsByTagName('thead')[0];
    const tableBody = table.getElementsByTagName('tbody')[0];

    tableHeader.innerHTML = ""
    const headerRow = tableHeader.insertRow()
    await surveyData["Shot_Headers"].forEach(key => {
        headerRow.innerHTML += `<th>${key}</th>`;
    });
    
    tableBody.innerHTML = ""
    await surveyData["Shots"].forEach(shot => {
        const newRow = tableBody.insertRow()
        surveyData["Shot_Headers"].forEach(key => {
            newRow.innerHTML += `<td contenteditable="true">${shot[key]}</td>`;
        });
    });
}
 
/*******************************************
 * Convert an angle from degrees to radians
 *******************************************/
function toRadians(angle) {
    return (angle-90) * (Math.PI / 180);
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
            var off = j*4*scrWidth + i*4
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

    // console.log(`Line from (${x1}, ${y1}) => (${x2}, ${y2})`)

    var angle = Math.atan2(x2-x1, y2-y1);

    if (!(-Math.PI/4 < angle && angle <= Math.PI * (3/4))) {
        var tx=x1, x1=x2, x2=tx;
        var ty=y1; y1=y2, y2=ty;
    }

    // handle div/0
    if (x1-x2 == 0) { 
        x2 = x1+1
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

function drawLineImgDataScaled(scale, x1, y1, x2, y2, r, g, b) {
    drawLineImgData(x1*scale, y1*scale, x2*scale, y2*scale, r, g, b)
}

/**********************
 * Listener Functions
 **********************/
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
}

function wheelHandler(e) {
    if (e.deltaY > 0) {
        scale *= 11/10
    } else if (e.deltaY < 0) {
        scale *= 10/11
    }
}

function mouseDownHandler(e) {
    mousePressed = false
}

function mouseUpHandler(e) {
    mousePressed = true
}

function mouseMoveHandler(e) {
    if (mousePressed) {
        originX += e.movementX
        originY += e.movementY
    }
}