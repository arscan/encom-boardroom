var Utils = require("./Utils.js");

var StockChartSmall = function(canvasId, opts){

    var defaults = {
        ticks: 5
    }

    var darkerColor = Utils.shadeColor("#00eeee",-50);

    Utils.extend(opts, defaults);
    this.opts = defaults;

    if(this.firstTick == null){
        this.firstTick = new Date();
    }

    var canvas = document.getElementById(canvasId);
    this.context = canvas.getContext("2d");

    this.width = canvas.width;
    this.height = canvas.height;

    var gradient = this.context.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, darkerColor);
    gradient.addColorStop(1, "black");
    this.context.fillStyle = gradient;
    this.context.fillRect(0,0,this.width,this.height);

    this.context.beginPath();
    this.context.lineWidth=1;
    this.context.strokeStyle=darkerColor;
    this.context.moveTo(0, this.height-1);
    this.context.lineTo(this.width-1,this.height-1);
    this.context.stroke();
    this.context.closePath();

    /* draw the grid */
    var newY = 0;

    for(var i = 0; i< this.opts.ticks; i++){
        var y = i*(this.height/this.opts.ticks);
        this.context.beginPath();
        this.context.lineWidth=1;
        this.context.strokeStyle=darkerColor;
        this.context.moveTo(1, y);
        this.context.lineTo(this.width-1,y);
        this.context.stroke();
        this.context.closePath();
    }

    newX = 1;
    while(newX < this.width){
        this.context.beginPath();
        this.context.lineWidth=1;
        this.context.strokeStyle=darkerColor;
        this.context.moveTo(newX, 0);
        this.context.lineTo(newX,this.height);
        this.context.stroke();
        this.context.closePath();
        newX += this.height/this.opts.ticks;
    }

    // draw the far right line.
    // this might be a bit hokey

    this.context.beginPath();
    this.context.lineWidth=1;
    this.context.strokeStyle=darkerColor;
    this.context.moveTo(this.width-1, 0);
    this.context.lineTo(this.width-1,this.height);
    this.context.stroke();
    this.context.closePath();

    var data = [];

    for(var i = 0; i< 20; i++){
        data.push(Math.random()*this.height);
    }

    var xIncrement = (this.width)/(data.length-1);

    this.context.strokeStyle = "#aaa"
    this.context.beginPath();
    this.context.moveTo(0,0);

    for(var i = 0; i < data.length; i++){
        this.context.lineWidth = "1px";
        this.context.lineTo(i*xIncrement, this.height - data[i]);
    }
    this.context.lineTo(this.width, 0);
    this.context.stroke();
    this.context.fillStyle = "#000";
    this.context.fill();

};

module.exports = StockChartSmall;
