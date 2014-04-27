var Utils = require("./Utils.js");

var SatBar = function(canvasId){
    this.canvas = document.getElementById(canvasId);
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.context = this.canvas.getContext("2d");

    // this.context.font = "8pt Arial";
    this.context.font = "7pt Inconsolata";
    this.context.textAlign = "center";
    this.context.textBaseline = "middle";

};

SatBar.prototype.tick = function(){
    if(!this.firstTick){
        this.firstTick = new Date();
    }

    var timeSinceStarted = new Date() - this.firstTick;
    var finishTime = 2000;

    if(timeSinceStarted > 2200){

        // we've finished rendereding

        return;
    }

    var percentComplete = Math.min(1,timeSinceStarted/finishTime);

    this.context.clearRect(0,0,this.width, this.height);

    /* draw lines */

    drawLines(this.context, 35, this.width, percentComplete);

    /* draw insignia
    */

    drawBox(this.context, 15, 25, 20, 1, Math.min(1,percentComplete*2));

};

SatBar.prototype.setZone = function(zone){
    zone = Math.max(-1,zone);
    zone = Math.min(3,zone);

    this.context.clearRect(0,0,35, 35);

    drawBox(this.context, 15, 25, 20, zone, 1);

};

function drawBox(context,x,y,size, zone, percent){
    if(!percent){
        percent = 1;
    }

    context.strokeStyle="#00EEEE";
    context.fillStyle="#00EEEE";

    context.beginPath();
    context.moveTo(x, y-size*percent/2);
    context.lineTo(x, y+size*percent/2);
    context.stroke();

    context.beginPath();
    context.moveTo(x-size*percent/2, y);
    context.lineTo(x+size*percent/2, y);
    context.stroke();


    if(zone !== undefined && zone>-1){
        context.fillRect(x-size*percent/2 + (zone%2)*size*percent/2, y-size*percent/2 + Math.floor(zone/2)*size*percent/2, size*percent/2,size*percent/2);
    }

    context.beginPath();
    context.arc(x,y,size*percent/4,0,Math.PI*2);
    context.fillStyle="#000";
    context.fill();

    context.fillStyle="#00EEEE";

    context.rect(x-size*percent/2,y-size*percent/2,size*percent,size*percent);
    context.stroke();

    // this.context.rect(5,15,20,20);

}

function drawLines(context,x,width, percent){

    context.strokeStyle="#00EEEE";
    context.lineWidth=2;
    context.moveTo(x, 15);
    context.lineTo(x+width * percent, 15);

    context.moveTo(x, 35);
    context.lineTo(x+width * percent, 35);

    context.moveTo(35 + percent*(width-35)/3 + 5, 15);
    context.lineTo(35 + percent*(width-35)/3 + 5, 20);

    context.moveTo(35 + 2*percent*(width-35)/3, 15);
    context.lineTo(35 + 2*percent*(width-35)/3, 20);

    context.moveTo(35 + percent*(width-35)/3 + 5, 30);
    context.lineTo(35 + percent*(width-35)/3 + 5, 35);

    context.moveTo(35 + 2*percent*(width-35)/3, 30);
    context.lineTo(35 + 2*percent*(width-35)/3, 35);
    context.stroke();

    if(percent >.8){
        context.fillStyle=Utils.shadeColor("#000000",100*(percent*percent));
        context.fillText("satellite", 35 + (width-35)/6, 25);
        context.fillText("data", 35+percent*(width-35)/2, 25);
        context.fillText("uplink", 35+percent*5*(width-35)/6, 25);
    }

}


module.exports = SatBar;
