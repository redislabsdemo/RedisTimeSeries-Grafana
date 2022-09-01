// This is sample a RedisTimeSeries data source for Grafana.
// Use SimpleJSON data source to connect to this server.

var express = require('express');
var bodyParser = require('body-parser');
var redis = require('redis');
var _ = require('lodash');
var app = express();

// The program connects to Redis using the default port 6379
// To connect to another port, say 8000, run the node app as
// node index.js 8000
var redisPort = process.argv[2] || 6379;
var redisClient = redis.createClient(redisPort);

// Scan 1000 keys at a time
var SCAN_START = 0;
var SCAN_COUNT = 1000;

// RedisTimeSeries data type
var TYPE_TIMESERIES = 'TSDB-TYPE';


app.use(bodyParser.json());

// add options method handler for when setting access=browser in simpleJson
app.use(function (req, res, next) {
  // Allow access request from any computers
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE,PATCH');
  res.header('Access-Control-Allow-Credentials', true);
  if ('OPTIONS' == req.method) {
    res.sendStatus(200);
  } else {
    next();
  }
});

function setCORSHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "accept, content-type");
}


// Runs "key.type" function in batches. scanBatch scans 1000 keys
// at a time and passes those keys to this function. runBatch
// pipelines the calls into one batch, instead of making 1000 calls.
function runBatch(req, res, keys, nextCursor, count, endFlag, tsList){
  batch = redisClient.batch();

  _.each(keys, function(val){
    batch.type(val);
  });

  // Batch call to Redis
  batch.exec( function(err, results){
    if(err){
      console.log("Error"+err);
      return;
    }else{
      var c = 0;
      _.each(results, function(val){
        if(val == TYPE_TIMESERIES){
          tsList.push(keys[c]);
        }
        c++;
      });
      scanBatch(req, res, nextCursor, SCAN_COUNT, endFlag, tsList);
    }
  });
}

// Scans all the keys of type TSDB-TYPE as we are interested only
// in time series data
function scanBatch(req, res, cursor, count, endFlag, tsList){
  if(endFlag){
    //console.log("End cursor");
    //console.log("TS LIST: "+tsList);
    res.json(tsList);
    res.end();
    return;
  }

  // Redis call
  redisClient.send_command('SCAN', [cursor, 'count', count], function (err, results){
    if(err){
      console.log("Error"+err);
    }else{
      endFlag = false;
      if(results[0] == '0'){
        endFlag = true;
      }
      runBatch(req, res, results[1], results[0], SCAN_COUNT, endFlag, tsList);
    }
  });
}


// This function makes a TS.RANGE call to the timeseries database
function runTimeSeriesCommand(req, res, from, to, bucketSizeSeconds, targets, index, responseArray){

    if(targets == null || targets.length <= index){
      console.log("EXIT index:"+index);
      res.json(responseArray);
      res.end();
    }else{

      target = targets[index].target;
      newIndex = index + 1;
      redisClient.send_command('TS.RANGE', [target, from, to, 'AGGREGATION avg', bucketSizeSeconds], function(err, value){
         if(err){
            console.log("Error:"+err);
         }

        var datapoints = [];
         _.each(value, function(val){
             if(val[0] && val[1]){
                 datapoints.push([val[1], val[0]]);
             }
         });
         console.log(datapoints);
         responseArray.push({target, datapoints});

         runTimeSeriesCommand(req, res, from, to, bucketSizeSeconds, targets, newIndex, responseArray);
      });
    }
}

//--------------------------------------------------
// Grafana SimpleJson adapter calls start here
//--------------------------------------------------

// HTTP query 1: "/"
app.all('/', function(req, res) {
  setCORSHeaders(res);
  res.send('I have a quest for you!');
  res.end();
});


// HTTP query 2: "/search"
// Search all keys of type TSDB-TYPE
// This command uses the scan command instead of
// the keys command.
app.all('/search', function(req, res){
  setCORSHeaders(res);
  var tsList = [];
  scanBatch(req, res, SCAN_START, SCAN_COUNT, false, tsList)
});


// HTTP query 3: "/query"
// Translates JSON query to TS query
app.all('/query', function(req, res){
  setCORSHeaders(res);
  console.log(req.url);
  console.log(req.body);

  from = new Date(req.body.range.from).getTime();
  to = new Date(req.body.range.to).getTime();
  bucketSizeSeconds = req.body.intervalMs/1000;
  targets = req.body.targets;

  //console.log(req.body.range.from);
  //console.log(from)
  //console.log(req.body.range.to);
  //console.log(to)
  //console.log(req.body.intervalMs);
  //console.log(bucketSizeSeconds);
  //console.log(req.body.targets);

  var responseArray = [];
  index = 0;
  runTimeSeriesCommand(req, res, from, to, bucketSizeSeconds, targets, index, responseArray);

});


// HTTP query 4: "/annotations"
// Not implemented for now.
app.all('/annotations', function(req, res) {
  setCORSHeaders(res);
  console.log(req.url);
  console.log(req.body);

  res.json(annotations);
  res.end();
});



app.listen(3333);

console.log("Server is listening to port 3333");
