/* word.js
 *
 * prints out the word of the day
 */

module.exports = function(app){

    var moment = require('moment'), // time

        request = require('request'), // http
        parseXmlString = require('xml2js').parseString; // xml

    app.get('/word', function (req, res){

        var url = 'http://wordsmith.org/awad/rss1.xml';

        request(url, function (err, response, body){
            if (!err && response.statusCode == 200){
                parseXmlString(body, function(err, result){
                    if (err) throw err;

                    var content = result.rss.channel[0].item[0];

                    res.render(__dirname, {
                        title: 'Word',
                        time: moment().format('MMM D YYYY h:mm a'),

                        word: content.title[0],
                        desc: content.description[0]
                    });

                });
            }
        });


    });

};
