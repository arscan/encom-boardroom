var $ = require("jquery"),
    pushercolor = require("pusher.color"),
    moment = require("moment"),
    LightTable = require("./LightTable.js"),
    EncomGlobe = require("encom-globe"),
    SimpleClock = require("./SimpleClock.js"),
    Box = require("./Box.js"),
    SatBar = require("./SatBar.js"),
    TimerTrees = require("./TimerTrees.js"),
    StockChart = require("./StockChart.js"),
    StockChartSmall = require("./StockChartSmall.js"),
    Swirls = require("./Swirls.js"),
    Logo = require("./Logo.js");

moment.tz = require("moment-timezone");

var boardroomActive = false, 
    globe, 
    satbar, 
    simpleclock, 
    startDate, 
    box, 
    swirls, 
    sliderHeads, 
    slider, 
    lastTime, 
    screensaver, 
    locationAreas, 
    locationAreaColors = [], 
    interactionContainer,
    logo,
    blinkies,
    blinkiesColors = ["#000", "#ffcc00", "#00eeee", "#fff"],
    picIndex = 0,
    currentPics = [],
    lastPicDate = Date.now(),
    streamType,
    readmeContainer;

sliderHeads = {};
var Boardroom = {};

Boardroom.init = function(_streamType, data){

    streamType = _streamType;
    blinkies = $('.blinky');
    mediaBoxes = $('.media-box .user-pic');

    var ratio = $(window).width() / 1918;
    $("#boardroom").css({
        "zoom": ratio,
        "-moz-transform": "scale(" + ratio + ")",
        "-moz-transform-origin": "0 0"
    });
    $("#boardroom").center(ratio);

    readmeContainer = $("#boardroom-readme-" + _streamType);

    Boardroom.data = data;


    $("#fullscreen-link").click(function(e){
        e.preventDefault();
        var el = document.documentElement, 
            rfs = el.requestFullScreen || el.webkitRequestFullScreen || el.mozRequestFullScreen;

        rfs.call(el);

    });

    $("#info-link").click(function(e){
        e.preventDefault();
        showReadme();
    });

    $(".boardroom-readme h2 em").click(function(e){
        e.preventDefault();
        hideReadme();
    });

    setInterval(function(){
        if(boardroomActive){
            $("#san-francisco-time").text(moment().tz("America/Los_Angeles").format("HH:mm:ss"));
            $("#new-york-time").text(moment().tz("America/New_York").format("HH:mm:ss"));
            $("#london-time").text(moment().tz("Europe/London").format("HH:mm:ss"));
            $("#berlin-time").text(moment().tz("Europe/Berlin").format("HH:mm:ss"));
            $("#bangalore-time").text(moment().tz("Asia/Colombo").format("HH:mm:ss"));
            $("#sydney-time").text(moment().tz("Australia/Sydney").format("HH:mm:ss"));
        }
    }, 1000);

    locationAreas = {
        antarctica: {count: 10, ref: $("#location-area-antarctica")},
        northamerica: {count: 10, ref: $("#location-area-northamerica")},
        southamerica: {count: 10, ref: $("#location-area-southamerica")},
        europe: {count: 10, ref: $("#location-area-europe")},
        asia: {count: 10, ref: $("#location-area-asia")},
        australia: {count: 10, ref: $("#location-area-australia")},
        africa: {count: 10, ref: $("#location-area-africa")},
        other: {count: 10, ref: $("#location-area-other")},
        unknown: {count: 10, ref: $("#location-area-unknown")}
    };

    $("#user-interaction-header").text(streamType.toUpperCase() + " LIVE DATA FEED");
    $("#globalization-header").text(streamType.toUpperCase() + " GLOBALIZATION");
    $("#growth-header").text(streamType.toUpperCase() + " HISTORIC PERFORMANCE");
    $("#media-header").text(streamType.toUpperCase() + " USERS");

    $("#ticker-text").text(streamType.toUpperCase());
    if(streamType.length > 6){
        $("#ticker-text").css("font-size", "12pt");
    }

    if(data){
        $("#ticker-value").text(formatYTD(data[0].events, data[data.length-1].events));
    }

    setInterval(function(){
        if(boardroomActive){
            for(var a in locationAreas){
                var loc = locationAreas[a];
                loc.count = loc.count -1;
                loc.count = Math.max(loc.count, 0);

                loc.ref.css("background-color", locationAreaColors[loc.count]);

            }
        }
    }, 3000);

    interactionContainer = $("#interaction > div");

    for(var i = 0; i< 50; i++){
        interactionContainer.append('<ul class="interaction-data"></ul>');
    }
};

