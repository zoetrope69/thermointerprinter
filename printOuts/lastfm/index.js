/* lastfm.js
 *
 * prints out current playing lastfm track
 */

module.exports = function(app, config){

    var moment = require('moment'), // time

        request = require('request'), // http

        gm = require('gm'), // graphics

        LastFmNode = require('lastfm').LastFmNode,
        lastfm = new LastFmNode({
            api_key: process.env.LASTFM_API,    // sign-up for a key at http://www.last.fm/api
            secret:  process.env.LASTFM_SECRET,
            useragent: 'thermointerprinter'
        });

    app.get('/lastfm', function(req, res){
        console.log('Username via param:', req.query.username);
        var username = req.query.username ||  process.env.LASTFM_USER;

        console.log(username);

        var trackStream = lastfm.stream(username);
        console.log(trackStream);

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

                    .write('./public' + imagePath, function(err){
                        if (err) throw err;

                        res.render(__dirname, {
                            title: 'Last.FM',
                            time: moment().format('MMM D YYYY H:mm'),

                            username: username,
                            track: track,
                            imagePath: imagePath
                        });

                        console.log('Resumed track stream');
                        trackStream.start();

                    });

            }else{

                console.log('No album art :¬(');

                imagePath = '';

                res.render(__dirname, {
                    title: 'Last.FM',
                    time: moment().format('MMM D YYYY H:mm'),

                    username: username,
                    track: track,
                    imagePath: imagePath
                });

                console.log('Resumed track stream');
                trackStream.start();

            }


        });

        trackStream.start();

    });

};
