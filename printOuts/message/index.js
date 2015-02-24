/* message.js
 *
 * prints out a message from the website
 */

module.exports = function(app, config){

    var moment = require('moment'); // time

    app.get('/message', function(req, res){
        res.render(__dirname, {
            title: 'Message',
            time: moment().format('MMM D YYYY h:mm a'),

            name: req.query.name || 'Anonymous',
            message: req.query.message || '...'
        });
    });

};
