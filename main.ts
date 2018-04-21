/**
* Well known colors for a NeoPixel strip
*/
enum NeoPixelColors {
    //% block=red
    Red = 0xFF0000,
    //% block=orange
    Orange = 0xFFA500,
    //% block=yellow
    Yellow = 0xFFFF00,
    //% block=green
    Green = 0x00FF00,
    //% block=blue
    Blue = 0x0000FF,
    //% block=indigo
    Indigo = 0x4b0082,
    //% block=violet
    Violet = 0x8a2be2,
    //% block=purple
    Purple = 0xFF00FF,
    //% block=white
    White = 0xFFFFFF,
    //% block=black
    Black = 0x000000
}

/**
 * Functions to operate Cubert.
 */
//% weight=5 color=#2699BF icon="\uf110"
namespace cubert {
    /**
     * A NeoPixel strip
     */
    export class Cubert {
        buf: Buffer;
        pin: DigitalPin;
        // TODO: encode as bytes instead of 32bit
        brightness: number;
        start: number; // start offset in LED strip
        _length: number; // number of LEDs

        /**
         * Shows all LEDs to a given color (range 0-255 for r, g, b). 
         * @param rgb RGB color of the LED
         */
        //% blockId="cubert_set_strip_color" block="%strip|show color %rgb=cubert_colors" 
        //% weight=85 blockGap=8
        //% parts="cubert"
        showColor(rgb: number) {
            this.setAllRGB(rgb);
            this.show();
        }

        /**
         * Shows a rainbow pattern on all LEDs. 
         * @param startHue the start hue value for the rainbow, eg: 1
         * @param endHue the end hue value for the rainbow, eg: 360
         */
        //% blockId="cubert_set_strip_rainbow" block="%strip|show rainbow from %startHue|to %endHue" 
        //% weight=85 blockGap=8
        //% parts="cubert"
        showRainbow(startHue: number = 1, endHue: number = 360) {
            if (this._length <= 0) return;

            const saturation = 100;
            const luminance = 50;
            const steps = this._length;
            const direction = HueInterpolationDirection.Clockwise;

            //hue
            const h1 = startHue;
            const h2 = endHue;
            const hDistCW = ((h2 + 360) - h1) % 360;
            const hStepCW = (hDistCW * 100) / steps;
            const hDistCCW = ((h1 + 360) - h2) % 360;
            const hStepCCW = -(hDistCCW * 100) / steps
            let hStep: number;
            if (direction === HueInterpolationDirection.Clockwise) {
                hStep = hStepCW;
            } else if (direction === HueInterpolationDirection.CounterClockwise) {
                hStep = hStepCCW;
            } else {
                hStep = hDistCW < hDistCCW ? hStepCW : hStepCCW;
            }
            const h1_100 = h1 * 100; //we multiply by 100 so we keep more accurate results while doing interpolation

            //sat
            const s1 = saturation;
            const s2 = saturation;
            const sDist = s2 - s1;
            const sStep = sDist / steps;
            const s1_100 = s1 * 100;

            //lum
            const l1 = luminance;
            const l2 = luminance;
            const lDist = l2 - l1;
            const lStep = lDist / steps;
            const l1_100 = l1 * 100

            //interpolate
            if (steps === 1) {
                this.setPixelColor(0, hsl(h1 + hStep, s1 + sStep, l1 + lStep))
            } else {
                this.setPixelColor(0, hsl(startHue, saturation, luminance));
                for (let i = 1; i < steps - 1; i++) {
                    const h = (h1_100 + i * hStep) / 100 + 360;
                    const s = (s1_100 + i * sStep) / 100;
                    const l = (l1_100 + i * lStep) / 100;
                    this.setPixelColor(i, hsl(h, s, l));
                }
                this.setPixelColor(steps - 1, hsl(endHue, saturation, luminance));
            }
            this.show();
        }

        /**
         * Set LED to a given color (range 0-255 for r, g, b). 
         * You need to call ``show`` to make the changes visible.
         * @param pixeloffset position of the NeoPixel in the strip
         * @param rgb RGB color of the LED
         */
        //% blockId="cubert_set_pixel_color" block="%strip|set pixel color at %pixeloffset|to %rgb=cubert_colors" 
        //% blockGap=8
        //% weight=80
        //% parts="cubert" advanced=true
        setPixelColor(pixeloffset: number, rgb: number): void {
            this.setPixelRGB(pixeloffset, rgb);
        }

        /**
         * Set LED at (x, y, z) to a given color (range 0-255 for r, g, b). 
         * You need to call ``show`` to make the changes visible.
         * @param x distance of the LED from the left edge
         * @param y distance of the LED from the bottom edge
         * @param z distance of the LED from the front edge
         * @param rgb RGB color of the LED
         */
        //% blockId="cubert_set_pixel_xyz_color" block="%strip|set pixel color at %x|, %y|, %z|, to %rgb=cubert_colors" 
        //% blockGap=8
        //% weight=80
        //% parts="cubert" advanced=true
        setPixelXYZColor(x: number, y:number, z:number, rgb: number): void {
            this.setPixelRGB(this.getPixelOffset(x, y, z), rgb);
        }
      
