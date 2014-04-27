var $ = require("jquery"),
    EventSource = require("event-source")
    Boardroom = require("./Boardroom.js");

console.log(Boardroom);


var active = "br";
var es = new EventSource("http://localhost:8081/events.js");
var listener = function (event) {
    var div = document.createElement("div");
    var type = event.type;
    if(type === "message"){
        //console.log(event.data);
    } else {
        //console.log(event.data);
    }
};
es.addEventListener("open", listener);
es.addEventListener("message", listener);
es.addEventListener("error", listener);

var onSwitch = function(view){
    $("#screensaver").css({visibility: "visible"});

    if(view === "github"){

        $("#screensaver").text("GITHUB");
        LightTable.hide();

    } else if (view === "wikipedia"){
        $("#screensaver").text("WIKIPEDIA");
        LightTable.hide();

    } else if (view === "lighttable") {


    }


};
$(function(){

    active = "br";

    //console.log("-----");
    //console.log(LightTable);
    // LightTable.init(onSwitch);
    // LightTable.show();

    Boardroom.init(onSwitch);
    Boardroom.show();

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
        }
    }

    window.addEventListener( 'resize', onWindowResize, false );

});

