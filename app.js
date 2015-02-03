var config = require(__dirname + '/config.json'),

	SerialPort = require('serialport').SerialPort,
	serialPort = new SerialPort(config.usbPath, {
		baudrate: config.baudrate
	}),

	thermalPrinter = require('thermalprinter'),

	express = require('express'),
	exphbs  = require('express3-handlebars'),

	gm = require('gm'),
	webshot = require('webshot'),

	moment = require('moment'),

	Forecast = require('forecast.io'),
	forecast = new Forecast({ APIKey: config.forecastio.apiKey });

var app = express();

app.use(express.static(__dirname + '/public'));

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

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});

app.get('/instagram', function (req, res){

	console.log('Printing instagram');

	var input = __dirname + '/instagram.jpg';

	gm(input)
		.resize(384)
		.monochrome()
		.orderedDither('All', '1x1')
		.write(__dirname + '/public/images/dithered.jpg', function (err){
			if (err) throw err;

			console.log('Dither image');

			res.render('paper.hbs');

		});
});

serialPort.on('open',function() {

	var printer = new thermalPrinter(serialPort, {
		maxPrintingDots: 7, // 0-255. Max heat dots, Unit (8dots), Default: 7 (64 dots)
		heatingTime: 100, // 3-255. Heating time, Unit (10us), Default: 80 (800us)
		heatingInterval: 15, //0-255. Heating interval, Unit (10µs), Default: 2 (20µs)
	});

	printer.on('ready', function() {

		// printInsta();

		printMessage({
			name: 'Mr. Printer',
			message: 'Printer online!'
		});

		app.post('/', function(req, res) {
			var data = {
				name: req.query.name,
				message: req.query.message,
			};

			printMessage(data);

			res.send('Sent!');
		});

		app.get('/weather', function(req, res) {

			var location = {
				latitude: 50.7903503,
				longitude: -1.0661844
			};

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
					.lineFeed(1);

				days.forEach(function(day, i){
					if(i > 0){
						printer
							.printLine(day.name + ': ' + day.temp + '° - ' + day.summary)
							.horizontalLine(32);
					}
				});

				printer
					.lineFeed(1)
					.bold(true)
					.big(true)
					.printLine(':-)')
					.lineFeed(3);

				printer.print(function(err){
					if (err) throw err;
				});

			});

		});

		function printInsta(){

			var options = {

				screenSize: {
				width: 384,
				height: 480
				},

				shotSize: {
					width: 'window',
					height: 'all'
				},

				streamType: 'png',

				quality: 100,

				userAgent: 'Mozilla/5.0 (iPhone; U; CPU iPhone OS 3_2 like Mac OS X; en-us)'
						+ ' AppleWebKit/531.21.20 (KHTML, like Gecko) Mobile/7B298g'
			};

			var imagePath = __dirname + 'screenshot.png';

			webshot('http://localhost:3000/instagram', imagePath, options, function(err){
				if (err) throw err;

				console.log('Saved screenshot!');

				printImage(imagePath);
			});

		};

		function printMessage(data){

			var name = data.name || 'Anon',
				message = data.message || '...',
				time = moment().format('MMMM Do YYYY, h:mm:ss a');

			printer
				.bold(true)
				.printLine("From: "+ name)
				.bold(false)
				.printLine(time)

				.horizontalLine(32)
				.printLine(message)

				.lineFeed(2)
				.print(function(err){
					if (err) throw err;

					console.log('From: '+ name);
					console.log(time);
					console.log('----------------------------');
					console.log(message);
				});
		}


		function printText(text){
			printer
				.lineFeed(2)
				.printLine(text)
				.lineFeed(2)
				.print(function(err){
					if (err) throw err;

					console.log('Printing: '+ text);
				});
		}

		function printImage(imagePath){
			printer
				.lineFeed(2)
				.printImage(imagePath)
				.lineFeed(2)
				.print(function(err){
					if (err) throw err;

					console.log(imagePath);
				});
		}

	});
});
