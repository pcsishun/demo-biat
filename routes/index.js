var log = require('debug')('app.js'),
    express = require('express'),
	router = express.Router(),
	fs = require('fs'),
	yaml = require('yaml-config'),
    path = require('path');

var settings = yaml.readConfig(__dirname + '/../config/server-config.yml'),
    LOGDIRECTORY = process.env.LOGDIR, //__dirname + '/../../' + settings.logDirectory,
    LOGFILEEXTENSION = '.log',
    OKRESPONSE = {'status': 'ok'};
    FORMATERROR = {'status': 'error', 'info': 'malformed json request'};


function getIP(request) {
    return request.headers['x-forwarded-for'] ||
    request.connection.remoteAddress ||
    request.socket.remoteAddress ||
    request.connection.socket.remoteAddress;
}

/* GET home page. */
router.get('/', function(req, res, next) {
  // res.render('index', { title: 'Log Server' });
  // res.sendFile(path.join(__dirname + '/views/index.html'));
  log('!rendering playground by default');
  // console.log('client request from IP: ' + getIP(req));
  res.render('playground', {title: 'BIAT Playground', biatConfig: JSON.stringify(req.biatConfig)});
});

/* save POST request to file */
router.post('/', function(req, res, next) {

    // req.body = JSON.stringify(req.body);

    console.log("POST request received:");
    console.log(req.body);

  	var settings,
  		data,
  		participant_id,
  		ts = Date.now(),
        logfile,
        valid_request = true,
        NEWLINE = '\r\n';

    if(req.body.settings) {
        settings = req.body.settings;
        // add ip address to settings object
        // req.body.settings.IP = getIP(req); //req.connection.remoteAddress;
    } else {
        valid_request = false;
        FORMATERROR['err'] = 'missing settings object';
    }

    if(req.body.data) {
        data = req.body.data;
    } else {
        valid_request = false;
        FORMATERROR['err'] = 'missing data object';
    }

    if(valid_request && settings.participant_id) {
        participant_id = settings.participant_id;
    } else {
        valid_request = true;
        participant_id = 'anonymous';
        FORMATERROR['warning'] = 'missing participant_id in settings object: data saved anonymously';
    }

    if(valid_request) {

        logfile = LOGDIRECTORY + participant_id + LOGFILEEXTENSION;

        fs.exists(logfile, function(exists) {
            var line = JSON.stringify(req.body) + NEWLINE;
            if (!exists) {
                fs.writeFile(logfile, line, function(err) {
                    if(err) {
                        console.log(err);
                        res.send(err);
                    } else {
                        console.log("+post request written to: " + logfile);
                        res.send(OKRESPONSE);
                    }
                })
            } else {
                fs.appendFile(logfile, line, function(err) {
                    if(err) {
                        console.log(err);
                        res.send(err);
                    } else {
                        console.log("+post request appended to: " + logfile); //" to: " + postRequestsLog);
                        res.send(OKRESPONSE);
                    }
                }); 
            }
        });
    } else {
        res.send(FORMATERROR);
    }
});

module.exports = router;