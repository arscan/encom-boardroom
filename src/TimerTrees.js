var moment = require("moment");

function drawTree(x,height){

    this.context.beginPath();
    this.context.lineWidth=1;
    this.context.moveTo(x, this.height-9);
    this.context.lineTo(x, height);
    this.context.stroke();
    this.context.closePath();
    this.context.beginPath();
    this.context.arc(x, height,  2, 0, Math.PI*2);
    this.context.fill();
    this.context.closePath();
}

function render(){

    var i = 0,
    lineLocation = 0,
    prevLocations = [], 
    start = .25 + (12-moment.utc().hour())/24, 
    end = .75 + (12-moment.utc().hour())/24,
    lines = [];

    var locationOk = function(loc, width){
        var j = 0;
        for( ; j< prevLocations.length; j++){
            if(Math.abs(loc-prevLocations[j]) < 5){
                return false;
            }
        }
        return true;
    }

    if(start < 0){
        lines.push({left: 0, right: end * this.width});
        lines.push({left: (1 + start) * this.width, right: this.width});

    } else if(start > .5) {
        lines.push({left: 0, right: (1-end) * this.width});
        lines.push({left: start * this.width, right: this.width});

    } else {
        lines.push({left: start * this.width, right: end * this.width})
    } 
    this.context.beginPath();
    this.context.lineWidth=1;
    this.context.strokeStyle="#666";
    this.context.moveTo(0, this.height-9);
    this.context.lineTo(this.width-1,this.height-9);
    this.context.stroke();
    this.context.closePath();

    for(var sub = i; sub< lines.length; sub++){
        this.context.beginPath();
        this.context.strokeStyle="#FFCC00";
        this.context.lineWidth=2;
        this.context.moveTo(lines[sub].left, this.height-9);
        this.context.lineTo(lines[sub].right,this.height-9);
        this.context.stroke();
        this.context.closePath();
    }

    this.context.textAlign = "center";
    this.context.fillStyle="#666";
    this.context.font = "5pt Inconsolata";

    this.context.textBaseline = "bottom";
    this.context.fillText("asfdiuojfd", this.width/10, this.height);
    this.context.fillText("807ujkoasd", 3*this.width/10, this.height);
    this.context.fillText("asdfiounfalk", 5*this.width/10, this.height);
    this.context.fillText("kjljk", 7*this.width/10, this.height);
    this.context.fillText("adfoiuh", 9*this.width/10, this.height);


    this.context.lineWidth=1;
    this.context.strokeStyle="#00EEEE";
    this.context.fillStyle="#00EEEE";
    for( ; i< 20; i++){
        lineLocation = Math.random() * this.width-2; 
        while(!locationOk(lineLocation)){
            lineLocation = Math.random() * this.width-2;
        }
        prevLocations.push(lineLocation);

        var endLocation = Math.random() * (this.height - 13) + 2;

        drawTree.call(this, lineLocation, endLocation);

    }

};

var TimerTrees = function(canvasId){

    if(this.firstTick == undefined){
        this.firstTick = new Date();
    }

    var canvas = document.getElementById(canvasId);
    this.context = canvas.getContext("2d");

    this.width = canvas.width;
    this.height = canvas.height;

    render.call(this);

};

module.exports = TimerTrees;
