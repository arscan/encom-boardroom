var $ = require("jquery"),
    THREE = require("three");

var webglTest,
    active = false,
    initialized = false,
    currentWidth = 0,
    currentHeight = 0,
    hideFn = function(){}
    LightTable = {};

/* public function */

LightTable.init = function(_hideFn){

    hideFn = _hideFn;

    $(".lt-header").css("visibility", "hidden");
    $(".content-container").css("visibility", "hidden");


    $("#lt-keyboard").css("opacity", 0);


    webglTest = createWebGlTest();

    $("#light-table").css("visibility", "visible");

    currentWidth = $(window).width();
    currentHeight = $(window).height();


    /* set events */

    $("#lt-launch-github").click(function(){
        $(this).find(".folder-big").css("background-color", "#fff");
        simulateCommand("cd github$");
        simulateCommand("ls$");
        simulateCommand("run github.exe$");
    });

    $("#lt-launch-wikipedia").click(function(){
        $(this).find(".folder-big").css("background-color", "#fff");
        simulateCommand("cd wikipedia$");
        simulateCommand("ls$");
        simulateCommand("run wikipedia.exe$");
    });

    $("#lt-launch-test").click(function(){
        $(this).find(".folder-big").css("background-color", "#fff");
        simulateCommand("cd test$");
    });

    $("#lt-launch-bitcoin").click(function(){
        $(this).find(".folder-big").css("background-color", "#fff");
        simulateCommand("cd bitcoin$");
    });

    $("#lt-launch-unknown").click(function(){
        $(this).find(".folder-big").css("background-color", "#fff");
        simulateCommand("cd unknown$");
    });

    $("#lt-keyboard div").mousedown(function(event){
        event.preventDefault();
        keyClick(parseInt($(this).attr("id").split("-")[1]));
    });

    initialized = true;
};

LightTable.show = function(cb){

    $("#light-table").css("opacity", 1);
    // do the intro animations
    showContainer();
    setTimeout(showHeaders, 500);
    showContentBoxes($("#lt-readme"), 0);

    showContentBoxes($("#lt-bandwidth"), 100);
    showContentBoxes($("#lt-globalization"), 200);
    showKeyboard();

    if($("#lt-mobile-readme").width() > 0){
        showContentBoxes($("#lt-mobile-readme"), 0);
    }

    $(document).keydown(function(event){

        if(!event.ctrlKey){
            var keycode = event.which;
            event.preventDefault();
            keyClick(keycode);
        }
    });

    if(typeof cb == "function"){
        setTimeout(cb, 500);
    }

    active = true;
};

LightTable.hide = function(cb) {
    // reset everything

    active = false;
    $("#lt-mobile-readme").attr("style","");
    $("#k-32").attr("style","");
    $(".lt-header-animator-right").attr("style","");
    $(".lt-header-animator-left").attr("style","");

    $("#light-table").animate({
        opacity: 0
    }, 500);

    setTimeout(function(){
        hideKeyboard();
        hideContainer();
        hideWebgl();
    }, 500);

    webglTest.reset();

    $(document).removeAttr("keydown");

    if(typeof cb == "function"){
        cb();
    }
};

LightTable.animate = function(){
    if(active && initialized){
        webglTest.tick();
    }
};

var resizing = false;
LightTable.resize = function(){
    $("#light-table").center();
    if(!resizing && (currentWidth > 1600 && $(window).width() <= 1600) || (currentWidth <= 1600 && $(window).width() > 1600)){

        currentWidth = $(window).width();
        resizing = true;
        LightTable.hide();
        setTimeout(LightTable.show,1000);

        setTimeout(function(){
            resizing = false;
        }, 3000);
    }
};


LightTable.message = function(message){
    // noop

};

/* private functions */

function showContainer(){
    var outside = $("#lt-container-outside");
    var inside = $("#lt-container-inside");

    outside.center();
    inside.center();

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

}

function hideContainer(){
    $(".lt-header").css("visibility", "hidden");
    $(".content-container").css("opacity", 0);
}

