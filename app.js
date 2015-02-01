var config = require(__dirname + '/config.json'),

	SerialPort = require('serialport').SerialPort,
	serialPort = new SerialPort(config.usbPath, {
		baudrate: config.baudrate
	}),
	
	thermalPrinter = require('thermalprinter'),

	express = require('express'),
	exphbs  = require('express3-handlebars'),

	moment = require('moment'),

	Forecast = require('forecast.io'),
	forecast = new Forecast({ APIKey: config.forecastio.apiKey });

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

		printText('Printer online!');

		app.post('/', function(req, res) {
		    var text = req.query.text;
		    printText(text);
		});

		app.get('/image', function(req, res) {
			var imagePath = __dirname + '/puff.png';
		    printImage(imagePath);
		});

		app.get('/weather', function(req, res) {

			var location = {
				latitude: 50.7903503,
				longitude: -1.0661844
			}

			forecast.get(location.latitude, location.longitude, function (err, forecastRes, data) {
				if (err) throw err;

				var days = [];

				daysData = data.daily.data;

				daysData.forEach(function(dayData){

					var day = {
						name: moment.unix(dayData.time).format('ddd'),
						temp: Math.floor((dayData.apparentTemperatureMin + dayData.apparentTemperatureMax) / 2),
						summary: dayData.summary
					};

					days.push(day);
				});

				var currentDay = days[0];

				printer
					.bold(true)
					.big(true)
					.lineFeed(1)
					.printLine(currentDay.name + ': ' + currentDay.temp + '°')
					.printLine(currentDay.summary)
					.lineFeed(2)
					.big(false)
					.printLine('Here is the weekly forecast:')
					.bold(false)
					.lineFeed(1)

				days.forEach(function(day, i){
					if(i > 0){						
						printer
							.printLine(day.name + ': ' + day.temp + '° - ' + day.summary)
							.horizontalLine(32)
					}
				});

				printer
					.lineFeed(1)
					.bold(true)
					.big(true)
					.printLine(':-)')
					.lineFeed(3)

				printer.print(function(err){						
					if (err) throw err;
				});

			});

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
					
					console.log('Printing: '+ text);
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