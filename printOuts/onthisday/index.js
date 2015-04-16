/* onthisday.js
 *
 * prints out what happened on this day in history
 */

module.exports = function(app){

    var moment = require('moment'), // time

        request = require('request'), // http
        parseXmlString = require('xml2js').parseString; // xml

    app.get('/onthisday', function (req, res){

        var wikiUrl = 'http://en.wikipedia.org/w/api.php?action=featuredfeed&feed=onthisday&feedformat=rss';

        request(wikiUrl, function (err, response, body){
            if (!err && response.statusCode == 200){

                parseXmlString(body, function(err, result){
                    if (err) throw err;

                    var content = result.rss.channel[0];

                    // Count the number of days
                    var noOfDays = content.item.length;
                    // Get the Key of today
                    var today = noOfDays - 1;
                    // Get the description of today's entry
                    var input = content.item[today].description;

                    var regex = /<li>(.*?)<\/li>/g;
                    var match;
                    var output = [];

                    while(match = regex.exec(input)){
                        output.push(match[1]);
                    }

                    var returnArr = [];

                    for(var i = 0; i < output.length; i++){
                        var item = ''+output[i];

                        var seperator = ' – ',

                            year = item.substring(0, item.indexOf(seperator)),
                            info = item.substring(item.indexOf(seperator) + seperator.length);

                        // Remove (pictured) from the text, as no pictures are printed
                        info = info.replace('(pictured)', '');

                        returnArr.push({
                            year: year, // Add the year
                            info: info // Add the info
                        });

                    }

                    res.render(__dirname, {
                        title: 'On this day',
                        time: moment().format('MMM D YYYY h:mm a'),

                        output: returnArr
                    });

                });

            }
        });

        // A simple function to remove the empty lines from the content returned by Wikipedia
        function removeEmptyLines(string){ return string.replace('/(^[\r\n]*|[\r\n]+)[\s\t]*[\r\n]+/g', '\n'); }

    });

};
