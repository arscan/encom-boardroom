/* portions based on http://www.smartjava.org/content/html5-server-sent-events-angularjs-nodejs-and-expressjs */

var express = require('express'),
  http = require('http'),
  os = require('os'),
  path = require('path'),
  url = require("url"),
  map = require("map-stream"),
  request = require("request");

// some helper services
var LOCATIONLOOKUP = "http://loc.robscanlon.com:8080/",
  IPLOOKUP = "http://loc.robscanlon.com:8081/json/";

// express middleware
var favicon = require('serve-favicon');

// create the streams
var GithubTimelineStream = require("github-timeline-stream"),
    WikipediaStream = require("wikipedia-stream");

var githubStream = new GithubTimelineStream(),
    wikipediaStream = new WikipediaStream();
 
// create the app
var app = express();
 
// configure everything, just basic setup
app.set('port', process.env.PORT || 8081);
app.use(favicon("images/favicon.ico"));
app.use("/js", express.static(path.join(__dirname, 'js')));
app.use("/images", express.static(path.join(__dirname, 'images')));
app.use("/css", express.static(path.join(__dirname, 'css')));
app.use("/build", express.static(path.join(__dirname, 'build')));
app.enable('trust proxy');

var openConnections = [];

app.get('/', function(req, res){
    res.sendfile(__dirname + "/index.html");
});
 
app.get('/events.js', function(req, res) {
 
    req.socket.setTimeout(Infinity);
 
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });
    res.write('\n');

    openConnections.push(res);
    console.log("New Connection.  Current Connections: " + openConnections.length);
 
    req.on("close", function() {
        var toRemove;
        for (var j =0 ; j < openConnections.length ; j++) {
            if (openConnections[j] == res) {
                toRemove =j;
                break;
            }
        }
        openConnections.splice(j,1);
        sendData({
            stream: "meta",
            type: "disconnect",
            size: openConnections.length
        });
        console.log("Closed Connection. Current Connections: " + openConnections.length);
    });

    sendData({
        stream: "meta",
        type: "connect",
        size: openConnections.length
    });
});

setInterval(function(){
    sendData({
        stream: "meta",
        type: "heartbeat",
        size: openConnections.length
    });
}, 3000);

var sendData = function(data){

    setTimeout(function(){
        openConnections.forEach(function(resp) {
            resp.write('id: ' + Date.now() + '\n');
            resp.write('data:' + JSON.stringify(data) +   '\n\n');
        });
    }, 6000 * Math.random()); // spreading things out a bit
};


/* helpers to reformat the data */
/* should probably split this out */

var wikipediaLanguageMap = {
    "en": "English",
    "zh": "Chinese",
    "fr": "French",
    "ru": "Russian",
    "es": "Spanish",
    "it": "Italian",
    "pt": "Portuguese",
    "nl": "Dutch",
    "de": "German",
    "sv": "Swedish",
    "vi": "Vietnamese",
    "ja": "Japanese"
}

var lookupByLocation = function(loc, cb){
    request.get(LOCATIONLOOKUP + loc, function(error, response, body){
        var latlon = null;
        try{
            latlon = JSON.parse(body);
        } catch (ex){

        }
        cb(latlon);
    });
};

var formatAndSendGithubData = function(data){

    if(data.location){
        lookupByLocation(data.location, function(latlon){
            if(latlon){
                data.latlon = {
                    lat: parseFloat(latlon.lat),
                    lon: parseFloat(latlon.lng)
                };
            }
            sendData(data);
        });

    } else {
        sendData(data);
    }
};

var lookupByIP = function(ip, cb){
    request.get(IPLOOKUP + encodeURIComponent(ip), function(error, response, body){
        var result = null;
        try{
            result = JSON.parse(body);
        } catch (ex){

        }
        cb(result);
    });
};

var formatAndSendWikipediaData = function(data){

    if(data.ip){
        lookupByIP(data.ip, function(result){
            if(result){
                if(result.latitude && result.longitude){
                    data.latlon = {
                        lat: result.latitude,
                        lon: result.longitude
                    };
                }
                if(result.city && result.city.length){
                    data.location = result.city + ", " + result.country_code;
                } else {
                    data.location = result.country_name;

                }
            }
            sendData(data);
        });
    } else {
        sendData(data);
    }

};

githubStream.pipe(map(function(data, callback){

    var outdata = {
        stream: "github",
        ip: null
    };

    if(data.actor_attributes && data.actor_attributes.location){
        outdata.location = data.actor_attributes.location;
    }

    if(data.actor_attributes && data.actor_attributes.gravatar_id){
        outdata.picSmall = 'http://0.gravatar.com/avatar/' + data.actor_attributes.gravatar_id + '?s=89';
        outdata.picLarge = 'http://0.gravatar.com/avatar/' + data.actor_attributes.gravatar_id + '?s=184';
    }

    if(data.actor){
        outdata.username = data.actor;
        outdata.userurl = "http://github.com/" + data.actor + "/";
    }

    if(data.repository){
        outdata.title = data.repository.name;
        outdata.url = data.repository.url;
        outdata.size = data.repository.size;
        outdata.popularity = data.repository.stargazers;

        if(data.repository.language){
            outdata.type = data.repository.language;
        }
    }

    outdata.action = data.type;

    callback(null, outdata);
})).on("data", formatAndSendGithubData);


wikipediaStream.pipe(map(function(data, callback){
    var outdata = {
        stream: "wikipedia",
        location: null,
        title: data.page,
        type: data.language,
        url: data.url,
        size: parseInt(data.size, 10),
        ip: data.ip,
        username: data.user,
        action: data.type
    };

    if(data.user){
        outdata.picSmall = 'images/not_available_small.png';
        outdata.picLarge = 'images/not_available_large.png';
        outdata.userurl = "http://" + data.language + ".wikipedia.org/wiki/User:" + data.user;
    }

    if(data.language && wikipediaLanguageMap[data.language]){
        outdata.type = wikipediaLanguageMap[data.language];
    }

    callback(null, outdata);

})).on("data", formatAndSendWikipediaData);

// startup everything
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
})
