var Utils = require("./Utils.js");

var StockChartSmall = function(canvasId, opts){

    var defaults = {
        ticks: 5,
        data: []
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

    if(!this.opts.data){
        this.opts.data = [];
        
    }

    if(!this.opts.data.length){
        for(var i = 0; i< 30; i++){
            data.push(Math.random()*this.height);
        }
    } else {
        for(var i = 0; i< this.opts.data.length; i++){
            data.push(this.opts.data[i].events);
        }
    }

    var sorted = data.slice(0).sort();
    var min = sorted[0]*.8;
    var max = sorted[sorted.length-4]*1.2;
    var f = (max-min)/this.height;
    console.log(f);

    var xIncrement = (this.width)/(30-2);

    this.context.strokeStyle = "#aaa"
    this.context.beginPath();
    this.context.moveTo(0,0);

    var divideDataInto = Math.max(1,Math.floor(data.length/30));
    var subArea = [];
    var lowData = [];

    for(var i = 0; i < data.length; i++){
        if(subArea.length < divideDataInto){
            subArea.push(data[i]);
        } else {
            var sum = 0;
            for(var j = 0; j< subArea.length; j++){
                sum += subArea[j];
            }
            lowData.push(sum/subArea.length);
            subArea = [];
        }
    }
        

    for(var i = 0; i< lowData.length; i++){
        this.context.lineWidth = "1px";
        this.context.lineTo(i*xIncrement, this.height - lowData[i]/f);
    }
    this.context.lineTo(this.width, this.height - lowData[lowData.length-1]/f);
    this.context.stroke();
    this.context.lineTo(this.width, 0);
    this.context.stroke();
    this.context.fillStyle = "#000";
    this.context.fill();

};

module.exports = StockChartSmall;
