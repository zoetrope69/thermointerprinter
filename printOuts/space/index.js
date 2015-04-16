/* space.js
 *
 * prints out who's in space right now
 */

module.exports = function(app){

    var moment = require('moment'), // time

        request = require('request'); // http

    app.get('/space', function (req, res){

        var url = 'http://howmanypeopleareinspacerightnow.com/space.json';

        request(url, function (err, response, body){
            if (!err && response.statusCode == 200){
                var spaceData = JSON.parse(body);

                for(var i = 0; i < spaceData.people.length; i++){
                    var person = spaceData.people[i];

                    var launchDate = moment(person.launchdate);
                    var nowDate = moment();

                    var daysInSpace = moment().diff(launchDate, "days");

                    person.time = daysInSpace;
                }

                res.render(__dirname, {
                    title: 'Space',
                    time: moment().format('MMM D YYYY h:mm a'),

                    number: spaceData.number,
                    people: spaceData.people
                });

            }
        });


    });

};
