var $ = require("jquery"),
    EventSource = require("event-source")
    Boardroom = require("./Boardroom.js");

require("jquery-ui");

$.fn.center = function () {
    this.css("position","fixed");
    this.css("top", Math.max(0, (($(window).height() - $(this).outerHeight()) / 2 - 40) + 
                             $(window).scrollTop()) + "px");
    this.css("left", Math.max(0, (($(window).width() - $(this).outerWidth()) / 2 - 40) + 
                              $(window).scrollLeft()) + "px");
    return this;
}

var active = "lt";
var es = new EventSource("http://encom-streams.robscanlon.com/events.js");
//var es = new EventSource("/events.js");
var listener = function (event) {
    var div = document.createElement("div");
    var type = event.type;
    if(type === "message"){
        if(active === "lt"){
            LightTable.message(JSON.parse(event.data));
        } else {
            Boardroom.message(JSON.parse(event.data));
        }
    // } else {
    //console.log(event.data);
    }
};
es.addEventListener("open", listener);
es.addEventListener("message", listener);
es.addEventListener("error", listener);

var onSwitch = function(view){
    var screensaver = $("#screensaver");
    screensaver.center();
    screensaver.css({visibility: "visible"});

    screensaver.delay(3000).animate({ opacity: 0 },{ 
        step: function(now, tween){ 
            screensaver.css('transform', 'scale(' + now + ',' + now + '');
        },
        duration: 600, 
        easing: "easeInOutBack"});

    if(view === "github"){

        screensaver.text("GITHUB");
        LightTable.hide();
        Boardroom.init(onSwitch);

        setTimeout(function(){
            active = "br";
            Boardroom.show();
        }, 3000)

    } else if (view === "wikipedia"){
        $("#screensaver").text("WIKIPEDIA");
        LightTable.hide();

    } else if (view === "lighttable") {


    }


};

var showWebglError = function(){


};

$(function(){
        console.log("LOADED");


    //console.log("-----");
    //console.log(LightTable);
    try {
        LightTable.init(onSwitch);

    } catch (ex){

        
        $("#error-message")
           .css("visibility", "visible")
           .center();

        console.log(ex);

        return;


    }
    $("#light-table").center();
    $("#boardroom").center();
    LightTable.show();

    // Boardroom.init(onSwitch);
    // Boardroom.show();

    var animate = function(){

        if(active === "lt"){
            LightTable.animate();
        } else {
            Boardroom.animate()
        }

        requestAnimationFrame(animate);
    };

    animate();

    /*
       setTimeout(function(){
       LightTable.hide();
       active = "br-gh";
       }, 5000);
       setTimeout(function(){
       LightTable.show();
       active = "lt";
       }, 10000);
       */

    //setTimeout(LightTable.hide,5000);
    //setTimeout(LightTable.show,7000);

    var timeout = 0;
    function onWindowResize(){

        if(active === "lt"){
            LightTable.resize();
        } else {
            Boardroom.resize();
        }
    }

    window.addEventListener( 'resize', onWindowResize, false );

});

