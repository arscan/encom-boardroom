var Utils = require("./Utils");

var StockChart = function(containerId, opts){

    var defaults = {
        ticks: 7,
        holdTime: 3000,
        swipeTime: 800,
        data: []
    }

    var testData = false;

    Utils.extend(opts, defaults);
    this.opts = defaults;

    this.frames = [];

    if(this.firstTick == null){
        this.firstTick = new Date();
    }

    this.container = document.getElementById(containerId);
    this.container.width = '500';
    this.container.height = '105'

    this.width = this.container.width;
    this.height = this.container.height;

    this.currentFrame = -1;

    var q = -1;
    var count = 0;
    var quarter = "1st Quarter";

    if(!this.opts.data){
        this.opts.data = [];
    }

    if(!this.opts.data.length){
        testData = true;
        var end = new Date(2014, 0, 1);
        for (var d = new Date(2013, 0, 1); d < end; d.setDate(d.getDate() + 1)) {
            count++;
            this.opts.data.push({
                year: d.getFullYear(),
                month: d.getMonth() + 1,
                day: d.getDate(),
                events: ((40+(count%92)) + Math.floor(Math.random()*50))
            });
        }
    }

    var frameData = [];

    for (var i = 0; i< this.opts.data.length; i++){

        if(q >= 0 && q !== parseInt(i / 92, 10)){
            this.addFrame(quarter + " 2013 Activity" + (testData ? " (PLACEHOLDER DATA)" : ""), frameData);

            this.frames[this.frames.length-1].id = "stock-chart-canvas" + q;
            this.frames[this.frames.length-1].div = document.createElement("div");
            this.frames[this.frames.length-1].div.appendChild( this.frames[q] );
            this.container.appendChild(this.frames[this.frames.length-1].div);

            frameData = [];
            if(q == 0){
                quarter = "2nd Quarter";
            } else if(q==1){
                quarter = "3rd Quarter";
            } else {
                quarter = "4th Quarter";
            }
        }

        frameData.push(this.opts.data[i].events);

        q = parseInt(i / 92, 10);

    }

    this.addFrame(quarter + " 2013 Activity" + (testData ? " (PLACEHOLDER DATA)" : ""), frameData);

    this.frames[this.frames.length-1].id = "stock-chart-canvas" + q;
    this.frames[this.frames.length-1].div = document.createElement("div");
    this.frames[this.frames.length-1].div.appendChild( this.frames[q] );
    this.container.appendChild(this.frames[this.frames.length-1].div);

};

StockChart.prototype.addFrame = function(label, data) {

    // get bounds of the data

    var sorted = data.slice(0).sort();
    var min = sorted[0] * .8;
    var max = sorted[sorted.length-5];
    var increment = (max - min) / this.opts.ticks;
    var heightIncrement  = (this.height) / this.opts.ticks;

    var frameCanvas = Utils.renderToCanvas(this.width, this.height, function(ctx){
        // draw the y ticks

        ctx.fillStyle = "#000";
        ctx.fillRect(0,0,this.width, this.height);

        addGrid(ctx, this.opts.ticks, this.width, this.height);

        ctx.font = "5pt Inconsolata";
        ctx.fillStyle="#fff";

        for(var i = 0; i < this.opts.ticks; i++){

            ctx.fillText(('' + (min + (this.opts.ticks - i -1)* increment)).substring(0,6), 0, heightIncrement*i+10);
            ctx.beginPath();
            ctx.lineWidth="1";
            ctx.strokeStyle="#666";
            ctx.moveTo(0, heightIncrement * (i + 1));
            ctx.lineTo(30,heightIncrement * (i + 1));
            ctx.stroke();
            ctx.closePath();
        }

        var xIncrement = (this.width - 30)/(data.length-1);

        ctx.beginPath();
        ctx.moveTo(30,this.height-1);

        ctx.lineWidth = "1px";
        for(var i = 0; i < data.length; i++){
            ctx.lineTo(30 + i*xIncrement, this.height - this.height * (data[i]-min) / max );
        }
        ctx.lineTo(this.width, this.height-1);
        ctx.stroke();
        var gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, Utils.shadeColor("#00eeee",-60));
        gradient.addColorStop(1, 'rgba(0,238,238,.5)');
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.closePath();

        ctx.fillStyle = "rgba(255,255,255,.3)";
        for(var i = 0; i < data.length; i++){

            ctx.beginPath();
            ctx.arc(30 + i*xIncrement,this.height - this.height * (data[i]-min) / max, 2, 0, 2*Math.PI);
            ctx.fill();
        }

        // draw the label
        ctx.font = "7pt Inconsolata";
        var textWidth = ctx.measureText(label).width;

        ctx.textAlign = "left";
        ctx.fillStyle="#000";
        ctx.strokeStyle="#00eeee";
        ctx.textBaseline = "top";

        Utils.drawCurvedRectangle(ctx, 40, 1, textWidth + 10, 16, 2);
        ctx.strokeStyle="#fff";
        ctx.fillStyle="#fff";
        ctx.fillText(label, 45, 3);


    }.bind(this));

    this.frames.push(frameCanvas);

};

StockChart.prototype.tick = function(){

    if(!this.firstTick){
        this.firstTick = new Date();
    }
    var timeSinceStarted = new Date() - this.firstTick;

    var ticks = timeSinceStarted % (this.opts.holdTime * this.frames.length);

    var thisFrame = Math.floor(ticks / (this.opts.holdTime));

    if(thisFrame !== this.currentFrame){
        // this.frames[this.currentFrame].div.style.width = "0px";
        this.currentFrame = thisFrame;
        this.frames[this.currentFrame].div.style.zIndex = Math.floor(timeSinceStarted/this.opts.holdTime);
        this.percentDone = 0;
    }

    if(this.percentDone < 1){
        this.percentDone = Math.min((ticks  - this.currentFrame * this.opts.holdTime) / this.opts.swipeTime, 1);
        this.frames[this.currentFrame].div.style.width = (this.width * Utils.sCurve(this.percentDone)) + "px";
    }
};

function addGrid(ctx, ticks, width, height){

    ctx.beginPath();
    ctx.lineWidth=2;
    ctx.strokeStyle="#666";
    ctx.moveTo(30, height-1);
    ctx.lineTo(width-1,height-1);
    ctx.stroke();
    ctx.closePath();


    /* draw the grid */
    var newY = 0;

    for(var i = 0; i< ticks;i++){
        var y = i*(height/ticks);
        ctx.beginPath();
        ctx.lineWidth=1;
        ctx.strokeStyle="#666";
        ctx.moveTo(30, y);
        ctx.lineTo(width-1,y);
        ctx.stroke();
        ctx.closePath();
    }

    newX = 30;
    while(newX < width){
        ctx.beginPath();
        ctx.lineWidth=1;
        ctx.strokeStyle="#666";
        ctx.moveTo(newX, 0);
        ctx.lineTo(newX,height);
        ctx.stroke();
        ctx.closePath();
        newX += height/ticks;
    }

    // draw the far right line.
    // this might be a bit hokey

    ctx.beginPath();
    ctx.lineWidth=1;
    ctx.strokeStyle="#666";
    ctx.moveTo(width-1, 0);
    ctx.lineTo(width-1,height);
    ctx.stroke();
    ctx.closePath();
};


module.exports = StockChart;
