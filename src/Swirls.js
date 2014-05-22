var Utils = require("./Utils.js");

var SwirlPoint = function(label, canvas){

    this.hitTime = Date.now();
    this.hit = true;
    this.startTime = Date.now();
    this.hitCount = 1;
    this.lastTime = Date.now();
    this.decayTime = 200;
    this.chaseRate = .005;

    this.startRadians = Math.random() * Math.PI * 2;

    this.label = label;
    this.canvas = canvas;
    this.maxRadius = Math.min(this.canvas.width, this.canvas.height)/2;
    this.context = this.canvas.getContext("2d");
    this.radius = this.maxRadius / 2;
    this.targetRadius = this.radius;

    this.x = 0;
    this.y = 0;

    this.firstHit = true;

}

SwirlPoint.prototype.animate = function(){

    var timeSinceStart = Date.now() - this.startTime;
    var animateTime = Date.now() - this.lastTime;

    var radians = this.startRadians + (timeSinceStart/10000) * Math.PI * 2;

    this.prevX = this.x;
    this.prevY = this.y;

    this.x = this.canvas.width / 2 + Math.sin(radians) * this.radius;
    this.y = this.canvas.height / 2 + Math.cos(radians) * this.radius;

    if(!this.prevX){
        this.prevX = this.x;
        this.prevY = this.y;
    }

    this.targetRadius = Math.max(1, this.targetRadius - animateTime / this.decayTime);

    if(this.targetRadius > this.radius){
        this.radius = Math.min(this.targetRadius, this.radius + this.chaseRate * animateTime);
    } else {
        this.radius = Math.max(this.targetRadius, this.radius - this.chaseRate * animateTime);
    }

    this.lastTime = Date.now();

};

SwirlPoint.prototype.registerHit = function(){
    this.targetRadius = Math.min(this.maxRadius, this.targetRadius + 20);

    this.hitTime = Date.now();
    this.hit = true;
    this.hitCount++;
};

SwirlPoint.prototype.draw = function(currentTime){
    if(Date.now() - this.startTime < 1000){
        this.context.fillStyle="#00eeee";
        this.context.strokeStyle = "#00eeee";
    }  else if(Date.now() - this.hitTime < 1000){
        this.context.fillStyle = "#ffcc00";
        this.context.strokeStyle = "#ffcc00";
    } else {
        this.context.fillStyle = "#ccc";
        this.context.strokeStyle = "#ccc";
    }

    if(this.firstHit){

        this.context.beginPath();
        this.context.arc(this.x, this.y, 3, 0, 2*Math.PI);
        this.context.fill()
        this.context.closePath();
        this.firstHit = false;

    } else if(this.hit){
        this.hit = false;
        if(this.x < this.canvas.width / 2){
            this.context.fillText(this.label, this.x + 10, this.y-10);

        } else {
            this.context.fillText(this.label, this.x + 10, this.y+10);
        }
    }

    this.context.beginPath();
    this.context.lineWidth = 1 + 2 * this.radius/this.maxRadius;
    this.context.moveTo(this.prevX, this.prevY);
    this.context.lineTo(this.x, this.y);
    this.context.stroke();
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
        ctx.fillStyle = "#000";
        ctx.fillRect(0,0, this.width, this.height);
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
    var len = Object.keys(this.points).length;
    var keys = Object.keys(this.points);

    var checkAtIndex = Math.floor(Math.random() * keys.length);

    if(keys.length > 0  && this.points[keys[checkAtIndex]].radius < 2){
        delete this.points[keys[checkAtIndex]];
    }

    if(!this.evenFrame){
        this.evenFrame = true;

        this.context.globalAlpha = .1;
        this.context.drawImage(this.background, 0, 0);
        this.context.globalAlpha = 1.0;

    } else {
        this.evenFrame = false;
        for(var p in this.points){
            this.points[p].animate();
            this.points[p].draw();
        }
    }

};

Swirls.prototype.hit = function(label){

    if(this.points[label]){
        this.points[label].registerHit();
        return;
    }

    this.points[label] = new SwirlPoint(label, this.canvas);
};

module.exports = Swirls;
