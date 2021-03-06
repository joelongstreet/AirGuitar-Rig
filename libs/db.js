var Q = require('q');
var _ = require('underscore');
var MongoClient = require('mongodb').MongoClient;
var s3Base = 'https://s3.amazonaws.com/air-guitar/';
var client = null;

var slowmos = null;
var analytics = null;

var connect = function(){
  var deferred = Q.defer();
  console.log('connecting to db...');

  MongoClient.connect(process.env.DB_CONNECT, function(err, db){
    client = db;
    if(err) console.log('error connecting to db...', err);
    else console.log('connected to db...');

    slowmos = db.collection('slowmos');
    analytics = db.collection('analytics');

    deferred.resolve();
  });

  return deferred.promise;
};


var saveSong = function(shortCode, song){
  analytics.insert(
    {
      shortCode: shortCode,
      songName: song
    },
    function(err, res){}
  );
};


var getNextShortCode = function(){
  var deferred = Q.defer();

  slowmos
    .find()
    .sort({ _id : 1 })
    .toArray(
      function(err, results){
        if(err){
          // just fulfill it please
          deferred.resolve(rando(500, 10000).toString());
        } else {
          var shortCode = padNumber(0, 5);

          if(results.length !== 0){
            var maxRecord = _.max(results, function(result){
              return parseInt(result.shortCode);
            });

            var currentMax = parseInt(maxRecord.shortCode);
            shortCode = padNumber(currentMax+1, 5);
          }

          deferred.resolve(shortCode);
        }
      }
    );

  return deferred.promise;
};


var getAllSlowmos = function(){
  var deferred = Q.defer();

  slowmos
    .find()
    .toArray(
      function(err, results){
        if(err) deferred.reject(results);
        else deferred.resolve(results.reverse());
      }
    );

  return deferred.promise;
};


var storeSlowmo = function(shortCode){
  var deferred = Q.defer();

  console.log('saving slowmo in database...');
  slowmos.insert(
    {
      shortCode: shortCode,
      mp4: s3Base + shortCode + '.mp4',
      webm: s3Base + shortCode + '.webm',
      poster: s3Base + shortCode + '.jpg'
    },
    function(err, res){
      if(err) deferred.reject(err);
      deferred.resolve(shortCode);
    }
  );

  return deferred.promise;
};


var padNumber = function(num, size){
  var s = num+"";
  while (s.length < size) s = "0" + s;
  return s;
};


var rando = function(min, max){
  return Math.floor(Math.random()*(max-min+1)+min);
};


exports.connect = connect;
exports.storeSlowmo = storeSlowmo;
exports.getNextShortCode = getNextShortCode;
exports.getAllSlowmos = getAllSlowmos;
exports.saveSong = saveSong;
exports.client = function(){
  return client;
};
