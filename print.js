/* print.js
 *
 * helper functions for the printer
 */


module.exports = function(printer){

    return{
        message: printMessage,
        text: printText,
        image: printImage,
        url: printUrl
    };

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

            printImage(imagePath, function(){
                console.log('Finished printing');
                callback();
            });
        });

    }

    function printImage(imagePath, callback){
        printer
            .lineFeed(2)
            .printImage(imagePath)
            .lineFeed(2)
            .print(function(err){
                if (err) throw err;

                console.log(imagePath);
                callback();
            });
    }

    function printText(text, callback){
        printer
            .lineFeed(2)
            .printLine(text)
            .lineFeed(2)
            .print(function(err){
                if (err) throw err;

                console.log('Printing: '+ text);
                callback();
            });
    }

};
