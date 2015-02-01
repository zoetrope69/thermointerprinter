var SerialPort = require('serialport').SerialPort,
	serialPort = new SerialPort('/dev/ttyACM0', {
		baudrate: 19200
	}),
	
	thermalPrinter = require('thermalprinter'),

	express = require('express'),
	exphbs  = require('express3-handlebars'),

	moment = require('moment');

var app = express();

app.engine('.hbs', exphbs({
		extname: '.hbs',
		defaultLayout: 'main'
	})
);
app.set('view engine', '.hbs');

app.get('/', function (req, res) {
	res.render('home.hbs');
});

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

		app.get('/image', function(req, res) {
			var imagePath = __dirname + '/puff.png';
		    printImage(imagePath);
		});

		function printText(text){		
			printer
				.lineFeed(2)
				.bold(false)
				.big(true)
				.printLine(text)
				.lineFeed(3)
				.print(function(err){					
					if (err) throw err;
					
					console.log(text);
				});
		}

		function printImage(imagePath){		
			printer
				.lineFeed(2)
				.printImage(imagePath)
				.lineFeed(3)
				.print(function(err){					
					if (err) throw err;
					
					console.log(imagePath);
				});
		}

	});
});