Boardroom.show = function(cb){
    startDate = new Date();
    lastTime = Date.now();

    $("#boardroom").css({"visibility": "visible"});
    for(var i = 0; i< 20; i++){
        locationAreaColors[i] = pushercolor('#00eeee').blend('#ffcc00', i/20).hex6();
    }

    //animate();

    // render the other elements intro animations

    $(".footer-bar").delay(1000).animate({"margin-top": "0"}, 500);

    $("#globe-footer img").delay(1500).animate({"opacity": "1"}, 1000);

    $("#globalization").delay(600).animate({
        top: "0px",
        left: "0px",
        width: "180px"
    }, 500);

    $("#globalization .location-slider").each(function(index, element){
        $(element).delay(600 + index * 200).animate({
            width: "180px"
        }, 1000);
    });

    $("#logo-cover-up").delay(3000).animate({
        height: "0px"
    }, 2500);

    $("#logo-cover-side-1").delay(3000).animate({
        left: "200px"
    }, 2500);

    $("#logo-cover-side-2").delay(3000).animate({
        width: "0px"
    }, 2500);

    $("#user-interaction").delay(500).animate({
        width: "600px"
    }, 1500);

    $("#growth").delay(1000).animate({
        width: "600px"
    }, 1500);

    $("#media").delay(1500).animate({
        width: "450px"
    }, 1500);

    $("#timer").delay(2000).animate({
        width: "450px"
    }, 1500);

    $("#bottom-border").delay(100).animate({
        width: "1900px"
    }, 2000);

    setTimeout(function(){
        for(var i = 0; i< 2; i++){
            for(var j = 0; j< 3; j++){
                globe.addSatellite(50 * i - 30 + 15 * Math.random(), 120 * j - 120 + 30 * i, 1.3 + Math.random()/10);
            }
        }
    }, 5000);

    setInterval(function(){
        satbar.setZone(Math.floor(Math.random()*4-1));
    }, 7000);

    setTimeout(function(){
        globe.addMarker(49.25, -123.1, "Vancouver");
        globe.addMarker(35.68, 129.69, "Tokyo", true);
    }, 2000);

    globe = new EncomGlobe(600, 600, {
        tiles: grid.tiles,
        pinColor: "#8FD8D8",
        viewAngle: .1
    });
    $("#globe").append(globe.domElement);


    simpleclock = new SimpleClock("simpleclock");

    globe.init(function(){
        // called after the globe is complete

        // give anything else on the other side a second before starting
        setTimeout(function(){
            box = new Box({containerId: "cube"});
            satbar = new SatBar("satbar");
            timertrees = new TimerTrees("timer-trees");
            stockchart = new StockChart("stock-chart", {data: Boardroom.data});
            stockchartsmall = new StockChartSmall("stock-chart-small", {data: Boardroom.data});
            swirls = new Swirls("swirls");
            logo = new Logo("logo", streamType.toUpperCase());
            boardroomActive = true;
        }, 1000);

        if(typeof cb === "function"){
            cb();
        }
    });

};

Boardroom.hide = function(){
    boardroomActive = false;

    box = null;
    satbar = null;
    timertrees =null;
    stockchart = null;
    stockchartsmall = null;
    swirls = null;
    logo = null;

};

Boardroom.animate = function(){
    if(boardroomActive){
        var animateTime = Date.now() - lastTime;
        lastTime = Date.now();

        globe.tick();
        satbar.tick();
        $("#clock").text(getTime());
        simpleclock.tick();
        box.tick();
        stockchart.tick();
        swirls.tick();
        updateSliders(animateTime);
    }

};

Boardroom.message = function(message){

    if(message.stream != streamType || !globe){
        return;
    }

    if(message.latlon){
        var latlon = message.latlon;
        globe.addPin(latlon.lat, latlon.lon, message.location);
    }
    
    if(message.picSmall || message.picLarge){
        addPic(message);
    }

    if(message.type && swirls){
        swirls.hit(message.type);
    }

    changeBlinkies();
 
    if(interactionContainer && interactionContainer[0].lastChild){
        var lastChild = interactionContainer[0].lastChild;
        lastChild.innerHTML = '<li class="interaction-username">' + message.username + '</li>' + 
            '<li class="interaction-title">' + message.title + '</li>' + 
            '<li class="interaction-type">' + (message.type ? message.type : "") + '</li>' + 
            '<li class="interaction-size">' + (message.size ? message.size : "") + '</li>' + 
            '<li class="interaction-popularity">' + (message.popularity ? message.popularity : "")+ '</li>';

        if(message.popularity > 100){
            lastChild.innerHTML = '<li class="interaction-popular">!</li>' + lastChild.innerHTML;
        }

        interactionContainer[0].insertBefore(interactionContainer[0].lastChild, interactionContainer[0].firstChild);
    }

    createZipdot(message);


};

