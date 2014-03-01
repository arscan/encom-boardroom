$(function(){

    var outside = $("#container-outside");
    var inside = $("#container-inside");


    outside.css({
        'position' : 'absolute',
        'left' : '50%',
        'top' : '50%',
        'margin-left' : -outside.width()/2,
        'margin-top' : -outside.height()/2
    });

    var outsideOffset = outside.offset();
    var insideOffset = inside.offset();

    var outsideWidth = outside.width();
    var outsideHeight = outside.height();

    var insideWidth = inside.width();
    var insideHeight = inside.height();

    var outsideBlockerTopLeft = $("<div>");
    var outsideBlockerBottomRight = $("<div>");
    var insideBlockerTopRight = $("<div>");
    var insideBlockerBottomLeft = $("<div>");

    $('body').append(outsideBlockerTopLeft)
               .append(outsideBlockerBottomRight)
               .append(insideBlockerTopRight)
               .append(insideBlockerBottomLeft);

    outsideBlockerTopLeft.css({
        "background-color": "#aa0000",
        opacity: .5,
        position: "absolute",
        top: outsideOffset.top - 8,
        left: outsideOffset.left - 8,
        width: outside.outerWidth(),
        height: outside.outerHeight(),
        "z-index": 15
    });

    outsideBlockerBottomRight.css({
        "background-color": "#00aa00",
        opacity: .5,
        position: "absolute",
        top: outsideOffset.top + 8,
        left: outsideOffset.left + 8,
        width: outsideWidth,
        height: outsideHeight,
        "z-index": 15
    });

    insideBlockerTopRight.css({
        "background-color": "#0000aa",
        opacity: .5,
        position: "absolute",
        top: insideOffset.top-10,
        left: insideOffset.left+10,
        width: insideWidth,
        height: insideHeight,
        "z-index": 25
    });

    insideBlockerBottomLeft.css({
        "background-color": "#aaaaaa",
        opacity: .5,
        position: "absolute",
        top: insideOffset.top +10,
        left: insideOffset.left -10,
        width: insideWidth,
        height: insideHeight,
        "z-index": 25
    });

    outsideBlockerTopLeft.animate({
        width: 0,
        height: 0
    }, 2000);

    outsideBlockerBottomRight.animate({
        width: 0,
        height: 0,
        top: outsideOffset.top + outsideHeight,
        left: outsideOffset.left + outsideWidth
    }, 2000);

    insideBlockerTopRight.animate({
        width: 0,
        height: 0,
        left: insideOffset.left + insideWidth
    }, 2000);

    insideBlockerBottomLeft.animate({
        width: 0,
        height: 0,
        top: insideOffset.top + insideHeight,
    }, 2000);

    
});
