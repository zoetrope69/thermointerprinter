/* index.js
 *
 * main routing file
 */

module.exports = function (app, print){

    var moment = require('moment'), // time
        webshot = require('webshot');

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

    app.get('/print/:type', function(req, res){

        var type = req.params.type;
            rootPath = 'http://localhost:'+app.get('port')+'/';

        // if valid route
        if(inArray(type, routes)){

            switch(type){

                case('message'):

                    printUrl(rootPath+'message?name='+req.query.name+'&message='+req.query.message, function(){
                        res.send('Message printed!');
                    });

                    break;

                case('lastfm'):

                    printUrl(rootPath+'lastfm?username='+req.query.username, function(){
                        res.send('Last.FM song printed!');
                    });

                    break;

                default:

                    printUrl(rootPath + type, function(){
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

    function printUrl(url, callback){

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

            defaultWhiteBackground: true,

            quality: 100,

            userAgent: 'Mozilla/5.0 (iPhone; U; CPU iPhone OS 3_2 like Mac OS X; en-us) AppleWebKit/531.21.20 (KHTML, like Gecko) Mobile/7B298g'
        };

        var imagePath = './public/images/processed/screenshot.png';

        webshot(url, imagePath, options, function(err){
            if (err) throw err;

            console.log('Saved screenshot!');

            console.log('Finished printing');
            callback();
        });

    }

};
