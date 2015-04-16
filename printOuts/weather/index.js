/* weather.js
 *
 * prints out a weather forecast
 */

module.exports = function(app){

    var moment = require('moment'), // time

        Forecast = require('forecast.io'),
        forecast = new Forecast({ APIKey:  process.env.FORECASTIO_API });

    app.get('/weather', function(req, res) {

        var location = {
            latitude: 50.7903503,
            longitude: -1.0661844
        };

        getWeatherForecast(location, function(days){

            res.render(__dirname, {
                title: 'Weather',
                time: moment().format('MMM D YYYY H:mm'),

                days: days
            });

        });

    });

    function getWeatherForecast(location, callback){
        forecast.get(location.latitude, location.longitude, function (err, forecastRes, data) {
            if (err) throw err;

            var days = [];

            daysData = data.daily.data;

            daysData.forEach(function(dayData){

                var day = {
                    name: moment.unix(dayData.time).format('ddd'),
                    temp: Math.floor((dayData.apparentTemperatureMin + dayData.apparentTemperatureMax) / 2),
                    summary: dayData.summary
                };

                days.push(day);
            });

            callback(days);

        });
    }

};
