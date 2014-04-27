var Utils = require("./Utils.js");

var SwirlPoint = function(label, radius, canvas){

    this.hitTime = Date.now();
    this.hit = true;
    this.startTime = Date.now();

    this.startRadians = Math.random() * Math.PI * 2;

    this.radius = radius;
    this.label = label;
    this.canvas = canvas;
    this.context = this.canvas.getContext("2d");

    this.x = this.canvas.width / 2;
    this.y = this.canvas.height / 2;

    this.animate();
}

SwirlPoint.prototype.animate = function(){

    var timeSinceStart = Date.now() - this.startTime;

    var radians = this.startRadians + (timeSinceStart/10000) * Math.PI * 2;

    this.x = this.canvas.width / 2 + Math.sin(radians) * this.radius;
    this.y = this.canvas.height / 2 + Math.cos(radians) * this.radius;


};

SwirlPoint.prototype.draw = function(currentTime){


    if(Date.now() - this.hitTime < 1000){
        this.context.fillStyle = "#ffcc00";
    } else {
        this.context.fillStyle = "#aaa";
    }

    if(this.hit){
        this.hit = false;
        if(this.x < this.canvas.width / 2){
            this.context.fillText(this.label, this.x + 10, this.y-10);

        } else {
            this.context.fillText(this.label, this.x + 10, this.y+10);

        }
    }

    this.context.beginPath();
    this.context.arc(this.x, this.y, 1, 0, Math.PI * 2);
    this.context.fill();
    this.context.closePath();

};


var Swirls = function(containerId, opts){

    this.container = document.getElementById(containerId);
    this.container.width = 290;
    this.container.height = 225
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.container.width;
    this.canvas.height = this.container.height;
    this.context = this.canvas.getContext("2d");
    this.container.appendChild(this.canvas);

    this.width = this.container.width;
    this.height = this.container.height;

    this.points = {};

    this.background = Utils.renderToCanvas(this.width, this.height, function(ctx){
        ctx.fillStyle = "#111";
        ctx.fillRect(5,5, this.width -10, this.height-10);
        ctx.strokeStyle = "#666"

        ctx.beginPath();
        ctx.moveTo(this.width/2 + .5,5);
        ctx.lineTo(this.width/2 + .5,this.height - 5);
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.moveTo(5,this.height/2);
        ctx.lineTo(this.width-5,this.height/2);
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.moveTo(0,20);
        ctx.lineTo(0,0);
        ctx.lineTo(20, 0);
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.moveTo(this.width,20);
        ctx.lineTo(this.width,0);
        ctx.lineTo(this.width -20, 0);
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.moveTo(this.width,this.height-20);
        ctx.lineTo(this.width,this.height);
        ctx.lineTo(this.width -20, this.height);
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.moveTo(this.width,this.height-20);
        ctx.lineTo(this.width,this.height);
        ctx.lineTo(this.width -20, this.height);
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.moveTo(0,this.height-20);
        ctx.lineTo(0,this.height);
        ctx.lineTo(20, this.height);
        ctx.stroke();
        ctx.closePath();

        ctx.fillStyle = "#666";
        ctx.fillRect(this.width/2-1.5, 2, 4, 6);
        ctx.fillRect(this.width/2-1.5, this.height-8, 4, 6);
        ctx.fillRect(2, this.height/2-2, 6, 4);
        ctx.fillRect(this.width-8, this.height/2-2, 6, 4);

    }.bind(this));

    this.context.drawImage(this.background, 0, 0);
    this.context.fillStyle = "#fff";
};

Swirls.prototype.tick = function(){

    this.context.globalAlpha = .02;
    this.context.drawImage(this.background, 0, 0);
    this.context.globalAlpha = 1.0;

    /*
       this.context.beginPath();
       this.context.arc(Math.random() * this.width, Math.random() * this.height, 2, 0, Math.PI * 2);
       this.context.fill();
       this.context.closePath();
       */

    for(var p in this.points){
        this.points[p].animate();
        this.points[p].draw();
    }
};

Swirls.prototype.hit = function(label){

    if(this.points[label]){
        this.points[label].hitTime = Date.now();
        this.points[label].hit = true;
        return;
    }

    this.points[label] = new SwirlPoint(label, Math.random() * 100, this.canvas);
};

module.exports = Swirls;
