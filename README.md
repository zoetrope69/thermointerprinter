# thermointerprinter

internet connected thermal printer using node and an arduino

## What you need:

+ [Thermal printer](http://www.hobbytronics.co.uk/thermal-printer)
+ 57mm thermal paper
+ Arduino (Works with other devices that can use serial port too use the corresponding RX and TX)
+ 5v-9v power supply (splice wires and shove into thermal printer)

## Installation

1. Set up Arduino
2. [Set-up your thermal printer](https://learn.adafruit.com/mini-thermal-receipt-printer) ![Visual set-up](/images/setup.png)
3. `npm install` install dependancies
4. `node app.js` runs a express site on [:3000](http://localhost:3000)

### print weather forecast

You'll need to copy the `forecast-config--sample.json` to `forecast-config.json` and add your API key which you can [get from the forecast.io developer site](https://developer.forecast.io/).

