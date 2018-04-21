// tests go here; this will not be compiled when this package is used as a library
let cubert2: cubert.Cubert = null
cubert2 = cubert.create(DigitalPin.P0)
basic.forever(() => {
    basic.showIcon(IconNames.Heart)
    basic.showNumber(cubert2.getPixelOffset(0, 0, 0))
    basic.showIcon(IconNames.Square)
    basic.showNumber(cubert2.getPixelOffset(1, 0, 0))
    basic.showIcon(IconNames.Square)
    basic.showNumber(cubert2.getPixelOffset(1, 2, 0))
    basic.showIcon(IconNames.Square)
    basic.showNumber(cubert2.getPixelOffset(0, 0, 1))
})

