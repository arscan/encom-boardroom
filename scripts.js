var globe, stats, satbar, locationbar, simpleclock, startDate, box, swirls;

startDate = new Date();

function animate(){

    globe.tick();
    satbar.tick();
    locationbar.tick();
    $("#clock").text(getTime());
    simpleclock.tick();
    box.tick();
    stockchart.tick();
    swirls.tick();
    requestAnimationFrame(animate);
    stats.update();

}

function getTime(){

    var elapsed = new Date() - startDate;

    var mili = Math.floor((elapsed/10) % 100);
    var seconds = Math.floor((elapsed / 1000) % 60); 
    var minutes = Math.floor((elapsed / 60000) % 100); 
    var hours = Math.floor((elapsed / 3600000) % 100); 

    return (hours < 10 ? "0":"") + hours + ":" + (minutes < 10 ? "0":"") + minutes + ":" + (seconds< 10? "0": "") + seconds + ":" + (mili < 10? "0" : "") + mili;

}

function start(){
    $("#splash").css("display","none");

    // the globe and other canvas-based renders will render their intros automatically
    // so start the render loop
    animate();


    var mediaBoxes = $('.media-box .user-pic');
    var blinkies = $('.blinky');
    var blinkiesColors = ["#000", "#ffcc00", "#00eeee", "#fff"];

    // render the other elements intro animations

    $("#fps").delay(100).animate({
        height: "25px"
    }, 500).animate({
        width: "180px"}, 800);

        $("#ms").delay(600).animate({
            height: "25px"
        }, 500).animate({
            width: "180px"}, 800);

            $("#globalization").delay(600).animate({
                top: "0px",
                left: "0px",
                width: "180px"
            }, 500);

            $("#user-interaction").delay(600).animate({
                width: "600px"
            }, 500);

            $("#growth").delay(500).animate({
                width: "600px"
            }, 500);

            $("#media").delay(1000).animate({
                width: "450px"
            }, 500);

            $("#timer").delay(1000).animate({
                width: "450px"
            }, 500);


            

            setTimeout(function(){
                StreamServer.onMessage(function (datain) {
                    var chunks = datain.message.split("*");
                    
                    var data = {};
                    if(datain.location){
                       data.location = datain.location.name;
                       if(datain.location.lat && datain.location.lng){
                           data.latlng = {"lat": datain.location.lat, "lng": datain.location.lng};
                            globe.addMarker(datain.location.lat, datain.location.lng, datain.location.name);
                       }
                    }
                    
                    data.actor = chunks[3].trim();
                    data.repo = chunks[0].trim();
                    data.type = chunks[5].trim();
                    data.pic = chunks[6].trim();


                    swirls.hit(data.type);

                    if(Math.random() < .05){
                        var mb = $(mediaBoxes[Math.floor(Math.random() * mediaBoxes.length)]);
                        mb.css('background-image', 'url(http://0.gravatar.com/avatar/' + data.pic + '?s=' + mb.width() +')');
                        mb.find('span').text(data.actor);
                    }

                    $(blinkies[Math.floor(Math.random() * blinkies.length)]).css('background-color', blinkiesColors[Math.floor(Math.random() * blinkiesColors.length)]);
                    
                });
            }, 2000);


            setTimeout(function(){
                for(var i = 0; i< 2; i++){
                    for(var j = 0; j< 4; j++){
                        
                        globe.addSatellite(50 * i - 30 + 15 * Math.random(), 90 * j - 120 + 30 * i, 1.3 + Math.random()/10);
                    }
                }
            }, 5000);

            setInterval(function(){
                satbar.setZone(Math.floor(Math.random()*4-1));
            }, 7000);

            setTimeout(function(){
                globe.addConnectedPoints(49.25, -123.1, "Vancouver", 35.68, 129.69, "Tokyo");
            }, 2000);

            setInterval(function(){
                $("#san-francisco-time").text(moment().tz("America/Los_Angeles").format("HH:mm:ss"));
                $("#new-york-time").text(moment().tz("America/New_York").format("HH:mm:ss"));
                $("#london-time").text(moment().tz("Europe/London").format("HH:mm:ss"));
                $("#berlin-time").text(moment().tz("Europe/Berlin").format("HH:mm:ss"));
                $("#bangalore-time").text(moment().tz("Asia/Colombo").format("HH:mm:ss"));
                $("#sydney-time").text(moment().tz("Australia/Sydney").format("HH:mm:ss"));
            }, 1000);

}

$(function() {
    // not sure why I need this setTimeout... gonna leave for now though
    // otherwise, sometimes it seems like some things aren't loaded properly
    setTimeout(function(){
        globe = new ENCOM.globe({containerId: "globe"});

        locationbar = new ENCOM.LocationBar("locationbar", {
            "North America": {
                "label1": "North Ameria",
                "label2": "United States",
                "points": [.1,.2,.5,.7,.9]
            },
            "South America": {
                "label1": "South America",
                "label2": "United States",
                "points": [.1,.2,.5,.7,.9]
            },
            "Europe": {
                "label1": "Europe",
                "label2": "United States",
                "points": [.1,.2,.5,.7,.9]
            },
            "Asia": {
                "label1": "Asia",
                "label2": "United States",
                "points": [.1,.2,.5,.7,.9]
            },
            "Africa": {
                "label1": "Africa",
                "label2": "Great Britian",
                "points": [.2,.25,.4,.8,.9]
            },
            "Australia": {
                "label1": "Australia",
                "label2": "Great Britian",
                "points": [.2,.25,.4,.8,.9]
            },
            "blank": {
                "blank": true
            },
            "New York": {
                "label1": "New York",
                "label2": "United States",
                "points": [.1,.2,.5,.7,.9]
            },
            "Boston": {
                "label1": "Boston",
                "label2": "Great Britian",
                "points": [.2,.25,.4,.8,.9]
            },
            "Germany": {
                "label1": "Germany",
                "label2": "Great Britian",
                "points": [.2,.25,.4,.8,.9]
            },
            "blank2": {
                "blank": true
            },
            "Everywhere": {
                "label1": "Everywhere",
                "label2": "United States",
                "points": [.1,.2,.5,.7,.9]
            },
        });

        simpleclock = new ENCOM.SimpleClock("simpleclock");

        globe.init(function(){
            // called after the globe is complete

            box = new ENCOM.Box({containerId: "cube"});
            stats = new Stats(document.getElementById("fps-stats"), document.getElementById("ms-stats"));
            satbar = new ENCOM.SatBar("satbar");
            timertrees = new ENCOM.TimerTrees("timer-trees");
            stockchart = new ENCOM.StockChart("stock-chart");
            stockchartsmall = new ENCOM.StockChartSmall("stock-chart-small");
            swirls = new ENCOM.Swirls("swirls");

            $("#logo").animate({
                fontSize: "40px",
                opacity: 0
            }, 2000, "easeInOutBack", start
                              );

        });
    }, 10);

});