        /**
         * Get the offset for an LED at (x, y, z).
         * @param x distance of the LED from the left edge
         * @param y distance of the LED from the bottom edge
         * @param z distance of the LED from the front edge
         */
        //% weight=9 blockId=cubert_get_pixel_offset block="%strip| get pixel offset at %x|, %y|, %z"
        //% advanced=true
        getPixelOffset(x: number, y: number, z: number): number {
            if (z % 2 === 1) {
                x = 7-x;
                }
            if (x % 2 === 1) {
                y = 7-x;
                }
            return z*64+x*8+y;
        }


        /**
         * Send all the changes to the strip.
         */
        //% blockId="cubert_show" block="%strip|show" blockGap=8
        //% weight=79
        //% parts="cubert"
        show() {
            ws2812b.sendBuffer(this.buf, this.pin);
        }

        /**
         * Turn off all LEDs.
         * You need to call ``show`` to make the changes visible.
         */
        //% blockId="cubert_clear" block="%strip|clear"
        //% weight=76
        //% parts="cubert"
        clear(): void {
            const stride = 3;
            this.buf.fill(0, this.start * stride, this._length * stride);
        }

        /**
         * Gets the number of pixels declared on the strip
         */
        //% blockId="cubert_length" block="%strip|length" blockGap=8
        //% weight=60 advanced=true
        length() {
            return this._length;
        }

        /**
         * Set the brightness of the strip. This flag only applies to future operation.
         * @param brightness a measure of LED brightness in 0-255. eg: 255
         */
        //% blockId="cubert_set_brightness" block="%strip|set brightness %brightness" blockGap=8
        //% weight=59
        //% parts="cubert" advanced=true
        setBrightness(brightness: number): void {
            this.brightness = brightness & 0xff;
        }

        /**
         * Apply brightness to current colors using a quadratic easing function.
         **/
        //% blockId="cubert_each_brightness" block="%strip|ease brightness" blockGap=8
        //% weight=58
        //% parts="cubert" advanced=true
        easeBrightness(): void {
            const stride = 3;
            const br = this.brightness;
            const buf = this.buf;
            const end = this.start + this._length;
            const mid = this._length / 2;
            for (let i = this.start; i < end; ++i) {
                const k = i - this.start;
                const ledoffset = i * stride;
                const br = k > mid ? 255 * (this._length - 1 - k) * (this._length - 1 - k) / (mid * mid) : 255 * k * k / (mid * mid);
                serial.writeLine(k + ":" + br);
                const r = (buf[ledoffset + 0] * br) >> 8; buf[ledoffset + 0] = r;
                const g = (buf[ledoffset + 1] * br) >> 8; buf[ledoffset + 1] = g;
                const b = (buf[ledoffset + 2] * br) >> 8; buf[ledoffset + 2] = b;
                if (stride == 4) {
                    const w = (buf[ledoffset + 3] * br) >> 8; buf[ledoffset + 3] = w;
                }
            }
        }

        /**
         * Shift LEDs forward and clear with zeros.
         * You need to call ``show`` to make the changes visible.
         * @param offset number of pixels to shift forward, eg: 1
         */
        //% blockId="cubert_shift" block="%strip|shift pixels by %offset" blockGap=8
        //% weight=40
        //% parts="cubert"
        shift(offset: number = 1): void {
            const stride = 3;
            this.buf.shift(-offset * stride, this.start * stride, this._length * stride)
        }

        /**
         * Rotate LEDs forward.
         * You need to call ``show`` to make the changes visible.
         * @param offset number of pixels to rotate forward, eg: 1
         */
        //% blockId="cubert_rotate" block="%strip|rotate pixels by %offset" blockGap=8
        //% weight=39
        //% parts="cubert"
        rotate(offset: number = 1): void {
            const stride = 3;
            this.buf.rotate(-offset * stride, this.start * stride, this._length * stride)
        }

        /**
         * Set the pin where the cubert is connected, defaults to P0.
         */
        //% weight=10
        //% parts="cubert" advanced=true
        setPin(pin: DigitalPin): void {
            this.pin = pin;
            pins.digitalWritePin(this.pin, 0);
            // don't yield to avoid races on initialization
        }

        /**
         * Estimates the electrical current (mA) consumed by the current light configuration.
         */
        //% weight=9 blockId=cubert_power block="%strip|power (mA)"
        //% advanced=true
        power(): number {
            const stride = 3;
            const end = this.start + this._length;
            let p = 0;
            for (let i = this.start; i < end; ++i) {
                const ledoffset = i * stride;
                for (let j = 0; j < stride; ++j) {
                    p += this.buf[i + j];
                }
            }
            return this.length() / 2 /* 0.5mA per neopixel */
                + (p * 433) / 10000; /* rought approximation */
        }

