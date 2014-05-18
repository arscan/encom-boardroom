var PORT = Number(process.env.PORT || 8081);
var LOCATIONLOOKUP = "http://loc.robscanlon.com:8080/";
var IPLOOKUP = "http://loc.robscanlon.com:8081/json/";

var request = require("request");
var http = require("http");
var fs = require("fs");
var url = require("url");
var GithubTimelineStream = require("github-timeline-stream");
var WikipediaStream = require("wikipedia-stream");

var githubStream = new GithubTimelineStream();
var wikipediaStream = new WikipediaStream();

var map = require("map-stream");

var whitelist = {
    "/css/boardroom-styles.css": "text/css",
    "/css/global.css": "text/css",
    "/css/light-table-styles.css": "text/css",
    "/css/terminator.woff": "application/octet-stream",
    "/build/encom-boardroom.js": "text/javascript",
    "/index.html": "text/html",
    "/images/encom_folder_xl.png": "image/png",
    "/images/encom_folder_big.png": "image/png",
    "/images/encom_folder_small.png": "image/png",
    "/images/scanlines.png": "image/png",
    "/images/twitter.png": "image/png",
    "/images/keyboard.png": "image/png",
    "/images/GitHub-Mark-Light-32px.png": "image/png",
    "/images/info.png": "image/png",
    "/images/fullscreen.png": "image/png",
    "/images/not_available_small.png": "image/png",
    "/images/not_available_large.png": "image/png",
    "/images/thumbprint.png": "image/png",
    "/js/globe-grid.js": "text/javascript",
    "/js/github-2013.js": "text/javascript"
};

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

function lookupByLocation(loc, cb){
    request.get(LOCATIONLOOKUP + loc, function(error, response, body){
        var latlon = null;
        try{
            latlon = JSON.parse(body);
        } catch (ex){

        }
        cb(latlon);
    });
};

function lookupByIP(ip, cb){
    request.get(IPLOOKUP + encodeURIComponent(ip), function(error, response, body){
        var result = null;
        try{
            result = JSON.parse(body);
        } catch (ex){

        }
        cb(result);
    });
};

http.createServer(function (request, response) {
  var parsedURL = url.parse(request.url, true);
  var pathname = parsedURL.pathname;
  if (pathname === "/events.js") {
      console.log("CONNECTION");

    response.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*"
    });

    response.write(":" + Array(2049).join(" ") + "\n"); // 2kB padding for IE
    response.write("retry: 2000\n");

    var lastEventId = Number(request.headers["last-event-id"]) || Number(parsedURL.query.lastEventId) || 0;

    var sendData = function(data){
        setTimeout(function(){
            response.write("data: " + JSON.stringify(data) + "\n\n");
        }, 6000 * Math.random());
    };

    var formatGithubData = function(data){

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

    var formatWikipediaData = function(data){

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

        
    })).on("data", formatGithubData);


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

    })).on("data", formatWikipediaData);

    response.on("close", function () {
        console.log("disconnecting");
      githubStream.removeListener("data", formatGithubData);
      wikipediaStream.removeListener("data", formatWikipediaData);
    });

  } else {
    if (pathname === "/") {
      pathname = "/index.html";
    }

    if (whitelist[pathname]){
      response.writeHead(200, {
        "Content-Type": whitelist[pathname]
      });

      response.write(fs.readFileSync(__dirname + pathname));

    }
    response.end();
  }
}).listen(PORT);
