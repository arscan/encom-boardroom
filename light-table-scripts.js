$(function(){

    var animateContainers = function(){
        var outside = $("#container-outside");
        var inside = $("#container-inside");


        outside.css({
            'position' : 'absolute',
            'left' : '50%',
            'top' : '50%',
            'margin-left' : -outside.width()/2,
            'margin-top' : -outside.height()/2
        });

        inside.css({
            'position' : 'absolute',
            'left' : '50%',
            'top' : '50%',
            'margin-left' : -inside.width()/2,
            'margin-top' : -inside.height()/2
        });
        var outsideOffset = outside.offset();
        var insideOffset = inside.offset();

        var outsideWidth = outside.width();
        var outsideHeight = outside.height();

        var insideWidth = inside.width();
        var insideHeight = inside.height();

        var outsideBlockerTopRight = $("<div>");
        var outsideBlockerBottomLeft = $("<div>");
        var insideBlockerTopRight = $("<div>");
        var insideBlockerBottomLeft = $("<div>");

        $('body').append(outsideBlockerTopRight)
                   .append(outsideBlockerBottomLeft)
                   .append(insideBlockerTopRight)
                   .append(insideBlockerBottomLeft);

        outsideBlockerTopRight.css({
            "background-color": "#000",
            // "background-color": "#aa0000",
            // opacity: .5,
            position: "absolute",
            top: outsideOffset.top - 5,
            left: outsideOffset.left - 5,
            width: outside.outerWidth() + 10,
            height: outside.outerHeight(),
            "z-index": 15
        });

        outsideBlockerBottomLeft.css({
            "background-color": "#000",
            position: "absolute",
            top: outsideOffset.top + 5,
            left: outsideOffset.left - 5,
            width: outsideWidth,
            height: outsideHeight,
            "z-index": 15
        });

        insideBlockerTopRight.css({
            "background-color": "#000",
            position: "absolute",
            top: insideOffset.top-3,
            left: insideOffset.left-3,
            width: insideWidth + 6,
            height: insideHeight,
            "z-index": 25
        });

        insideBlockerBottomLeft.css({
            "background-color": "#000",
            position: "absolute",
            top: insideOffset.top +3,
            left: insideOffset.left -3,
            width: insideWidth,
            height: insideHeight,
            "z-index": 25
        });

        outsideBlockerTopRight.animate({
            height: 10,
        }, 500).animate({
            width: 0,
            
        }, 500);
        
        outsideBlockerBottomLeft.animate({
            width: 20,
        }, 500)
        outsideBlockerBottomLeft.delay(500).animate({
            height: 0,
            top: outsideOffset.top + outsideHeight,
        }, 500);


        insideBlockerBottomLeft.animate({
            width: 0,
        }, 300);

        insideBlockerTopRight.delay(300).animate({
            height: 10,
        }, 500);

        insideBlockerTopRight.animate({
            width: 0,
            left: insideOffset.left + insideWidth
        }, 500);

        setTimeout(function(){
            outsideBlockerTopRight.remove();
            outsideBlockerBottomLeft.remove();
            insideBlockerTopRight.remove();
            insideBlockerBottomLeft.remove();
        }, 3000);

    };

    var animateHeaders = function() {

        var container = $("#container-inside");

        var outsideBlockerTopRight = $("<div>");
        var outsideBlockerBottomLeft = $("<div>");
        var insideBlockerTopRight = $("<div>");
        var insideBlockerBottomLeft = $("<div>");


        // find center
        // find left coords
        // find finish coords




    };

    setTimeout(animateHeaders, 500);
    animateContainers();
});
