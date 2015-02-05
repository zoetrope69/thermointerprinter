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
	forecast = new Forecast({ APIKey: config.forecastio.apiKey }),

	LastFmNode = require('lastfm').LastFmNode,
	lastfm = new LastFmNode({
		api_key: config.lastfm.apiKey,    // sign-up for a key at http://www.last.fm/api
		secret: config.lastfm.secret,
		useragent: 'thermointerprinter'
	}),

	request = require('request');

var app = express();

app.use(express.static(__dirname + '/public'));

app.engine('.hbs', exphbs({
		extname: '.hbs',
		defaultLayout: 'paper'
	})
);
app.set('view engine', '.hbs');

app.get('/', function (req, res) {
	res.render('home.hbs', { layout: 'main' });
});

var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});

app.get('/instagram', function (req, res){

	console.log('Printing instagram');

	var input = __dirname + '/public/images/instagram.jpg';

	gm(input)
		.resize(384, 384)
		.monochrome()
		.orderedDither('All', '1x1')
		.write(__dirname + '/public/images/processed/dithered.jpg', function (err){
			if (err) throw err;

			console.log('Dither image');

			res.render('paper.hbs');

		});
});

serialPort.on('open',function() {

	var opts = {
		maxPrintingDots: 5, // 0-255. Max heat dots, Unit (8dots), Default: 7 (64 dots)
		heatingTime: 150, // 3-255. Heating time, Unit (10us), Default: 80 (800us)
		heatingInterval: 200, //0-255. Heating interval, Unit (10µs), Default: 2 (20µs)
	};

	var printer = new thermalPrinter(serialPort, opts);

	/*
		The more max heating dots, the more peak current will cost when printing,
		the faster printing speed. The max heating dots is 8*(n+1).

		The more heating time, the more density, but the slower printing speed.
		If heating time is too short, blank page may occur.

		The more heating interval, the more clear, but the slower printing speed.
	*/

	printer.on('ready', function() {


		console.log('Printer ready...');

		// printInsta();
		lastfmNowPlayin();

		app.post('/', function(req, res) {
			var data = {
				name: req.query.name,
				message: req.query.message,
			};

			printMessage(data);

			res.send('Sent!');
		});

		function lastfmNowPlayin(){
			var trackStream = lastfm.stream(config.lastfm.username);

			trackStream.on('nowPlaying', function(track) {
				console.log(track);


				console.log('Paused track stream');
				trackStream.stop();

				// simplify response
				track.imageUrl = track.image[3]['#text'];
				track.artist = track.artist['#text'];
				track.album = track.album['#text'];

				console.log('Now playing: ' + track.name + ' - ' + track.artist);
				console.log('Image URL: '+track.imageUrl);

				var imageFormat = track.imageUrl.substr(track.imageUrl.lastIndexOf("."));
				console.log('Image format: '+imageFormat);
				var imagePath = __dirname + '/public/images/processed/albumart'+imageFormat;

				// if album art
				if(track.imageUrl !== ''){

					console.log('Dithering album art');

					var printWidth = 384,
						borderSize = 2,
						imageSize = printWidth - (borderSize * 2);

					gm(request(track.imageUrl), "input"+imageFormat)

						.resize(imageSize, imageSize)

						.sharpen(5)
						.monochrome()

						.orderedDither('All', '1x1')

						.borderColor('black')
						.border(borderSize, borderSize)

						.write(imagePath, function(err) {
							if (err) throw err;

							var info = track.artist + ' - ' +  track.album;

							// truncate with a ... ending
							if(info.length > 32){
								var ending = '...';
								info = info.substr(0, info.length - 1 - ending.length ) + ending;
							}

							console.log('Printing...');

							printer
								.horizontalLine(32)
								.printLine(info)

								.big(true)
								.printLine(wordwrap(track.name, 16))
								.big(false)
								.lineFeed(1)

								.printImage(imagePath)

								.printLine(moment().format('MMMM Do YYYY, h:mm:ss a'))
								.lineFeed(1)

								.print(function(err){
									if (err) throw err;

									console.log('Image printed');

									console.log('Resumed track stream');
									trackStream.start();
								});

								function wordwrap( str, width, brk, cut ) {

									brk = brk || '\n';
									width = width || 75;
									cut = cut || false;

									if (!str) { return str; }

									var regex = '.{1,' +width+ '}(\\s|$)' + (cut ? '|.{' +width+ '}|.+$' : '|\\S+?(\\s|$)');

									return str.match( RegExp(regex, 'g') ).join( brk );

								}
						});

				}else{

					console.log('No album art :¬(');

					console.log('Resumed track stream');
					trackStream.start();

				}

			});

			trackStream.start();
		}

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

			var imagePath = __dirname + '/public/images/processed/screenshot.png';

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

		function printImage(imagePath, callback){
			printer
				.lineFeed(2)
				.printImage(imagePath)
				.lineFeed(2)
				.print(function(err){
					if (err) throw err;

					console.log(imagePath);
					callback();
				});
		}

	});
});
