// requieres and set-up
var express = require('express')
  , http = require('http')
  , mysql = require('sync-mysql');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);


// routes
app.get('/', function(req, res){
    res.sendfile(__dirname + '/index.html');
});

app.get('/getInitVals', function(req, res){
    var initData = getInitDbData();
    res.send(JSON.stringify(initData));
});

// data counters
var durations = [];
var avgDuration = 0;
var answered = 0;
var topEmp = {};

var lost = 0;
var inQueue = 0;
var lostCountries = {};

var serviceScores = [];
var avgService = 0;
var waitingTimes = [];
var avgWaiting = 0;
var topReasons = {};

var getAvgVal = function (arr, val) {
    var avgsLengths = 100;
    if (arr.length < avgsLengths) {
        arr.push(val);
    } else {
        arr.shift();
        arr.push(val);
    };
    return parseFloat(((arr.reduce(function(a, b) { return a + b; }, 0))/arr.length).toFixed(2));
};

var getTopVal = function (dict, val) {
    if (val in dict) {
        dict[val] += 1;
    } else {
        dict[val]=1
    };
    return dict
};

var getTopFromObj = function (dict) {
    var len = 6
    var pairs = Object.entries(dict)
    pairs = pairs.sort(function(a, b) {
        return a[1] < b[1] ? 1 : -1;
    }).slice(0,len)

    if (pairs.length === 0) {
        return []
    } else if (pairs.length < len) {
        len = pairs.length
    } 

    var top_array = []
    console.log('your pairs are: ', pairs)
    for (i=0; i<len; i++) {
        top_array.push({'key':pairs[i][0],
                        'val':pairs[i][1]})
    }
    return top_array
}

var getInitDbData = function () {
    console.log(' DB1 -> before creating of connection')
    var con = new mysql({
              host: "localhost",
              user: "slaw",
              password: "slaw123",
              database: "call_center"
            });

    var no_of_answered = con.query("SELECT date, value FROM init_records WHERE tbl = 'no_of_answered';");
    var calls_in_queue = con.query("SELECT date, value FROM init_records WHERE tbl = 'calls_in_queue';");
    var avg_wait_time = con.query("SELECT date, value FROM init_records WHERE tbl = 'avg_wait_time';");
    console.log(" DB2 -> connection made and queries executed");
    return {'no_of_answered':no_of_answered,
            'calls_in_queue':calls_in_queue,
            'avg_wait_time':avg_wait_time}
};

async function tick (interval) {
    setInterval(function() {
        msgToEmit = {
            "type": "nearRealTime",
            "no_answ_c": answered,
            "no_c_in_que": inQueue,
            "avg_t_waiting": avgWaiting
        }
        console.log('TICKING! : ', msgToEmit)
        io.sockets.emit('channel', msgToEmit);
        }, interval);
}


async function spin_consumer() {
    console.log(' 2) before consumer creation')

    var initData = getInitDbData();
    answered = initData["no_of_answered"][initData["no_of_answered"].length-1].value
    inQueue = initData["calls_in_queue"][initData["calls_in_queue"].length-1].value
    avgWaiting = initData["avg_wait_time"][initData["avg_wait_time"].length-1].value

    var kafka = require('kafka-node'),
        HighLevelConsumer = kafka.HighLevelConsumer,
        client = new kafka.Client('127.0.0.1:2181'),
        consumer = new HighLevelConsumer(
            client,
            [
                { topic: 'test' }
            ],
            {
                groupId: 'whatever'
            }
        )

    console.log(' 3) before listening of kafka msg event')
    
    // consume and edit data
    consumer.on('message', function (message) {
        
        var msg = JSON.parse(message.value);

        if (msg.type === 'incoming') {
            inQueue += 1
        } else if (msg.type === 'resolved') {
            inQueue -= 1
            answered += 1
            avgDuration = getAvgVal(durations, msg.duration);
            avgService = getAvgVal(serviceScores, msg.qualityScore);
            avgWaiting = getAvgVal(waitingTimes, msg.waitingTime);
            topEmp = getTopVal(topEmp, msg.employee);
            topReasons = getTopVal(topReasons, msg.reason);
        } else if (msg.type === 'lost') {
            inQueue -= 1;
            lost += 1;
            avgWaiting = getAvgVal(waitingTimes, msg.waitingTime);
            lostCountries = getTopVal(lostCountries, msg.country);
        };
        
        msgToEmit = {
            "type": "realTime",
            "avg_call_dur": avgDuration,
            "lost_calls": lost,
            "avg_serv_q_scr": avgService,
            "top_emp": getTopFromObj(topEmp),
            "lost_cntrs": getTopFromObj(lostCountries),
            "top_reasons": getTopFromObj(topReasons)
        }

        console.log(msgToEmit)
        io.sockets.emit('channel', msgToEmit);

    });

}

console.log(' 1) starting to work')
spin_consumer()
console.log(' 4) consumer event should now work properly in background')
tick(600)
console.log(' 5) tick is now also in background')

server.listen(8080);
