var SerialPort = require('serialport').SerialPort,
	serialPort = new SerialPort('/dev/ttyACM0', {
		baudrate: 19200
	}),
	
	thermalPrinter = require('thermalprinter'),

	express = require('express');

var app = express();

app.engine('html', require('ejs').renderFile);

app.get('/', function (req, res) {
  res.render('index.html');
})

var server = app.listen(3000, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)

})

serialPort.on('open',function() {
	var printer = new thermalPrinter(serialPort);
	printer.on('ready', function() {

		app.post('/', function(req, res) {
		    var text = req.param("text");
		    console.log(text);
		    printText(text);
		});
		
		function printText(text){		
			printer
				.lineFeed(2)
				.bold(false)
				.big(true)
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