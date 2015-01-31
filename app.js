var SerialPort = require('serialport').SerialPort,
	serialPort = new SerialPort('/dev/ttyACM0', {
		baudrate: 19200
	}),
	
	thermalPrinter = require('thermalprinter'),

	express = require('express');

serialPort.on('open',function() {
	var printer = new thermalPrinter(serialPort);
	printer.on('ready', function() {

		var app = express();

		app.get('/:text', function(req, res) {
		    var text = req.params.text;
		    console.log(text);
		    printText(text);
		});

		console.log('Listneing on 3000');
		app.listen(3000);
		
		function printText(text){		
			printer
				.printLine(text)
				.lineFeed(3)
				.print(function(err){
					
					if (err) {
						throw err;
					}
					
					console.log(text);
			});
		}

	});
});