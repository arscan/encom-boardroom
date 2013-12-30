

var numFrames = 84;
var pixels = 200;
var rows = 7;

var cols = numFrames / rows;

var canvas = document.getElementById("satcan");

canvas.width=numFrames*pixels / rows;
canvas.height=pixels*rows;

// draw black background)

var ctx=canvas.getContext("2d");
ctx.fillStyle="#00";
ctx.fillRect(0,0,canvas.width,canvas.height);


var offsetx = 0,
    offsety = 0;
var curRow = 0;

var fadeToWhite = [
    "#FFFFFF",
    "#EEEEEE",
    "#DDDDDD",
    "#BBBBBB",
    "#AAAAAA",
    "#999999",
    "#888888",
    "#777777",
    "#666666",
    "#555555",
    "#444444",
    "#333333",
    "#222222",
    "#111111",
    "#000000"];

for(var i = 0; i< numFrames; i++){
    if(i - curRow * cols >= cols){
        offsetx = 0;
        offsety += pixels;
        curRow++;
    }

    var centerx = offsetx + 25;
    var centery = offsety + Math.floor(pixels/2);


    if(i>0){
        ctx.strokeStyle="#FFFFFF";
        ctx.lineWidth=Math.min(2,i/4);
        ctx.beginPath();
        ctx.arc(centerx,centery,10,0,2*Math.PI);
        ctx.stroke();
    }

    ctx.strokeStyle="#000000";
    ctx.lineWidth=6;
    ctx.beginPath();
    ctx.moveTo(centerx+5*Math.sin(i/5), centery-20);
    ctx.lineTo(centerx-5*Math.sin(i/5), centery+20);
    ctx.stroke();

    ctx.strokeStyle="#000000";
    ctx.lineWidth=6;
    ctx.beginPath();
    ctx.moveTo(centerx-20, centery-5*Math.sin(i/5));
    ctx.lineTo(centerx+20, centery+5*Math.sin(i/5));
    ctx.stroke();
   

    ctx.strokeStyle="#FF0000";
    ctx.lineWidth=3;
    ctx.beginPath();
    ctx.arc(centerx,centery,4,0,2*Math.PI);
    ctx.stroke();



    if(i>5){
        ctx.strokeStyle=fadeToWhite[Math.floor((i/numFrames)*fadeToWhite.length)];
        ctx.lineWidth=4;
        ctx.beginPath();
        ctx.arc(centerx,centery,i*(pixels/1.5/numFrames),-Math.PI/12,Math.PI/12);
        ctx.stroke();
    }

    if(i*(pixels/2/numFrames)-(pixels/2/4) > 0) {

        ctx.strokeStyle=fadeToWhite[Math.floor((i/numFrames)*fadeToWhite.length) - 2];
        ctx.lineWidth=3;
        ctx.beginPath();
        ctx.arc(centerx,centery,i*(pixels/1.5/numFrames)-(pixels/2/4),-Math.PI/12,Math.PI/12);
        ctx.stroke();
    }
    if(i*(pixels/2/numFrames)-(pixels/2/2) > 0) {
        ctx.strokeStyle=fadeToWhite[Math.floor((i/numFrames)*fadeToWhite.length) - 4];
        ctx.lineWidth=3;
        ctx.beginPath();
        ctx.arc(centerx,centery,i*(pixels/1.5/numFrames)-(pixels/2/2),-Math.PI/12,Math.PI/12);
        ctx.stroke();
    }

    if(i*(pixels/2/numFrames)-3*(pixels/2/4) > 0) {
        ctx.strokeStyle=fadeToWhite[Math.floor((i/numFrames)*fadeToWhite.length) - 6];
        ctx.lineWidth=3;
        ctx.beginPath();
        ctx.arc(centerx,centery,i*(pixels/1.5/numFrames)-3*(pixels/2/4),-Math.PI/12,Math.PI/12);
        ctx.stroke();
    }

    if(i*(pixels/2/numFrames)-(pixels/2) > 0) {
        // ctx.strokeStyle=fadeToWhite[Math.floor((i/numFrames)*fadeToWhite.length)];
        // console.log(fadeToWhite[Math.floor((i/numFrames)*fadeToWhite.length) - 8]);
        ctx.strokeStyle=fadeToWhite[Math.floor((i/numFrames)*fadeToWhite.length) - 8];
        ctx.lineWidth=3;
        ctx.beginPath();
        ctx.arc(centerx,centery,i*(pixels/1.5/numFrames)-(pixels/2),-Math.PI/12,Math.PI/12);
        ctx.stroke();
    }


    offsetx += pixels;
}





