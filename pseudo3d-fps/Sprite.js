// Sprite Class
// Author: Noah Synowiec

/********************
 * Sprite Class
 * 
 * Takes in an image URL in the constructor, loads the image,
 * and stores the image as an ImageData object (Uint8ClampedArray).
 * Contains methods to utilize the stored sprite.
 ********************/
export class Sprite {
    /*********************************************************************************************
     * Constructor takes in an image URL and pre-loaded imageData
     * Sprite.create() is to be used to asynchronously create a new sprite from an image URL
     *********************************************************************************************/
    constructor(URL, imageData) {
        this.URL = URL;
        this.imageData = imageData;
        this.pixelArray = imageData.data;
        this.width = imageData.width;
        this.height = imageData.height;
    }

    /*********************************************************************************************
     * Create a new Sprite object from an image URL
     * Uses a promise to wait for image.onload before returning the Sprite with loaded imageData
     *********************************************************************************************/
    static async create(URL) {
        // Promise resolves when image loads and image is written to and read from a canvas.
        var promise = new Promise((resolve, reject) => {
            var tmpCanvas = document.createElement('canvas');
            var tmpCtx = tmpCanvas.getContext('2d');
            var img = new Image();
            img.onload = () => {
                tmpCanvas.width = img.width;
                tmpCanvas.height = img.height;
                tmpCtx.drawImage(img, 0, 0);
                var imageData = tmpCtx.getImageData(0, 0, img.width, img.height);
                resolve(imageData);
            }
            img.onerror = () => { reject(); }
            img.src = URL;
        })
        
        // Store promised imageData and create a new Sprite with it
        var imgData;
        await promise.then(imageData => imgData = imageData);
        return new Sprite(URL, imgData);
    }

    /*********************************************************************************************
     * Takes in a x-percentage and a y-percentage and returns a corresponding pixel.
     * For example, sample(0.5, 0.5) will return pixel x=16, y=16 from a 32x32 Sprite.
     * Returns the pixel in array form: [r, g, b, a]
     *********************************************************************************************/
    sample(xPrcnt, yPrcnt) {
        var xInd = Math.trunc(this.width * xPrcnt);
        var yInd = Math.trunc(this.height * yPrcnt);

        if (0 > xInd || xInd >= this.width || 0 > yInd || yInd >= this.height ) {
            return [0, 0, 0, 0];
        }
    
        var off = yInd*4*this.height + xInd*4
        return [this.pixelArray[off],   // r
                this.pixelArray[off+1], // g
                this.pixelArray[off+2], // b
                this.pixelArray[off+3]];// a
    }
}