var Utils = {};

Utils.renderToCanvas = function (width, height, renderFunction) {
    var buffer = document.createElement('canvas');
    buffer.width = width;
    buffer.height = height;
    renderFunction(buffer.getContext('2d'));
    return buffer;
};

Utils.extend = function(first, second) {
    for(var i in first){
        second[i] = first[i];
    }
};

Utils.sCurve = function(t) {
    return 1/(1 + Math.exp(-t*12 + 6));
};

// http://stackoverflow.com/a/13542669
Utils.shadeColor = function(color, percent) {   
    var num = parseInt(color.slice(1),16), 
    amt = Math.round(2.55 * percent), 
    R = (num >> 16) + amt, 
    G = (num >> 8 & 0x00FF) + amt, 
    B = (num & 0x0000FF) + amt;

    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
}

Utils.drawCurvedRectangle = function(ctx, left, top, width, height, radius){
    console.log("drawing");

    ctx.beginPath();
    ctx.moveTo(left + radius, top);
    ctx.lineTo(left + width - radius, top);
    ctx.quadraticCurveTo(left + width, top, left + width, top + radius);
    ctx.lineTo(left + width, top + height - radius);
    ctx.quadraticCurveTo(left + width, top + height, left + width - radius, top + height);
    ctx.lineTo(left + radius, top + height);
    ctx.quadraticCurveTo(left, top + height, left, top + height - radius);
    ctx.lineTo(left, top + radius);
    ctx.quadraticCurveTo(left, top, left + radius, top);
    ctx.stroke();
    ctx.fill();
    ctx.closePath();
}

module.exports = Utils;