Boardroom.resize = function(){
    var ratio = $(window).width() / 1918;
    $("#boardroom").css({
        "zoom": ratio,
        "-moz-transform": "scale(" + ratio + ")",
        "-moz-transform-origin": "0 0"
    });

    $("#boardroom").center(ratio);
};

function showReadme() {

    var itemContent = readmeContainer.find(".content");

    readmeContainer.removeAttr("style");

    var height = readmeContainer.height();
    var width = readmeContainer.width();
    var left = ($(window).width() - 500)/ 2;
    var top = ($(window).height() - 500) / 2;

    var border = readmeContainer.css("border");
    var boxShadow = readmeContainer.css("box-shadow");

    var contentBorder = itemContent.css("border");
    var contentBoxShadow = itemContent.css("box-shadow");

    itemContent.children().each(function(index, element){
        $(element).css("visibility", "hidden");
    });

    readmeContainer.height(0)
    .width(0)
    .css("top", top + height/2)
    .css("left", left + width/2)
    .css("visibility", "visible");


    readmeContainer.animate({
        height: height,
        width: "500px",
        left: left,
        top: top

    }, 500);
    readmeContainer.css({
        opacity: 1
    });

    setTimeout(function(){

        itemContent.children().each(function(index, element){
            $(element).css("visibility", "visible");
        });


    }, 1000);

}

function hideReadme(){
    readmeContainer.css("visibility", "hidden");
    readmeContainer.children().each(function(index, element){
        $(element).removeAttr("style");
        $(element).children().each(function(index, element){
            $(element).removeAttr("style");
        });
    });
}

function createZipdot(message){

    var area = "unknown";

    if(message.latlon){
        area = findArea(message.latlon.lat, message.latlon.lon);
        $("#location-city-" + area).text(message.location);
    }

    locationAreas[area].count = locationAreas[area].count + 1;
    locationAreas[area].count = Math.min(19,locationAreas[area].count);
    locationAreas[area].ref.css("background-color", locationAreaColors[locationAreas[area].count]);

    $("#location-slider-" + area + " ul :first-child").css("margin-left", "-=5px");
    $("#location-slider-" + area + " ul").prepend("<li style='color: " + locationAreaColors[locationAreas[area].count] + "'></li>");
    sliderHeads[area] = {area: area, element: $("#location-slider-" + area + " ul :first-child"), margin: 0}; 

};

function changeBlinkies(){
    $(blinkies[Math.floor(Math.random() * blinkies.length)]).css('background-color', blinkiesColors[Math.floor(Math.random() * blinkiesColors.length)]);
}

function addPic(data){
    var pic = data.picSmall;
    var showPic = true;

    if(currentPics.length < 10 || Date.now() - lastPicDate > 2000){

        if($(mediaBoxes[picIndex]).width() > 100){
            pic = data.picLarge;
        }

        for(var i = 0; i< currentPics.length && showPic; i++){
            if(pic.indexOf("http") === 0 && (currentPics[i] == data.picSmall || currentPics[i] == data.picLarge)){
                showPic = false;
            }
        }

        if(showPic){



            var profileImageLoaded = function(ui){
                var mb = $(mediaBoxes[ui]);
                mb.css('background-image', 'url(' + pic + ')');
                mb.find('span').text(data.username);
                mb.off();
                mb.click(function(){window.open(data.userurl, "_blank")});
            };

            if(pic.indexOf("http") === 0){
                var img = document.createElement('img');
                img.addEventListener('load', profileImageLoaded.bind(this, picIndex));
                img.src = pic;
            } else {
                profileImageLoaded(picIndex);
            }

            currentPics[picIndex] = pic;

            picIndex++;
            picIndex = picIndex % 10;

            lastPicDate = Date.now();

        }
    }
}


function updateSliders(animateTime){

    var incDistance = Math.floor(200 * animateTime / 1000);

    var rem = [];
    for(var s in sliderHeads){
        var slider = sliderHeads[s];
        slider.margin += incDistance;
        if(slider.margin > 200){
            rem.push(slider);
        } else {
            slider.element.css("margin-left", slider.margin + "px"); 
        }
    }

    for(var i = 0; i< rem.length; i++){
        delete sliderHeads[rem[i].area];
        rem[i].element.siblings().remove();
    }

    if(Math.random()<.1){
        $(".location-slider ul").each(function(index, val){
                var ch = $(val).children();
                if(ch.length > 10){
                ch.slice(10-ch.length).remove();
                }
                });
    }
}

