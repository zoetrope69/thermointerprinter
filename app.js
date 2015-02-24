var config = require('./config.json'),

	express = require('express'),
	app = express(),
	exphbs  = require('express3-handlebars');

app.use(express.static('./public'));

// use handlebars for templating
app.engine('.hbs', exphbs({
		extname: '.hbs',
		defaultLayout: 'paper'
	})
);
app.set('view engine', '.hbs');

makePrinter(startServer(app, config, function(err){
	if (err) throw err;
	console.log('Printer and server are ready...');
}));

function makePrinter(callback){

	var SerialPort = require('serialport').SerialPort,
		serialPort = new SerialPort(config.printer.usb, {
			baudrate: config.printer.baudrate
		}, function(err){
			if (err) throw err;
		}),

		thermalPrinter = require('thermalprinter'),
		Print = require('./print.js');

	// open serial port to printer
	serialPort.on('open', function(err){
		if (err) throw err;

		/*
			The more max heating dots, the more peak current will cost when printing,
			the faster printing speed. The max heating dots is 8*(n+1).

			The more heating time, the more density, but the slower printing speed.
			If heating time is too short, blank page may occur.

			The more heating interval, the more clear, but the slower printing speed.

			maxPrintingDots: 0-255. Max heat dots, Unit (8dots), Default: 7 (64 dots)
			heatingTime: 3-255. Heating time, Unit (10us), Default: 80 (800us)
			heatingInterval: 0-255. Heating interval, Unit (10µs), Default: 2 (20µs)

		*/

		var printer = new thermalPrinter(serialPort, config.printer.options);

		// printer helper functions
		var print = Print(printer);

		printer.on('ready', callback);

	});

}

function startServer(app, config, callback){

	var server = app.listen(config.ports.printer, function(){

		var host = server.address().address;
		var port = server.address().port;

		console.log('App listening at http://%s:%s', host, config.ports.printer);

		// route files from printOuts/index.js
		require('./printOuts')(app, config);

		callback();

	});

}
