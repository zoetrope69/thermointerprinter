/* index.js
 *
 * main routing file
 */

module.exports = function (app, config){

    var moment = require('moment'); // time

    var routes = [
        'instagram',
        'lastfm',
        'message',
        'onthisday',
        'reddit',
        'space',
        'weather',
        'word',
    ];

    for(var i = 0; i < routes.length; i++){
        var route = routes[i];

        require(__dirname +'/'+ route)(app, config);
    }

    app.get('/', function (req, res) {
        res.render('home.hbs', { title: 'Messenger', message: '' });
    });

    app.post('/print/:type', function(req, res){

        var type = req.params.type;
            rootPath = 'http://localhost:'+config.ports.printer+'/';

        // if valid route
        if(inArray(type, routes)){

            switch(type){

                case(message):

                    print.url(rootPath+'message?name='+req.query.name+'&message='+req.query.message, function(){
                        res.send('Message printed!');
                    });

                    break;

                case(lastfm):

                    print.url(rootPath+'lastfm?username='+req.query.username, function(){
                        res.send('Last.FM song printed!');
                    });

                    break;

                default:

                    print.url(rootPath + type, function(){
                        res.send(type + ' printed!');
                    });

            }

        }else{
            res.send('Not a valid print option');
        }

        function inArray(obj, arr){
            return (arr.indexOf(obj) != -1);
        }

    });

};
