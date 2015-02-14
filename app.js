var config = require(__dirname + '/config.json'),

	// printer stuff

	SerialPort = require('serialport').SerialPort,
	serialPort = new SerialPort("/dev/ttyACM0", {
		baudrate: 19200
	}),

	thermalPrinter = require('thermalprinter'),
	Print = require(__dirname + '/print.js'),

	express = require('express'),
	app = express(),
	exphbs  = require('express3-handlebars'),
	request = require('request'),

	// graphics stuff
	gm = require('gm'),

	// time stuff
	moment = require('moment'),

	// api stuff

	Forecast = require('forecast.io'),
	forecast = new Forecast({ APIKey: config.forecastio.apiKey }),

	LastFmNode = require('lastfm').LastFmNode,
	lastfm = new LastFmNode({
		api_key: config.lastfm.apiKey,    // sign-up for a key at http://www.last.fm/api
		secret: config.lastfm.secret,
		useragent: 'thermointerprinter'
	});


app.use(express.static(__dirname + '/public'));

app.engine('.hbs', exphbs({
		extname: '.hbs',
		defaultLayout: 'paper'
	})
);
app.set('view engine', '.hbs');

serialPort.on('open', function(){

	var printerOpts = {
		maxPrintingDots: 5, // 0-255. Max heat dots, Unit (8dots), Default: 7 (64 dots)
		heatingTime: 150, // 3-255. Heating time, Unit (10us), Default: 80 (800us)
		heatingInterval: 200 //0-255. Heating interval, Unit (10µs), Default: 2 (20µs)
	};

	/*
	The more max heating dots, the more peak current will cost when printing,
	the faster printing speed. The max heating dots is 8*(n+1).

	The more heating time, the more density, but the slower printing speed.
	If heating time is too short, blank page may occur.

	The more heating interval, the more clear, but the slower printing speed.
	*/

	var printer = new thermalPrinter(serialPort, printerOpts);

	var print = Print(printer);

	printer.on('ready', function(){
		console.log('Printer ready...');

		var server = app.listen(config.port, function(){

			var host = server.address().address;
			var port = server.address().port;

			console.log('Example app listening at http://%s:%s', host, config.port);

		});

	});

	app.get('/', function (req, res) {
		res.render('home.hbs', { title: 'Messenger', message: '' });
	});

	app.post('/', function(req, res){
		var data = {
			name: req.query.name,
			message: req.query.message,
			time: moment().format('MMMM Do YYYY, h:mm:ss a'),

			lastfm: req.query.lastfm,
			instagram: req.query.instagram,
			weather: req.query.weather,
		};

		if(data.lastfm){
			// print lastfm
			print.url('http://localhost:'+config.port+'/lastfm?username='+data.lastfm, function(){
				res.send('Last.FM song printed!');
			});
		}else if(data.instagram){
			// print instagram
			print.url('http://localhost:'+config.port+'/instagram', function(){
				res.send('Instagram sent and printed!');
			});
		}else if(data.weather){
			// print weather
			print.url('http://localhost:'+config.port+'/weather', function(){
				res.send('Weather forecasted and printed!');
			});
		}else{
			print.message(data, function(){
				res.send('Message sent and printed!');
			});
		}

	});

	app.get('/instagram', function (req, res){

		console.log('Printing instagram');

		var input = __dirname + '/public/images/instagram.jpg',
			output = '/images/processed/dithered.jpg';

		gm(input)
			.resize(384, 384)
			.monochrome()
			.orderedDither('All', '1x1')
			.write(__dirname + '/public' + output, function (err){
				if (err) throw err;

				console.log('Dither image');

				res.render('instagram.hbs', { title: 'Instagram', time: moment().format('MMM D YYYY h:mm a'), imagePath: output });

			});
	});

	app.get('/lastfm', function(req, res){
		var username = req.query.username || config.lastfm.username;

		var trackStream = lastfm.stream(username);

		trackStream.on('nowPlaying', function(track){
			console.log('Paused track stream');
			trackStream.stop();

			// simplify response
			track = {
				name: track.name,
				imageUrl: track.image[3]['#text'],
				artist: track.artist['#text'],
				album: track.album['#text']
			};

			console.log('Now playing: ' + track.name + ' - ' + track.artist);
			console.log('Image URL: '+track.imageUrl);

			var imageFormat = track.imageUrl.substr(track.imageUrl.lastIndexOf("."));
			console.log('Image format: '+imageFormat);
			var imagePath = '/images/processed/albumart'+imageFormat;

			// if album art
			if(track.imageUrl !== ''){

				console.log('Dithering album art');

				var printWidth = 384,
					imageSize = printWidth;

				gm(request(track.imageUrl), "input"+imageFormat)

					.resize(imageSize, imageSize)

					.sharpen(5)
					.monochrome()

					.orderedDither('All', '1x1')

					.write(__dirname + '/public' + imagePath, function(err) {
						if (err) throw err;
					});

			}else{

				console.log('No album art :¬(');

				imagePath = '';

			}

			res.render('lastfm.hbs', { title: 'Last.FM', username: username, track: track, time: moment().format('MMM D YYYY H:mm'), imagePath: imagePath });

			console.log('Resumed track stream');
			trackStream.start();


		});

		trackStream.start();

	});

	app.get('/weather', function(req, res) {

		var location = {
			latitude: 50.7903503,
			longitude: -1.0661844
		};

		getWeatherForecast(location, function(days){
			res.render('weather.hbs', { title: 'Weather', days: days, time: moment().format('MMM D YYYY H:mm') });
		});

	});


});

function getWeatherForecast(location, callback){
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

		callback(days);

	});
}
