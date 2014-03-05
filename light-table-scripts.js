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

        setTimeout(function hideAnimations(){
            $(".header-animator-outside").css("display", "none");
            $(".header-animator-inside").css("display", "none");
        }, 1500);

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

            itemContent.children().each(function(index, element){
                $(element).css("visibility", "visible");
            });

            
        }, 2000);

    };

    var animateKeyboard = function(){

        var keyboard = $("#keyboard");
        var spaceBar = $("#k-space");
        var spaceBarWidth = spaceBar.width();

        spaceBar.width(0);


        keyboard.delay(2000).animate({
            opacity: 1
        }, 2000);

        spaceBar.delay(2100).animate({
            width: spaceBarWidth
        },1000);

    }

    var webglTick = (function(){
        var canvas = document.getElementById('webglCanvas');
        var renderer = new THREE.WebGLRenderer( { antialias : true, canvas: canvas } );
        var cameraDistance = 100;
        var camera = new THREE.PerspectiveCamera( 50, canvas.width / canvas.height, 1, 400 );
        var cameraAngle=0;
        var scene = new THREE.Scene();
        var splineGeometry = new THREE.Geometry();
        var splineMaterial = new THREE.LineBasicMaterial({
            color: 0x6FC0BA,
            opacity: 0,
            transparent: true
            });

        var backdropGeometry = new THREE.Geometry();
        var backdropMaterial = new THREE.LineBasicMaterial({
            color: 0x1b2f2d,
            opacity: 1,
            transparent: true
            });

        var cameraUp = false;

        renderer.setSize(canvas.width, canvas.height);
        camera.position.z = cameraDistance;
        camera.lookAt(scene.position);

        lastRenderDate = new Date();

        var calc = function(x){
            return (x+200)*(x+100)*(x+280)*(x+10)*(x-300)*(x-250)*(x-150) / Math.pow(10,14)/1.5;
        }

        for(var i = 0; i< 500; i++){
            var y = calc(i-250) * Math.sin(2 * Math.PI * (i % 6) / 6 + i/500) + Math.cos(i) * 5;
            var z = calc(i-250) * Math.cos(2 * Math.PI * (i % 6) / 6 + i/500);
            splineGeometry.vertices.push(new THREE.Vector3(i - 250, y, z));
        }
        splineGeometry.verticesNeedUpdate = true;

        var splineLine = new THREE.Line(splineGeometry, splineMaterial);
        scene.add(splineLine);

        for(var i = 0; i< 25; i++){
            backdropGeometry.vertices.push(new THREE.Vector3(-500,100-i*8,-100));
            backdropGeometry.vertices.push(new THREE.Vector3(500,100-i*8,-100));
        }
        var backdropLine = new THREE.Line(backdropGeometry, backdropMaterial, THREE.LinePieces);
        scene.add(backdropLine);

        renderer.render( scene, camera );
        
        var firstRun = null;
        var introAnimationDone = false;

        return function tick(){

            if(firstRun === null){
                firstRun = Date.now();
            }
            // renderer.render( this.scene, this.camera );
            var renderTime = new Date() - lastRenderDate;
            var timeSinceStart = Date.now() - firstRun;
            lastRenderDate = new Date();

            var rotateCameraBy = (2 * Math.PI)/(10000/renderTime);
            cameraAngle += rotateCameraBy;

            if(timeSinceStart < 2000){
                backdropMaterial.opacity = Math.max(0,(timeSinceStart-1000)/3000);
                splineMaterial.opacity = timeSinceStart/2000;
            } else if(!introAnimationDone){
                introAnimationDone = true;
                backdropMaterial.opacity = .333;
                splineMaterial.opacity = 1;
            }

            
            camera.position.x = Math.sin(cameraAngle) * 20;
            renderer.render(scene, camera );

            splineLine.rotation.x += .01;

            requestAnimationFrame(tick);
        };

    })();

    var toggleKey = function(element){
        element.css({
            "background-color": "#fff",
            "color": "#000"
        });

        setTimeout(function(){
            element.css({
                "background-color": "#888",
                "color": "#888"
            });
        }, 200);
        setTimeout(function(){
            element.css({
                "background-color": "#000",
                "color": "#00eeee"
            });
        }, 300);

    };

    $(document).keydown(function(event){
        var keycode = event.which;
        event.preventDefault();
        switch(true){
            case (keycode > 64 && keycode < 91):
                toggleKey($("#k-" + String.fromCharCode(keycode).toLowerCase()));
                break;
            case (keycode > 47 && keycode < 58):
                toggleKey($("#k-" + (keycode - 48)));
                break;
            case (keycode === 27):
                toggleKey($("#k-esc"));
                break;
            case (keycode === 189):
               toggleKey($("#k--")); 
               break;
            case (keycode === 8):
               toggleKey($("#k-back")); 
               break;
            case (keycode === 9):
               toggleKey($("#k-tab")); 
               break;
            case (keycode === 16):
               toggleKey($("#k-shift")); 
               toggleKey($("#k-shift2")); 
               break;
            case (keycode === 221 || keycode === 219):
               toggleKey($("#k-paren")); 
               break;
            case (keycode === 13):
               toggleKey($("#k-enter")); 
               break;
            case (keycode === 32):
               toggleKey($("#k-space")); 
               break;
            case (keycode === 186):
               toggleKey($("#k-semi")); 
               break;
            case (keycode === 188):
               toggleKey($("#k-comma")); 
               break;
            case (keycode === 190):
               toggleKey($("#k-period")); 
               break;
            case (keycode === 191):
               toggleKey($("#k-slash")); 
               break;
        }

    });

    setTimeout(webglTick, 2000);

    setTimeout(animateHeaders, 500);
    animateContentBoxes($("#readme"), 0);
    animateContentBoxes($("#bandwidth"), 100);
    animateContentBoxes($("#globalization"), 200);
    animateContainers();
    animateKeyboard();

    $("#keyboard div").mousedown(function(event){
        event.preventDefault();
        toggleKey($(this));
    });
});
