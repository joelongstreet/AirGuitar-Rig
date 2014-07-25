var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));

io.on('connection', function(socket){
  socket.emit('message', {foo: 'bar'});
});

app.get('/', function(req, res){
  res.sendfile('/public/index.html');
});

http.listen(3001, function(){
  console.log('web serve ready and listening on port 3001');
});

var phidget = require('./libs/phidget');
var music = require('./libs/music');
var S3 = require('./libs/S3');
var db = require('./libs/db');
var hooks = require('./libs/hooks');
var countdown = require('./libs/countdown');
var songs = require('./config/songs');
var gopro = null;


var triggerSequence = function(e){
  phidget.setIndicator('in-process');

  var song = songs.lookup(e.phidgetId);
  music.play(song);

  countdown.begin()
    .then(db.getNextShortCode)
    .then(function(shortCode){
      gopro.capture(shortCode, 3000)
        .then(S3.rememberSlowmo)
        .then(db.storeSlowmo)
        .then(hooks.notifySlowmo)
        .then(gopro.deleteCaptures)
        .done(process.exit)
        .fail(handleError);
    });
};


var reset = function(){
  console.log('resetting...');
  phidget.setIndicator('ready');
  music.play('chime');
};


var handleError = function(e){
  console.log(e);
  phidget.setIndicator('error');
};


var connect = function(){
  db.connect()
    .then(function(){
      gopro = require('./libs/gopro');
      gopro.connect()
        .then(function(){
          console.log('All Systems Ready...');
        });
    })
    .fail(function(e){
      console.log(e);
    });
};


phidget.events.on('trigger', triggerSequence);
phidget.events.on('ready', connect);
