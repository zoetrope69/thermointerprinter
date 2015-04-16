# thermointerprinter

internet connected thermal printer using node and an arduino

__a lot of stuff based on little printer form berg__

## What you need:

+ [Thermal printer](http://www.hobbytronics.co.uk/thermal-printer)
+ 57mm thermal paper
+ Arduino (Works with other devices that can use serial port too use the corresponding RX and TX)
+ 5v-9v power supply (splice wires and shove into thermal printer)

## Installation

1. Set up Arduino
2. [Set-up your thermal printer](https://learn.adafruit.com/mini-thermal-receipt-printer) ![Visual set-up](/images/setup.png)
3. Add environment variables for LastFM and ForecastIO
4. Install non-node dependancies: [GraphicsMagick](http://www.graphicsmagick.org/), [Cairo](http://cairographics.org/download/), Pango
5. `npm install` install dependancies
6. `foreman start` runs a express site