        private setBufferRGB(offset: number, red: number, green: number, blue: number): void {
            this.buf[offset + 0] = red;
            this.buf[offset + 1] = green;
            this.buf[offset + 2] = blue;
        }

        private setAllRGB(rgb: number) {
            let red = unpackR(rgb);
            let green = unpackG(rgb);
            let blue = unpackB(rgb);

            const br = this.brightness;
            if (br < 255) {
                red = (red * br) >> 8;
                green = (green * br) >> 8;
                blue = (blue * br) >> 8;
            }
            const end = this.start + this._length;
            const stride = 3;
            for (let i = this.start; i < end; ++i) {
                this.setBufferRGB(i * stride, red, green, blue)
            }
        }

        private setPixelRGB(pixeloffset: number, rgb: number): void {
            if (pixeloffset < 0
                || pixeloffset >= this._length)
                return;

            let stride = 3;
            pixeloffset = (pixeloffset + this.start) * stride;

            let red = unpackR(rgb);
            let green = unpackG(rgb);
            let blue = unpackB(rgb);

            let br = this.brightness;
            if (br < 255) {
                red = (red * br) >> 8;
                green = (green * br) >> 8;
                blue = (blue * br) >> 8;
            }
            this.setBufferRGB(pixeloffset, red, green, blue)
        }
    }
    /**
     * Create a new Cubert driver.
     * @param pin the pin where Cubert is connected.
     */
    //% blockId="cubert_create" block="Cubert at pin %pin"
    //% weight=90 blockGap=8
    //% parts="cubert"
    //% trackArgs=0,2
    export function create(pin: DigitalPin): Cubert {
        let cubert = new Cubert();
        let stride = 3;
        cubert.buf = pins.createBuffer(512 * stride);
        cubert.start = 0;
        cubert._length = 512;
        cubert.setBrightness(255)
        cubert.setPin(pin)
        return cubert;
    }

    /**
     * Converts red, green, blue channels into a RGB color
     * @param red value of the red channel between 0 and 255. eg: 255
     * @param green value of the green channel between 0 and 255. eg: 255
     * @param blue value of the blue channel between 0 and 255. eg: 255
     */
    //% weight=1
    //% blockId="cubert_rgb" block="red %red|green %green|blue %blue"
    //% advanced=true
    export function rgb(red: number, green: number, blue: number): number {
        return packRGB(red, green, blue);
    }

    /**
     * Gets the RGB value of a known color
    */
    //% weight=2 blockGap=8
    //% blockId="cubert_colors" block="%color"
    //% advanced=true
    export function colors(color: NeoPixelColors): number {
        return color;
    }

    function packRGB(a: number, b: number, c: number): number {
        return ((a & 0xFF) << 16) | ((b & 0xFF) << 8) | (c & 0xFF);
    }
    function unpackR(rgb: number): number {
        let r = (rgb >> 16) & 0xFF;
        return r;
    }
    function unpackG(rgb: number): number {
        let g = (rgb >> 8) & 0xFF;
        return g;
    }
    function unpackB(rgb: number): number {
        let b = (rgb) & 0xFF;
        return b;
    }

    /**
     * Converts a hue saturation luminosity value into a RGB color
     * @param h hue from 0 to 360
     * @param s saturation from 0 to 99
     * @param l luminosity from 0 to 99
     */
    //% blockId=cubertHSL block="hue %h|saturation %s|luminosity %l"
    export function hsl(h: number, s: number, l: number): number {
        h = h % 360;
        s = Math.clamp(0, 99, s);
        l = Math.clamp(0, 99, l);
        let c = (((100 - Math.abs(2 * l - 100)) * s) << 8) / 10000; //chroma, [0,255]
        let h1 = h / 60;//[0,6]
        let h2 = (h - h1 * 60) * 256 / 60;//[0,255]
        let temp = Math.abs((((h1 % 2) << 8) + h2) - 256);
        let x = (c * (256 - (temp))) >> 8;//[0,255], second largest component of this color
        let r$: number;
        let g$: number;
        let b$: number;
        if (h1 == 0) {
            r$ = c; g$ = x; b$ = 0;
        } else if (h1 == 1) {
            r$ = x; g$ = c; b$ = 0;
        } else if (h1 == 2) {
            r$ = 0; g$ = c; b$ = x;
        } else if (h1 == 3) {
            r$ = 0; g$ = x; b$ = c;
        } else if (h1 == 4) {
            r$ = x; g$ = 0; b$ = c;
        } else if (h1 == 5) {
            r$ = c; g$ = 0; b$ = x;
        }
        let m = ((l * 2 << 8) / 100 - c) / 2;
        let r = r$ + m;
        let g = g$ + m;
        let b = b$ + m;
        return packRGB(r, g, b);
    }

    export enum HueInterpolationDirection {
        Clockwise,
        CounterClockwise,
        Shortest
    }
}