function showHeaders(){

    var aHeight = $("#lt-header-bottom-right").position().top - 35;

    setTimeout(function doHeaderAnimations(){

        $(".lt-header-animator-outside").css({visibility: "visible"}).animate({
            top: "25px",
            height: aHeight + 28 + "px"
        }, 500);

        $(".lt-header-animator-inside").css({visibility: "visible"}).delay(100).animate({
            top: "39px",
            height: aHeight + "px"
        }, 500);
    }, 500);

    setTimeout(function showHeaders(){
        $(".lt-header").css("visibility", "visible");
        $(".content-container").css("visibility", "visible");

    }, 1000);

    setTimeout(function hideAnimations(){
        $(".lt-header-animator-outside").css("display", "none");
        $(".lt-header-animator-inside").css("display", "none");
    }, 1000);

}

function showContentBoxes(item, extraDelay) {

    var itemContent = item.find(".content");

    item.removeAttr("style");

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
            width: "100%",
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


    }, 2200);

}

function hideContentBoxes(){
    var itemContent = item.find(".content");
    itemContent.children().each(function(index, element){
        $(element).css("visibility", "hidden");
    });
}

function showKeyboard(){

    var keyboard = $("#lt-keyboard");
    var spaceBar = $("#k-32");
    var spaceBarWidth = spaceBar.width();

    spaceBar.width(0);


    keyboard.delay(2000).animate({
        opacity: 1
    }, 2000);

    spaceBar.delay(2200).animate({
        width: spaceBarWidth
    },500);

}

function hideKeyboard(){
    var keyboard = $("#lt-keyboard");
    keyboard.css("opacity", 0);
}

function createWebGlTest(){
    var canvas = document.getElementById('lt-webglCanvas');
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

    return {
        tick: function (){
            if(firstRun === null){
                firstRun = Date.now() + 2500;
            }
            // renderer.render( this.scene, this.camera );
            var renderTime = new Date() - lastRenderDate;
            var timeSinceStart = Date.now() - firstRun;
            lastRenderDate = new Date();

            var rotateCameraBy = (2 * Math.PI)/(10000/renderTime);
            cameraAngle += rotateCameraBy;

            if(timeSinceStart < 3000){
                backdropMaterial.opacity = Math.max(0,(timeSinceStart-2000)/3000);
                splineMaterial.opacity = timeSinceStart/3000;
            } else if(!introAnimationDone){
                introAnimationDone = true;
                backdropMaterial.opacity = .333;
                splineMaterial.opacity = 1;
            }


            camera.position.x = Math.sin(cameraAngle) * 20;
            renderer.render(scene, camera );

            splineLine.rotation.x += .01;
        }, 
        reset: function(){
            firstRun = null;
        }
    };

}

function hideWebgl(){
    $('#lt-bandwidth').css("opacity", 0);
}

function writeResponse(txt){
    $("#lt-command-lines").append("<div class='response'>&gt;&gt;encom-sh: " + txt + "</div>");
}

var currentDir = "encom_root";

function writePrompt(){
    $(".command-blinker").removeClass("blink").removeClass("command-blinker");

    $("#lt-command-lines").append('<div class="command"><span class="prompt">encom-sh:' + currentDir + '$&nbsp;</span><span class="command-text"></span><span class="blink command-blinker">&nbsp;</span></div>');
}

function writeLs(exec){
    var output = "";
    if(typeof exec != "undefined"){
        output = [
            '<div class="ls">encom_root</div>',
            '<div class="ls">bandwidth</div>',
            '<div class="ls">framework</div>',
            '<div class="ls">@arscan</div>',
            '<div class="ls ls-exec">' + exec + '</div>',
            '<div class="ls">webgl_test</div>',
            '<div class="ls">flynn_5</div>',
            '<div class="ls">&nbsp;</div>',
            '<div class="ls">os12_demo</div>',
            '<div class="ls">munkowitz</div>',
        ].join('');

    } else {
        output = [
            '<div class="ls ls-github">github</div>',
            '<div class="ls ls-test">test</div>',
            '<div class="ls ls-wikipedia">wikipedia</div>',
            '<div class="ls ls-bitcoin">bitcoin</div>',
            '<div class="ls ls-unknown">unknown</div>'
        ].join('');
    }

    $("#lt-command-lines").append(output);

}


/* I could make this much more involved, but i'm not really interested in spending time on this part of the app */
/* sorry for disappointing anybody looking at this to see how much functionality there is */

