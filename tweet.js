var config = require(__dirname + '/config.json'),

    SerialPort = require('serialport').SerialPort,
    serialPort = new SerialPort(config.usbPath, {
        baudrate: config.baudrate
    }),
    Printer = require('thermalprinter'),
    twitter = require('ntwitter');

var creds = {
    consumer_key: '1B5KBUELhN2NY1zuDs0xxyO8p',
    consumer_secret: 'y6XMwwVVTC3CUaZAEYm1DZWa3FF3XVnKNRXLWlvEA0aEFAeWyn',
    access_token_key: '102975831-9JzJ4wuYfXyUuEww1N6UHUFdsl1W4jkqtgSIsLvr',
    access_token_secret: 'XnD4yRh6g95FidbRrMZWvJmuG0nH8B06uMytL2EYdrFEE'
};

var twitterClient = new twitter({
    consumer_key: creds.consumer_key,
    consumer_secret: creds.consumer_secret,
    access_token_key: creds.access_token_key,
    access_token_secret: creds.access_token_secret
});


serialPort.on('open',function() {
    var printer = new Printer(serialPort);
    printer.on('ready', function() {
        twitterClient.stream('statuses/filter', {track: ['#fun']}, function(stream) {
            stream.on('data', function (data) {

                printer
                    .bold(true)
                    .printLine(data.user.name)
                    .bold(false)
                    .printLine(data.text)
                    .lineFeed(3)
                    .print(function() {
                    console.log(data);
                });

            });
        });
    });
});
