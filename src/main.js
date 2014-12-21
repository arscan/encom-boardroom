var $ = require("jquery"),
    EventSource = require("event-source"),
    Boardroom = require("./Boardroom.js"),
    PleaseRotate = require("pleaserotate.js"),
    init = false;

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
var esPath = "/events.js";
if(window._esPath){
    esPath = window._esPath;
}
var es = new EventSource(esPath);
var listener = function (event) {
    var div = document.createElement("div");
    var type = event.type;
    if(type === "message"){
        if(active === "lt"){
            LightTable.message(JSON.parse(event.data));
        } else {
            Boardroom.message(JSON.parse(event.data));
        }
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
        Boardroom.init("github", window.githubHistory);

        setTimeout(function(){
            active = "br";
            Boardroom.show();
        }, 3000)

    } else if (view === "wikipedia"){
        $("#screensaver").text("WIKIPEDIA");
        LightTable.hide();
        Boardroom.init("wikipedia");
        setTimeout(function(){
            active = "br";
            Boardroom.show();
        }, 3000)

    } else if (view === "test"){
        $("#screensaver").text("TEST DATA");
        LightTable.hide();
        Boardroom.init("test");
        setTimeout(function(){
            active = "br";
            Boardroom.show();
        }, 3000)

        /* lets just throw some data in there */

        setInterval(function(){
            if(Boardroom){
                Boardroom.message({
                    stream: 'test',
                    latlon: {
                        lat: Math.random() * 180 - 90,
                        lon: Math.random() * 360 - 180
                    },
                    location: 'Test ' + Math.floor(Math.random() * 100),
                    type: 'Type ' + Math.floor(Math.random() * 8),
                    picSmall: 'images/not_available_small.png',
                    picLarge: 'images/not_available_large.png',
                    username: "arscan" + Math.floor(Math.random()*1000),
                    userurl: "http://github.com/arscan",
                    title: "Test " + Math.floor(Math.random() * 100),
                    url: "http://github.com/arscan/encom-boardroom/",
                    size: Math.floor(Math.random()*10000),
                    popularity: Math.floor(Math.random()*10000)
                });
            }

        }, 800);
    }

};

PleaseRotate.start({onHide: function(){
    if(init){
        return;
    }
    init = true;
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

    var animate = function(){

        if(active === "lt"){
            LightTable.animate();
        } else {
            Boardroom.animate()
        }

        requestAnimationFrame(animate);
    };

    animate();

    var timeout = 0;
    function onWindowResize(){

        if(active === "lt"){
            LightTable.resize();
        } else {
            Boardroom.resize();
        }
    }

    window.addEventListener( 'resize', onWindowResize, false );

}});

