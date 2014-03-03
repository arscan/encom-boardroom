$(function(){

    $(".header").css("visibility", "hidden");
    $(".content-container").css("visibility", "hidden");

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
            // "background-color": "#00aa00",
            // opacity: .5,
            position: "absolute",
            top: outsideOffset.top + 5,
            left: outsideOffset.left - 5,
            width: outsideWidth,
            height: outsideHeight + 10,
            "z-index": 15
        });

        insideBlockerTopRight.css({
            "background-color": "#000",
            // "background-color": "#0000aa",
            // opacity: .5,
            position: "absolute",
            top: insideOffset.top-3,
            left: insideOffset.left-5,
            width: insideWidth + 15,
            height: insideHeight,
            "z-index": 25
        });

        insideBlockerBottomLeft.css({
            "background-color": "#000",
            // "background-color": "#aa00aa",
            // opacity: .5,
            position: "absolute",
            top: insideOffset.top +5,
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
        }, 500);

        outsideBlockerBottomLeft.delay(500).animate({
            height: 0,
            top: (outsideOffset.top + outsideHeight)/2,
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


        setTimeout(function doHeaderAnimations(){

            $(".header-animator-outside").css({visibility: "visible"}).animate({
                top: "25px",
                height: "538px"
            }, 500);

            $(".header-animator-inside").css({visibility: "visible"}).delay(100).animate({
                top: "39px",
                height: "510px"
            }, 500);
        }, 500);

        setTimeout(function showHeaders(){
            $(".header").css("visibility", "visible");
            
            $(".content-container").css("visibility", "visible");

        }, 1000);

    };

    var animateContentBoxes = function(item, extraDelay) {

        var itemContent = item.find(".content");

        var height = item.height();
        var width = item.width();
        var left = item.position().left;
        var top = item.position().top;

        var border = item.css("border");
        var boxShadow = item.css("box-shadow");

        var contentBorder = itemContent.css("border");
        var contentBoxShadow = itemContent.css("box-shadow");

        itemContent.children().each(function(index, element){
            $(element).css("visibility", "hidden");
        });

        item.css({
            "border": "1px solid #fff",
            "box-shadow": "none",
        });

        itemContent.css({
            "border": "1px solid #fff",
            "box-shadow": "none"
        });

        item.height(0)
           .width(0)
           .css("top", top + height/2)
           .css("left", left + width/2);

        setTimeout(function doHeaderAnimations(){

            item.animate({
                height: height,
                width: width,
                left: left,
                top: top
                
            }, 500);
            item.css({
                opacity: 1
            });
        }, 1500 + extraDelay);

        setTimeout(function(){
            item.css({
                "border": border,
                "box-shadow": boxShadow
            });
            
            itemContent.css({
                "border": contentBorder,
                "box-shadow": contentBoxShadow
            });

            itemContent.children().each(function(index, element){
                $(element).css("visibility", "visible");
            });

            
        }, 2000);

    };

    setTimeout(animateHeaders, 500);
    animateContentBoxes($("#readme"), 0);
    animateContentBoxes($("#bandwidth"), 100);
    animateContentBoxes($("#globalization"), 200);
    animateContainers();
});
