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
const imgdata = ctx.getImageData(0, 0, scrWidth, scrHeight);
const pixels = imgdata.data;
// set all alphas to 255
for (let i = 0; i < pixels.length; i += 4) {
    pixels[i+3] = 255;
}

/*******************
 * Init Survey Data
 *******************/
let surveyData = await readCompassFile("Sarah_Furnace_Compass.dat") // Farrell_Data_Isolated.dat
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
ctx.font = "24px serif"; ctx.fillStyle = "orange";
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
function drawLinePlot() {

    let stationData = processSurveyData(surveyData)

    Object.keys(stationData).forEach((station) => {
        stationData[station].connections.forEach((next) => {
            if (stationData[next].flags.trim() == "") {
                drawLineImgDataScaled(
                        scale,
                        stationData[station].x, 
                        stationData[station].y, 
                        stationData[next].x, 
                        stationData[next].y,
                        255, 255, 255)
            }
        })
    })
}

/**
 * Process survey data to station coordinates
 * @param {*} surveyData Survey Data object containing an array of survey shots
 */
function processSurveyData(surveyData) {
    let stationData = {}

    stationData[surveyData.Shots[0].FROM] = {x: originX, y: originY, connections: [], flags: ""}

    let unprocessedShots = processSurveyShots(surveyData.Shots, stationData)

    let prevShotCount = unprocessedShots.length + 1
    while (unprocessedShots.length > 0 && unprocessedShots.length < prevShotCount) {
        console.log(`Reprocessing shots: `, unprocessedShots)
        prevShotCount = unprocessedShots.length
        unprocessedShots = processSurveyShots(unprocessedShots, stationData)
    }

    if (unprocessedShots.length > 0) {
        console.warn(`${unprocessedShots.length} shots could not be processed: `, unprocessedShots)
    }

    return stationData
}

/**
 * Process a list of survey shots to station coordinated.
 * Return a list of shots that could not be processed.
 * @param {*} surveyShots List containing an array of unprocessed survey shots
 * @param {*} stationData Dictionary containing processed stations
 */
function processSurveyShots(surveyShots, stationData) {
    let unprocessedShots = []

    surveyShots.forEach(shot => {
        console.log(`Processing: ${shot.FROM} => ${shot.TO}`)

        if (!stationData[shot.FROM] && !stationData[shot.TO]) {
            console.log(`Delay processing of ${shot.FROM} => ${shot.TO}`)
            unprocessedShots.push(shot)
            return;
        }

        if (stationData[shot.TO] == undefined) {
            stationData[shot.TO] = {x: undefined, y: undefined, connections: [], flags: shot.FLAGS}
            let dx = shot.LENGTH * Math.cos(toRadians(shot.BEARING)) // dx=r*cos(theta)
            let dy = shot.LENGTH * Math.sin(toRadians(shot.BEARING)) // dx=r*sin(theta)
            stationData[shot.TO].x = stationData[shot.FROM].x + dx
            stationData[shot.TO].y = stationData[shot.FROM].y + dy

        } else if (stationData[shot.FROM] == undefined) {
            stationData[shot.FROM] = {x: undefined, y: undefined, connections: [], flags: shot.FLAGS}
            let dx = shot.LENGTH * Math.cos(toRadians(shot.BEARING-180)) // dx=r*cos(theta)
            let dy = shot.LENGTH * Math.sin(toRadians(shot.BEARING-180)) // dx=r*sin(theta)
            stationData[shot.FROM].x = stationData[shot.TO].x + dx
            stationData[shot.FROM].y = stationData[shot.TO].y + dy
        } else {
            console.warn(`Stations ${shot.FROM} and ${shot.TO} are already processed`)
        }

        stationData[shot.FROM].connections.push(shot.TO)
    })

    return unprocessedShots
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
    let settings = lines[5].trim().split(/:\s*\s{2,}/)
    for (let i = 0; i < settings.length; i+=2) {
        surveyData["Settings"][settings[i]] = settings[i+1]
    }

    surveyData["Shot_Headers"] = lines[7].trim().split(/\s+/)

    surveyData["Shots"] = []

    lines.slice(9).forEach(line => {
        let shot = {}
        let shotData = line.trim().split(/\s\s*/)

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
    let off, wr, wb, wg;
    let strokeOn=false, sr=200, sb=200, sg=255;
    x = Math.trunc(x);
    y = Math.trunc(y);
    width = Math.trunc(width);
    height = Math.trunc(height);
    for(let i = x; i < x+width; i += 1) {
        for(let j = y; j < y+height; j += 1) {
            if(strokeOn && (i == x || i == x+width-1 || j == y || j == y+height-1)) {
                wr=sr, wb=sb, wg=sg;
            } else {
                wr=fr, wg=fg, wb=fb
            }
            off = j*4*scrWidth + i*4
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
    let tx, ty

    x1 = Math.trunc(x1); y1 = Math.trunc(y1);
    x2 = Math.trunc(x2); y2 = Math.trunc(y2);

    // console.log(`Line from (${x1}, ${y1}) => (${x2}, ${y2})`)

    let angle = Math.atan2(x2-x1, y2-y1);

    if (!(-Math.PI/4 < angle && angle <= Math.PI * (3/4))) {
        tx=x1; x1=x2; x2=tx;
        ty=y1; y1=y2; y2=ty;
    }

    // handle div/0
    if (x1-x2 == 0) { 
        x2 = x1+1
    }

    let slope = (y1-y2)/(x1-x2);
    let yint = (x1*y2 - x2*y1)/(x1-x2);

    if (Math.abs(x2-x1) >= Math.abs(y2-y1)) {
        for (let x = x1; x < x2; x +=1) {
            //var off = y2*4*scrWidth + x*4
            //pixels[off] = r; pixels[off+1] = g; pixels[off+2] = b;

            let y = Math.trunc(x*slope + yint);
            let off = y*4*scrWidth + x*4
            pixels[off] = r;
            pixels[off+1] = g;
            pixels[off+2] = b;
        }
    } else {
        for (let y = y1; y < y2; y +=1) {
            //var off = y*4*scrWidth + x2*4
            //pixels[off] = r; pixels[off+1] = g; pixels[off+2] = b;

            let x = Math.trunc((y - yint)/slope);
            let off = y*4*scrWidth + x*4
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