/* index.js
 *
 * main routing file
 */

module.exports = function (app, print){

    var moment = require('moment'); // time

    var routes = [
        'instagram',
        'lastfm',
        'message',
        'onthisday',
        'reddit',
        'sharks',
        'space',
        'weather',
        'word',
    ];

    for(var i = 0; i < routes.length; i++){
        var route = routes[i];

        require(__dirname +'/'+ route)(app);
    }

    app.get('/', function (req, res) {
        res.render('home.hbs', { title: 'thermointerprinter', message: '' });
    });

};
