export const Fire = {
    init: function() {
        let canvas = document.getElementById("fire");
        let ctx = canvas.getContext('2d');
        let width = canvas.width;
        let height = canvas.height;
        let pixelSize = 1;
        let fireWidth = Math.floor(width/pixelSize);
        let fireHeight = Math.floor(height/pixelSize);

        let colors = [
            [7,7,7],
            [31,7,7],
            [47,15,7],
            [71,15,7],
            [87,23,7],
            [103,31,7],
            [119,31,7],
            [143,39,7],
            [159,47,7],
            [175,63,7],
            [191,71,7],
            [199,71,7],
            [223,79,7],
            [223,87,7],
            [215,95,7],
            [215,103,15],
            [207,111,15],
            [207,119,15],
            [207,127,15],
            [207,135,23],
            [199,135,23],
            [199,143,23],
            [199,151,31],
            [191,159,31],
            [191,167,39],
            [191,175,47],
            [183,183,47],
            [183,183,55],
            [223,223,159],
            [239,239,159],
            [255,255,255]
        ];
  
        let pixels = [];

        let createData = function() {
            let dimension = fireWidth * fireHeight;
            for(let i = 0; i < dimension; i += 1) {
                pixels[i] = 0;
            }
        }

        let createSource = function() {
            for(let column = 0; column <= fireWidth; column += 1) {
                let overflow = fireWidth * fireHeight;
                let index = (overflow - fireWidth) + column;
                pixels[index] = colors.length-1;
            }
        }

        let updateIntensity = function (pixelIndex) {
            let pixel = pixelIndex + fireWidth;
            if(pixel >= (fireWidth * fireHeight)) {
                return;
            }

            let decay = Math.floor(Math.random() * 3);
            let pixelIntensity = pixels[pixel];
            let nextIntensity = pixelIntensity - decay;
            let intensity = nextIntensity >= 0 ? nextIntensity : 0;
            
            pixels[pixelIndex-decay] = intensity;

            // switch(wind) {
            //     case 0: firePixels[pixelIndex-decay] = intensity; break;
            //     case 1: firePixels[pixelIndex] = intensity; break;
            //     case 2: firePixels[pixelIndex+decay] = intensity; break;
            //     default:
            //         break;
            // }
        }

        let render = function() {
            for(let row = 0; row < fireHeight; row += 1) {
                for(let column = 0; column < fireWidth; column += 1) {
                    let index = column + (fireWidth * row);
                    let intensity = pixels[index];
                    let color = colors[intensity];
                    ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},1)`;
                    ctx.fillRect(column*pixelSize, row*pixelSize, pixelSize, pixelSize);
                }
            }
        }

        let update = function() {
            for(let column = 0; column < fireWidth; column += 1) {
                for(let row = 0; row < fireHeight; row += 1) {
                    let index = column + (fireWidth * row);
                    updateIntensity(index);
                }
            }
            render();
        }

        createData();
        createSource();

        let draw = function () {
            update();
            window.requestAnimationFrame(draw);
        }

        window.requestAnimationFrame(draw);
    }
}