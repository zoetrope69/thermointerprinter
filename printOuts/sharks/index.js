/* sharks.js
 *
 * prints out shark info
 */

module.exports = function(app, config){

    var moment = require('moment'), // time

        request = require('request'), // http

        gm = require('gm'); // graphics

    app.get('/sharks', function (req, res){

        var url = 'http://www.ocearch.org/tracker/ajax/filter-sharks/?sharks%5B%5D=&tracking-activity=ping-most-recent&gender=+&stage-of-life=+&location=0';

        request(url, function (err, response, body){
            if (!err && response.statusCode == 200){
                var sharks = JSON.parse(body);

                var shark = sharks[Math.floor(Math.random() * sharks.length)];

                shark.lat = shark.pings[0].latitude;
                shark.lng = shark.pings[0].longitude;

                var currentLat = 50.7921850,
                    currentLng = -1.0785420;

                shark.distance = Math.floor(getDistanceFromLatLonInKm(shark.lat, shark.lng, currentLat, currentLng));

                // gender icon

                shark.gender_icon = 'question';

                if(shark.gender === 'Female'){
                    shark.gender_icon = 'venus';
                }

                if(shark.gender === 'Male'){
                    shark.gender_icon = 'mars';
                }

                var sharkImages = {
                    "Hammerhead Shark (Sphyrna)": "hammerhead",
                    "White Shark (Carcharodon carcharias)": "greatwhite",
                    "Tiger Shark  (Galeocerdo cuvier)": "tiger",
                    "Blacktip Shark (Carcharhinus limbatus)": "blacktip",
                };

                shark.image = sharkImages[shark.species];

                res.render(__dirname, {
                    title: 'Sharks',
                    time: moment().format('MMM D YYYY h:mm a'),

                    shark: shark
                });

            }
        });


    });

    function getDistanceFromLatLonInKm(lat1, lng1, lat2, lng2){
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2 - lat1);  // deg2rad below
        var dLon = deg2rad(lng2 - lng1);
        var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in km
        return d;
    }

    function deg2rad(deg){
        return deg * (Math.PI/180);
    }

};