function executeCommand(){
    var command = $(".command-text").last().text();

    if(command == "run github.exe"){
        if(currentDir == "github"){
            $(".ls-exec").addClass("ls-highlight")
            $(".container-border").animate({opacity: 0}, 500);

            setTimeout(function(){
                hideFn("github");
            }, 500);
        } else {
            writeResponse("<span class='alert'>Error:</span> No such file");
            writePrompt();
        }

    } else if(command == "run wikipedia.exe"){
        if(currentDir == "wikipedia"){
            $(".ls-exec").addClass("ls-highlight")
            $(".container-border").animate({opacity: 0}, 500);

            setTimeout(function(){
                hideFn("wikipedia");
            }, 500);

        } else {
            writeResponse("<span class='alert'>Error:</span> No such file");
            writePrompt();
        }

    } else if(command == "cd github"){
        $(".ls-github").addClass("ls-highlight")
        currentDir = "github";
        $(".folder-label").removeClass("selected");
        $("#lt-launch-github .folder-label").addClass("selected");
        writeResponse("Changed directory to <span class='highlight'>github</span>");
        writePrompt();

    } else if(command == "cd wikipedia"){
        $(".ls-wikipedia").addClass("ls-highlight")
        $(".folder-label").removeClass("selected");
        $("#lt-launch-wikipedia .folder-label").addClass("selected");
        currentDir = "wikipedia";
        writeResponse("Changed directory to <span class='highlight'>wikipedia</span>");
        writePrompt();
    } else if(command.indexOf("cd encom") == 0 || command == "cd /"){
        currentDir = "encom_root";
        writeResponse("Changed directory to <span class='highlight'>encom_root</span>");
        writePrompt();
    } else if(command.indexOf("cd ") == 0){
        writeResponse("<span class='alert'>Access denied</span>");
        writePrompt();
    } else if(command.indexOf("ls") == 0 && currentDir == "encom_root"){
        writeLs();
        writePrompt();

    } else if(command.indexOf("ls") == 0){
        writeLs(currentDir + ".exe");
        writePrompt();

    } else if(command.indexOf("run") == 0){
        writeResponse("<span class='alert'>Access denied</span>");
        writePrompt();
    } else {
        writeResponse("command not found");
        writePrompt();
    }
    var cl = $("#lt-command-lines");
    $("#lt-command-line").scrollTop(cl.height())

}

var keyBuffer = [];
var keysRunning = false;

function runKeySimulator(){
    var key = keyBuffer.shift();

    keyClick(key);

    if(keyBuffer.length > 0){
        setTimeout(runKeySimulator,10 + Math.random() * 150);
    } else {
        keysRunning = false;
    }

}

function simulateKey(key){
    keyBuffer.push(key);
    if(!keysRunning){
        keysRunning = true;
        setTimeout(runKeySimulator,100);
    }
}

function simulateCommand(command){
    var cs = command.split("");
    for(var i = 0; i < cs.length; i++){
        simulateKey(charToKeyCode(cs[i]));
    }

}

function charToKeyCode(char){
    var cc = char.charCodeAt(0);
    if(cc <= 122 && cc >=97){
        return cc - 32;
    } else if (char === "."){
        return 190;
    } else if (char === " "){
        return 32;
    } else if (char === "$"){
        return 13;
    }

    return 0;

}

function toggleKey(element){
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
}

function writeKeyStroke(keycode){
    var txt = $(".command-text").last();
    switch(keycode){
        case 8: 
            txt.text(txt.text().substring(0,txt.text().length-1));
        break;
        case 27: 
            txt.text("");
        break;
        case 13:
            executeCommand();
        break;
        case 189:
            txt.append("_");
        break;
        case 187:
            txt.append("=");
        break;
        case 219:
            txt.append("{");
        break;
        case 221:
            txt.append("}");
        break;
        case 186:
            txt.append(";");
        break;
        case 222:
            txt.append("'");
        break;
        case 188:
            txt.append(",");
        break;
        case 190:
            txt.append(".");
        break;
        case 191:
            txt.append("/");
        break;
        case 192:
            txt.append("~");
        break;
        case 500:
            txt.append("");
        break;
        default:
            var key = String.fromCharCode(keycode).toLowerCase();
        txt.append(key)
    };

}

function keyClick(keycode){

    // light up the keyboard

    toggleKey($("#k-" + keycode));

    if(keycode === 16){
        toggleKey($("#k-0"));
    }

    // write it to the screen
    writeKeyStroke(keycode);

}

module.exports = LightTable;