function findArea(lat, lng){
	// Data are from Daniel Pereira
	// Polygon code from https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html

	const LatNAm = [90,      90, 78.13,  57.5, 15, 15, 1.25, 1.25, 51, 60,   60];
	const LonNAm = [-168.75, -10, -10,  -37.5, -30, -75, -82.5, -105, -180, -180, -168.75];
	const LatNA2 = [51,   51, 60];
	const LonNA2 = [166.6, 180, 180];

	const LatSAm = [1.25,  1.25, 15, 15, -60, -60];
	const LonSAm = [-105, -82.5, -75, -30, -30, -105];

	const LatEur = [90,  90, 42.5, 42.5, 40.79, 41, 40.55, 40.40, 40.05, 39.17, 35.46, 33,  38, 35.42, 28.25, 15, 57.5,78.13];
	const LonEur = [-10, 77.5, 48.8, 30,  28.81, 29, 27.31, 26.75, 26.36, 25.19, 27.91, 27.5, 10, -10, -13,  -30, -37.5, -10]

	const LatAfr = [15, 28.25, 35.42, 38, 33,  31.74, 29.54, 27.78, 11.3, 12.5, -60, -60];
	const LonAfr = [-30, -13,  -10, 10, 27.5, 34.58, 34.92, 34.46, 44.3, 52,   75, -30];

	const LatAus = [-11.88, -10.27, -10, -30,   -52.5, -31.88];
	const LonAus = [110,     140, 145, 161.25, 142.5, 110];

	const LatAsi = [90,  42.5, 42.5, 40.79, 41, 40.55, 40.4, 40.05, 39.17, 35.46, 33,  31.74, 29.54, 27.78, 11.3, 12.5, -60, -60, -31.88, -11.88, -10.27, 33.13, 51,   60, 90];
	const LonAsi = [77.5, 48.8, 30,  28.81, 29, 27.31, 26.75, 26.36, 25.19, 27.91, 27.5, 34.58, 34.92, 34.46, 44.3, 52,  75, 110, 110,  110,   140,   140,  166.6, 180, 180];
	const LatAs2 = [90,    90,      60,      60];
	const LonAs2 = [-180, -168.75, -168.75, -180];

	const LatAnt = [-60, -60, -90, -90];
	const LonAnt = [-180, 180, 180, -180];

	var is_in_polygon = function(lat, lng, plats, plngs) {
		var i, j;
		var r = false;
		// assert(plats.length == plngs.length)
		for(i = 0, j = plats.length - 1; i < plats.length; j = i++) {
			if(((plats[i] > lat) != (plats[j] > lat)) &&
			(lng < (plngs[j] - plngs[i]) * (lat - plats[i]) / (plats[j] - plats[i]) + plngs[i])) {
				r = !r;
			}
		}
		return r;
	};

	if(is_in_polygon(lat, lng, LatSAm, LonSAm)) {
		return "southamerica";
	}
	if(is_in_polygon(lat, lng, LatNAm, LonNAm)) {
		return "northamerica";
	}
	if(is_in_polygon(lat, lng, LatEur, LonEur)) {
		return "europe";
	}
	if(is_in_polygon(lat, lng, LatAsi, LonAsi) || is_in_polygon(lat, lng, LatAs2, LonAs2)) {
		return "asia";
	}
	if(is_in_polygon(lat, lng, LatAus, LonAus)) {
		return "australia";
	}
	if(is_in_polygon(lat, lng, LatAfr, LonAfr)) {
		return "africa";
	}
	if(is_in_polygon(lat, lng, LatAnt, LonAnt)) {
		return "antarctica";
	}

	return "other";
}


function getTime(){

    var elapsed = new Date() - startDate;

    var mili = Math.floor((elapsed/10) % 100);
    var seconds = Math.floor((elapsed / 1000) % 60); 
    var minutes = Math.floor((elapsed / 60000) % 100); 
    var hours = Math.floor((elapsed / 3600000) % 100); 

    return (hours < 10 ? "0":"") + hours + ":" + (minutes < 10 ? "0":"") + minutes + ":" + (seconds< 10? "0": "") + seconds + ":" + (mili < 10? "0" : "") + mili;

}

function formatYTD(first, last){
    var percentage = 100 * (((last- first) / first) - 1);
    var output = percentage.toFixed(1) + "%";
    if(percentage > 0 && percentage < 100){
        output = "+" + output;
    }

    return output;
};

module.exports =  Boardroom;

