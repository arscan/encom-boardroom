var PORT = Number(process.env.PORT || 5000);
var LOCATIONLOOKUP = "http://loc.robscanlon.com:8080/";

var request = require("request");
var http = require("http");
var fs = require("fs");
var url = require("url");
var GithubTimelineStream = require("github-timeline-stream");
var githubStream = new GithubTimelineStream();

function lookup(loc, cb){
    request.get(LOCATIONLOOKUP + loc, function(error, response, body){
        var latlon = null;
        try{
            latlon = JSON.parse(body);

        } catch (ex){

        }

        cb(latlon);
    });


};

http.createServer(function (request, response) {
  var parsedURL = url.parse(request.url, true);
  var pathname = parsedURL.pathname;
  if (pathname === "/events.js") {

    response.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*"
    });

    response.write(":" + Array(2049).join(" ") + "\n"); // 2kB padding for IE
    response.write("retry: 2000\n");

    var lastEventId = Number(request.headers["last-event-id"]) || Number(parsedURL.query.lastEventId) || 0;


    var count = 0;
    var sendData = function(data){
        count++;

        if(data.actor_attributes && data.actor_attributes.location){
            lookup(data.actor_attributes.location, function(latlon){
                if(latlon){
                    data.actor_attributes.latlon = {
                        lat: parseFloat(latlon.lat),
                        lon: parseFloat(latlon.lng)
                    };
                }
                response.write("data: " + JSON.stringify(data) + "\n\n");
            });

        } else {
            response.write("data: " + JSON.stringify(data) + "\n\n");
        }

    };

    githubStream.on("data", sendData);


    /*
    var timeoutId = 0;
    var i = lastEventId;
    var c = i + 100;
    var f = function () {
      if (++i < c) {
        response.write("id: " + i + "\n");
        response.write("data: " + i + "\n\n");
        timeoutId = setTimeout(f, 1000);
      } else {
        response.end();
      }
    };

    f();

   */

    response.on("close", function () {
      githubStream.removeListener("data", sendData);
    });

  } else {
    if (pathname === "/") {
      pathname = "/index.html";
    }
    if (pathname === "/index.html" || pathname === "../eventsource.js") {
      response.writeHead(200, {
        "Content-Type": pathname === "/index.html" ? "text/html" : "text/javascript"
      });
      response.write(fs.readFileSync(__dirname + pathname));
    }
    response.end();
  }
}).listen(PORT);
