var Boardroom = (function($, THREE){

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
       logo,
       blinkies,
       blinkiesColors = ["#000", "#ffcc00", "#00eeee", "#fff"],
       userIndex = 0,
       currentUsers = [],
       lastUserDate = Date.now();

    sliderHeads = {};
    var boardroom = {};

    boardroom.init = function(){
        blinkies = $('.blinky');
        mediaBoxes = $('.media-box .user-pic');

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

        var interactionContainer = $("#interaction > div");

        for(var i = 0; i< 50; i++){
            interactionContainer.append('<ul class="interaction-data"></ul>');
        }
    };

    boardroom.show = function(){
        boardroomActive = true;
        startDate = new Date();
        lastTime = Date.now();

        for(var i = 0; i< 20; i++){
            locationAreaColors[i] = pusher.color('#00eeee').blend('#ffcc00', i/20).hex6();
        }

        //animate();

        // render the other elements intro animations

        $("#fps").delay(100).animate({height: "25px"}, 500).animate({width: "180px"}, 800);

        $("#ms").delay(600).animate({height: "25px"}, 500).animate({width: "180px"}, 800);

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
        }, 4000);

        var interactionContainer = $("#interaction > div")[0];

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

        globe = new ENCOM.Globe(600, 600, {
            scale: 1.05

        });
        $("#globe").append(globe.domElement);


        simpleclock = new ENCOM.SimpleClock("simpleclock");

        globe.init(function(){
            // called after the globe is complete

            box = new ENCOM.Box({containerId: "cube"});
            satbar = new ENCOM.SatBar("satbar");
            timertrees = new ENCOM.TimerTrees("timer-trees");
            stockchart = new ENCOM.StockChart("stock-chart");
            stockchartsmall = new ENCOM.StockChartSmall("stock-chart-small");
            swirls = new ENCOM.Swirls("swirls");
            logo = new ENCOM.Logo("logo");

            var screenSaver = $("#screensaver-info");

            $("#screensaver-info span").text("Initializing...");
            setTimeout(function(){
                $("#screensaver-info span").css("visibility", "hidden");
                screenSaver.animate({
                    opacity: 0,
                },{
                    step: function(now, tween){ 
                        screenSaver.css('transform', 'scale(' + now + ',' + now + '');
                    },
                    duration: 600, 
                    easing: "easeInOutBack", 
                    complete: start});
            }, 2000);
        });

    };

    boardroom.hide = function(){
        boardroomActive = false;

        box = null;
        satbar = null;
        timertrees =null;
        stockchart = null;
        stockchartsmall = null;
        swirls = null;
        logo = null;

    };

    /*
    return {
        init: init,
        show: show,
        hide: hide,
        resize: resize,
        animate: animate
    };
   */

    boardroom.animate = function(){
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

        requestAnimationFrame(animate);
    };


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
        if(lat <= -40){
            return "antarctica";
        }
        if(lat > 12 && lng > -180 && lng < -45){
            return "northamerica";
        }
        if(lat <= 12 && lat > -40 && lng > -90 && lng < -30){
            return "southamerica";
        }
        if(lat < -10 && lng >= 105 && lng <=155){
            return "australia";
        }
        if(lat > 20 && lng >= 60 && lng <=160){
            return "asia";
        }
        if(lat > 10 && lat < 40 && lng >= 35 && lng <=60){
            return "asia";
        }
        if(lat > -40 && lat < 35 && lng >= -20 && lng <=50){
            return "africa";
        }
        if(lat >= 35 && lng >= -10 && lng <=40){
            return "europe";
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

                /*
    function start(){



                setTimeout(function(){
                    StreamServer.onMessage(function (datain) {
                        var chunks = datain.message.split("*");

                        var data = {};
                        if(datain.location){
                            data.location = datain.location.name;
                            if(datain.location.lat && datain.location.lng){
                                data.latlng = {"lat": datain.location.lat, "lng": datain.location.lng};
                                globe.addPin(datain.location.lat, datain.location.lng, datain.location.name);
                            }
                        }

                        data.actor = chunks[3].trim();
                        data.repo = chunks[0].trim();
                        data.type = chunks[5].trim();
                        data.pic = chunks[6].trim();


                        // figure out which one I'm in

                        var area = "unknown";

                        if(data.latlng){
                            area = findArea(data.latlng.lat, data.latlng.lng);
                            $("#location-city-" + area).text(data.location);
                        }


                        locationAreas[area].count = locationAreas[area].count + 1;
                        locationAreas[area].count = Math.min(19,locationAreas[area].count);
                        locationAreas[area].ref.css("background-color", locationAreaColors[locationAreas[area].count]);

                        $("#location-slider-" + area + " ul :first-child").css("margin-left", "-=5px");
                        $("#location-slider-" + area + " ul").prepend("<li style='color: " + locationAreaColors[locationAreas[area].count] + "'/>");
                        sliderHeads[area] = {area: area, element: $("#location-slider-" + area + " ul :first-child"), margin: 0}; 

                        // cleanup

                        var lastChild = interactionContainer.lastChild;
                        lastChild.innerHTML = '<li>' + data.actor + '</li><li>' + data.repo + '</li><li>' + data.type + '</li>';
                        interactionContainer.insertBefore(interactionContainer.lastChild, interactionContainer.firstChild);

                        swirls.hit(data.type);

                        $(blinkies[Math.floor(Math.random() * blinkies.length)]).css('background-color', blinkiesColors[Math.floor(Math.random() * blinkiesColors.length)]);

                        var showUser = true;

                        if(currentUsers.length < 10 || Date.now() - lastUserDate > 1000){

                            for(var i = 0; i< currentUsers.length && showUser; i++){
                                if(currentUsers[i] == data.pic){
                                    showUser = false;
                                }
                            }

                            if(showUser){
                                var img = document.createElement('img');

                                var profileImageLoaded = function(ui){
                                    var mb = $(mediaBoxes[ui]);
                                    mb.css('background-image', 'url(http://0.gravatar.com/avatar/' + data.pic + '?s=' + mb.width() +')');
                                    mb.find('span').text(data.actor);

                                };

                                img.addEventListener('load', profileImageLoaded.bind(this, userIndex));
                                img.src = 'http://0.gravatar.com/avatar/' + data.pic + '?s=' + $(mediaBoxes[userIndex]).width();

                                currentUsers[userIndex] = data.pic;

                                userIndex++;
                                userIndex = userIndex % 10;

                                lastUserDate = Date.now();

                            }
                        }

                    });
                }, 2000);



    }
               */


   return boardroom;

})($, THREE);


