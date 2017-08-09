/* portions based on http://www.smartjava.org/content/html5-server-sent-events-angularjs-nodejs-and-expressjs */

var express = require('express'),
  http = require('http'),
  os = require('os'),
  path = require('path'),
  url = require("url"),
  map = require("map-stream"),
  request = require("request");

// some helper services
var LOCATIONLOOKUP = "http://localhost:8080/",
  IPLOOKUP = "http://localhost:8081/json/",
  USERLOOKUP = "http://localhost:8082/users/",
  REPOLOOKUP = "http://localhost:8082/repos/";

// env vars
var PORT = process.env.PORT || 8081,
    GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// express middleware
var favicon = require('serve-favicon');

// create the streams
var GithubTimelineStream = require("github-timeline-stream"),
    WikipediaStream = require("wikipedia-stream");

var githubStream = new GithubTimelineStream({token: GITHUB_TOKEN}),
    wikipediaStream = new WikipediaStream();

console.log("UP ON PORT: " + PORT);
 
// create the app
var app = express();
 
// configure everything, just basic setup
app.set('port', PORT);
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
 
    req.socket.setTimeout(Number.MAX_VALUE);
 
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
    openConnections.forEach(function(resp) {
        resp.write('id: ' + Date.now() + '\n');
        resp.write('data:' + JSON.stringify(data) +   '\n\n');
    });
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

    outdata.action = data.type;

    /* TODO: REFACTOR TO USE ASYNC */

    if(data.actor){
        if(data.actor.avatar_url && data.actor.avatar_url.length > 0){
            outdata.picSmall = data.actor.avatar_url + 's=89';
            outdata.picLarge = data.actor.avatar_url + 's=184';
        }
        outdata.username = data.actor.login;
        outdata.userurl = "http://github.com/" + data.actor.login + "/";
        
        request.get(USERLOOKUP + data.actor.login, function(error, response, body){
            if(error){
                console.log("error looking up user..." + error);
            }

            try{
                var actorInfo = JSON.parse(body);

                if(actorInfo.location){
                    outdata.location = actorInfo.location;
                }
            } catch(ex) {
                console.log("error looking up user... " + ex);
            }

            if(data.repo){
                outdata.title = data.repo.name;
                outdata.url = data.repo.url;

                request.get(REPOLOOKUP + data.repo.name, function(error, response, body){
                    if(error){
                        console.log("error looking up repo..." + error);
                    }

                    try{
                        var repoInfo = JSON.parse(body);

                        outdata.size = repoInfo.size;
                        outdata.popularity = repoInfo.stargazers_count;
                        outdata.type = repoInfo.language;
                    } catch(ex) {
                        console.log("error looking up repo... " + ex);
                    }

                    callback(null, outdata);
                })
            } else {
                callback(null, outdata);
            }

        });
    } else {
        callback(null, outdata);
    }

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
