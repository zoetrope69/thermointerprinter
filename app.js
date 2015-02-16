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
	parseXmlString = require('xml2js').parseString,

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
	}),

	reddit = require('redwrap');

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
			word: req.query.word,
			onthisday: req.query.onthisday,
			space: req.query.space,
			reddit: req.query.reddit
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
		}else if(data.word){
			// print word
			print.url('http://localhost:'+config.port+'/word', function(){
				res.send('Word of the Day printed!');
			});
		}else if(data.onthisday){
			// print onthisday
			print.url('http://localhost:'+config.port+'/onthisday', function(){
				res.send('On this day printed!');
			});
		}else if(data.space){
			// print space
			print.url('http://localhost:'+config.port+'/space', function(){
				res.send('How many people in space printed!');
			});
		}else if(data.reddit){
			// print reddit
			print.url('http://localhost:'+config.port+'/reddit', function(){
				res.send('TIL printed!');
			});
		}else{
			print.message(data, function(){
				res.send('Message sent and printed!');
			});
		}

	});

	app.get('/onthisday', function (req, res){

		var wikiUrl = 'http://en.wikipedia.org/w/api.php?action=featuredfeed&feed=onthisday&feedformat=rss';

		request(wikiUrl, function (err, response, body){
			if (!err && response.statusCode == 200){

				parseXmlString(body, function(err, result){
					if (err) throw err;

					var content = result.rss.channel[0];

					// Count the number of days
					var noOfDays = content.item.length;
					// Get the Key of today
					var today = noOfDays - 1;
					// Get the description of today's entry
					var input = content.item[today].description;

					var regex = /<li>(.*?)<\/li>/g;
					var match;
					var output = [];

					while (match = regex.exec(input)){
						output.push(match[1]);
					}

					var returnArr = [];

					for(var i = 0; i < output.length; i++){
						var item = ''+output[i];

						var seperator = ' – ',

							year = item.substring(0, item.indexOf(seperator)),
							info = item.substring(item.indexOf(seperator) + seperator.length);

						// Remove (pictured) from the text, as no pictures are printed
						// info = info.replace(' (pictured)', '');

						returnArr.push({
							year: year, // Add the year
							info: info // Add the info
						});

					}

					res.render('onthisday.hbs', { title: 'On this day', time: moment().format('MMM D YYYY h:mm a'), output: returnArr });

				});

			}
		});

		// A simple function to remove the empty lines from the content returned by Wikipedia
		function removeEmptyLines(string){ return string.replace('/(^[\r\n]*|[\r\n]+)[\s\t]*[\r\n]+/g', '\n'); }

	});

	app.get('/word', function (req, res){

		var url = 'http://wordsmith.org/awad/rss1.xml';

		request(url, function (err, response, body){
			if (!err && response.statusCode == 200){
				parseXmlString(body, function(err, result){
					if (err) throw err;

					var content = result.rss.channel[0].item[0];

					console.log(content);

					var info = {
						word: content.title[0],
						desc: content.description[0],
					};

					res.render('word.hbs', { title: 'Word', time: moment().format('MMM D YYYY h:mm a'), info: info });

				});
			}
		});


	});

	app.get('/space', function (req, res){

		var spaceUrl = 'http://howmanypeopleareinspacerightnow.com/space.json';

		request(spaceUrl, function (err, response, body){
			if (!err && response.statusCode == 200){
				var spaceData = JSON.parse(body);

				res.render('space.hbs', { title: 'Space', time: moment().format('MMM D YYYY h:mm a'), amount: spaceData.number });
			}
		});


	});

	app.get('/reddit', function (req, res){

		console.log('Printing reddit');

		reddit.r('todayilearned').sort('hot').limit(1, function(err, data, redditRes){
			if (err) throw err;

			var posts = data.data.children;

			for(var i = 0; i < posts.length; i++){
				var post = posts[i].data;
				var title = post.title;

				var stickied = post.stickied;
				var isMod = ( post.author === 'TILMods' );
				var hasTags = title.indexOf('[') !==  -1 || title.indexOf(']') !==  -1;

				// if theres no tags use the title
				if( !hasTags && !stickied && !isMod  ){
					title = title.replace('TIL ', ''); // remove 'TIL '
					title =  capitaliseFirstLetter(title);

					console.log(title);

					res.render('reddit.hbs', { title: 'Reddit', time: moment().format('MMM D YYYY h:mm a'), postTitle: title });

					break;
				}
			}

			function capitaliseFirstLetter(string){
				return string.charAt(0).toUpperCase() + string.slice(1);
			}

		});
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
		console.log('Username via param:', req.query.username);
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

						res.render('lastfm.hbs', { title: 'Last.FM', username: username, track: track, time: moment().format('MMM D YYYY H:mm'), imagePath: imagePath });

						console.log('Resumed track stream');
						trackStream.start();

					});

			}else{

				console.log('No album art :¬(');

				imagePath = '';

				res.render('lastfm.hbs', { title: 'Last.FM', username: username, track: track, time: moment().format('MMM D YYYY H:mm'), imagePath: imagePath });

				console.log('Resumed track stream');
				trackStream.start();

			}


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
