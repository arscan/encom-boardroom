var Utils = require("./Utils");

var SimpleClock = function(canvasId){

    if(this.firstTick == undefined){
        this.firstTick = new Date();
    }

    var canvas = document.getElementById(canvasId);
    this.context = canvas.getContext("2d");

    this.width = canvas.width;
    this.height = canvas.height;

    this.centerx = this.width/2;
    this.centery = this.height/2;

    this.backBuffer = Utils.renderToCanvas(this.width, this.height, function(ctx){
        var x = canvas.width / 2;
        var y = canvas.height / 2;

        ctx.beginPath();
        ctx.strokeStyle="#666";
        ctx.arc(x, y, 8, 0, Math.PI*2);
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.strokeStyle="#333";
        ctx.arc(x, y, 16, 0, Math.PI*2);
        ctx.stroke();
        ctx.beginPath();
        ctx.strokeStyle="#666";
        ctx.arc(x, y, 24, 0, Math.PI*2);
        ctx.stroke();
        ctx.closePath();


        ctx.strokeStyle="#333";
        ctx.beginPath();
        ctx.moveTo(x,y+8)
        ctx.lineTo(x,y+24)
        ctx.moveTo(x,y-8)
        ctx.lineTo(x,y-24)
        ctx.moveTo(x+8,y)
        ctx.lineTo(x+24,y)
        ctx.moveTo(x-8,y)
        ctx.lineTo(x-24,y)
        ctx.stroke();
        ctx.closePath();

    });
}

SimpleClock.prototype.tick = function(){
    var timeSinceStarted = new Date() - this.firstTick;

    this.context.clearRect(0,0,this.width, this.height);
    this.context.drawImage(this.backBuffer, 0, 0);

    this.context.strokeStyle="#666";
    this.context.beginPath();
    this.context.moveTo(this.centerx, this.centery);
    this.context.lineTo(this.centerx + 24*Math.sin(timeSinceStarted/10000), this.centery - 24*Math.cos(timeSinceStarted/10000));
    this.context.moveTo(this.centerx, this.centery);
    this.context.lineTo(this.centerx + 24*Math.sin(timeSinceStarted/100000), this.centery - 24*Math.cos(timeSinceStarted/100000));
    this.context.stroke();
    this.context.closePath();

};


module.exports = SimpleClock;
