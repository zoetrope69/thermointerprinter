var express = require('express'),
	app = express(),
	exphbs  = require('express-handlebars');

app.use(express.static('./public'));

// use handlebars for templating
app.engine('.hbs', exphbs({
		extname: '.hbs',
		defaultLayout: 'paper'
	})
);
app.set('view engine', '.hbs');

startServer(app, function(err){
	if (err) throw err;
	console.log('App ready...');
});

function startServer(app, callback){

	var server = app.listen(3030, function(){

		var host = server.address().address;
		var port = server.address().port;

		console.log('App listening at http://%s:%s', host, 3030);

		// route files from printOuts/index.js
		require('./printOuts')(app);

		callback();

	});

}
