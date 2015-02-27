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

startServer(app, config, function(err){
	if (err) throw err;
	console.log('Scheduler ready...');
});

function startServer(app, config, callback){

	var server = app.listen(config.ports.scheduler, function(){

		var host = server.address().address;
		var port = server.address().port;

		console.log('App listening at http://%s:%s', host, config.ports.scheduler);

		// route files from printOuts/index.js
		require('./printOuts')(app, config);

		callback();

	});

}
