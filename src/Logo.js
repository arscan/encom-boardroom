var Utils = require("./Utils.js");

var Logo = function(containerId, text){

    if(typeof text == "undefined"){
        text = "GITHUB";
    }

    this.container = document.getElementById(containerId);
    this.container.width = 180;
    this.container.height = 100
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.container.width;
    this.canvas.height = this.container.height;
    this.context = this.canvas.getContext("2d");
    this.container.appendChild(this.canvas);

    this.width = this.container.width;
    this.height = this.container.height;

    this.context.strokeStyle = "#00eeee";
    this.context.lineWidth = 3;

    this.context.font = "14px Terminator";
    var textWidth = this.context.measureText(text).width;

    Utils.drawCurvedRectangle(this.context, (this.width - textWidth -24)/2, 30, textWidth + 24, 60, 3);
    Utils.drawCurvedRectangle(this.context, (this.width - textWidth -10)/2, 65, textWidth + 10, 20, 3);

    this.context.textAlign = "center";
    this.context.fillStyle="#00eeee";
    this.context.textBaseline = "bottom";
    this.context.fillText(text, this.width/2, 85);


    var buffer = 4;
    var startPos = (this.width-textWidth-24)/2 + buffer + 2;
    var barWidth = (textWidth + 20 - buffer * 6) / 5;

    for(var i = 0; i < 5; i++){
        var height = Math.floor(Math.random() * 25);
        if(Math.random() < .5){
            this.context.fillStyle = "#ffcc00";
        } else {
            this.context.fillStyle = "#ff9933";
        }
        this.context.fillRect(startPos + i * (barWidth + buffer), 36 + (25 - height), barWidth, height); 
    }


};

module.exports = Logo;
