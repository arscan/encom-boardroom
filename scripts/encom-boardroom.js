
;ENCOM = (function(){

    /* encom fucntions */

    var extend = function(first, second) {
        for(var i in first){
            second[i] = first[i];
        }
    };

    var sCurve = function(t) {
        return 1/(1 + Math.exp(-t*12 + 6));
    };

    // http://stackoverflow.com/a/13542669
    var shadeColor = function(color, percent) {   
        var num = parseInt(color.slice(1),16), 
            amt = Math.round(2.55 * percent), 
            R = (num >> 16) + amt, 
            G = (num >> 8 & 0x00FF) + amt, 
            B = (num & 0x0000FF) + amt;

        return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
    }

    var renderToCanvas = function (width, height, renderFunction) {
        var buffer = document.createElement('canvas');
        buffer.width = width;
        buffer.height = height;
        renderFunction(buffer.getContext('2d'));
        return buffer;
    };

    var drawCurvedRectangle = function(ctx, left, top, width, height, radius){
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

    // based on from http://stemkoski.github.io/Three.js/Texture-Animation.html
    var TextureAnimator = function(texture, tilesVert, tilesHoriz, numTiles, tileDispDuration, repeatAtTile) 
    {   
        var _this = this;
        // note: texture passed by reference, will be updated by the update function.
        
        if(repeatAtTile == undefined){
            repeatAtTile=-1;
        }

        this.shutDownFlag = (this.repeatAtTile < 0);
        this.done = false;


        this.tilesHorizontal = tilesHoriz;
        this.tilesVertical = tilesVert;

        // how many images does this spritesheet contain?
        //  usually equals tilesHoriz * tilesVert, but not necessarily,
        //  if there at blank tiles at the bottom of the spritesheet. 
        this.numberOfTiles = numTiles;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping; 
        texture.repeat.set( 1 / this.tilesHorizontal, 1 / this.tilesVertical );

        // how long should each image be displayed?
        this.tileDisplayDuration = tileDispDuration;

        // how long has the current image been displayed?
        this.currentDisplayTime = 0;

        // which image is currently being displayed?
        this.currentTile = 0;
        
        texture.offset.y = 1;

        this.update = function( milliSec )
        {
            this.currentDisplayTime += milliSec;
            while (!this.done && this.currentDisplayTime > this.tileDisplayDuration)
                {
                    if(this.shutDownFlag && this.currentTile >= numTiles){
                        this.done = true;
                        this.shutDownCb();
                    } else {
                        this.currentDisplayTime -= this.tileDisplayDuration;
                        this.currentTile++;
                        if (this.currentTile == numTiles && !this.shutDownFlag)
                            this.currentTile = repeatAtTile;
                        var currentColumn = this.currentTile % this.tilesHorizontal;
                        texture.offset.x = currentColumn / this.tilesHorizontal;
                        var currentRow = Math.floor( this.currentTile / this.tilesHorizontal );
                        texture.offset.y = 1-(currentRow / this.tilesVertical) - 1/this.tilesVertical;
                    }
                }
        };
        this.shutDown = function(cb){
            _this.shutDownFlag = true;
            _this.shutDownCb = cb;
        }

    }   

    /* globe */

    /* private globe function */

    var globe_latLonToXY = function(width, height, lat,lon){

        var x = Math.floor(width/2.0 + (width/360.0)*lon);
        var y = Math.floor(height - (height/2.0 + (height/180.0)*lat));

        return {x: x, y:y};
    };

    var globe_pixelData;

    var globe_isPixelBlack = function(context, x, y, width, height){
        if(globe_pixelData == undefined){
            globe_pixelData = context.getImageData(0,0,width, height);
        }
        return globe_pixelData.data[(y * globe_pixelData.width + x) * 4] === 0;
    };

    var globe_samplePoints = function(projectionContext, width, height, latoffset, lonoffset, latinc, loninc, cb){
        var points = [];
        for(var lat = 90-latoffset; lat > -90; lat -= latinc){
            for(var lon = -180+lonoffset; lon < 180; lon += loninc){
                var point = globe_latLonToXY(width, height, lat, lon);
                if(globe_isPixelBlack(projectionContext,point.x, point.y, width, height)){
                    cb({lat: lat, lon: lon});
                    points.push({lat: lat, lon: lon});
                }
            }
        }
        return points;
    };

    var globe_mapPoint = function(lat, lng, scale) {
       if(!scale){
           scale = 500;
       }
       var phi = (90 - lat) * Math.PI / 180;
       var theta = (180 - lng) * Math.PI / 180;
       var x = scale * Math.sin(phi) * Math.cos(theta);
       var y = scale * Math.cos(phi);
       var z = scale * Math.sin(phi) * Math.sin(theta);
       return {x: x, y: y, z:z};
     }

    var globe_addPointAnimation = function(when, verticleIndex, position){
        var pCount = this.globe_pointAnimations.length-1;
        while(pCount > 0 && this.globe_pointAnimations[pCount].when < when){
            pCount--;
        }
        this.globe_pointAnimations.splice(pCount+1,0, {when: when, verticleIndex: verticleIndex, position: position});
    };

    var globe_runPointAnimations = function(){
        var next;
        if(!this.firstRunTime){
            this.firstRunTime = Date.now();
        }

        if(this.globe_pointAnimations.length == 0){
            return;
        }

        while(this.globe_pointAnimations.length > 0 && this.firstRunTime + (next = this.globe_pointAnimations.pop()).when < Date.now()){
            this.globe_particles.geometry.vertices[next.verticleIndex].x = next.position.x;
            this.globe_particles.geometry.vertices[next.verticleIndex].y = next.position.y;
            this.globe_particles.geometry.vertices[next.verticleIndex].z = next.position.z;

            this.globe_particles.geometry.verticesNeedUpdate = true;
        }
        if(this.firstRunTime + next.when >= Date.now()){
            this.globe_pointAnimations.push(next);
        }

    };

    var globe_createLabel = function(text, x, y, z, size, color, underlineColor) {

        var canvas = document.createElement("canvas");

        var context = canvas.getContext("2d");
        context.font = size + "pt Inconsolata";

        var textWidth = context.measureText(text).width;

        canvas.width = textWidth;
        canvas.height = size + 10;
        if(underlineColor){
            canvas.height += 30;
        }
        context = canvas.getContext("2d");
        context.font = size + "pt Inconsolata";

        context.textAlign = "center";
        context.textBaseline = "middle";

        context.strokeStyle = 'black';

        context.miterLimit = 2;
        context.lineJoin = 'circle';
        context.lineWidth = 6;

        context.strokeText(text, canvas.width / 2, canvas.height / 2);

        context.lineWidth = 1;

        context.fillStyle = color;
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        if(underlineColor){
            context.strokeStyle=underlineColor;
            context.lineWidth=2;
            context.beginPath();
            context.moveTo(0, canvas.height-10);
            context.lineTo(canvas.width-1, canvas.height-10);
            context.stroke();
        }

        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;

        var material = new THREE.SpriteMaterial({
            map : texture,
            useScreenCoordinates: false,
            opacity:0,
            depthTest: false,
            fog: true
            
            });
        var sprite = new THREE.Sprite(material);
        sprite.position = {x: x*1.1, y: y + (y < 0 ? -15 : 30), z: z*1.1};
        sprite.scale.set(canvas.width, canvas.height);
            new TWEEN.Tween( {opacity: 0})
                .to( {opacity: 1}, 500 )
                .onUpdate(function(){
                    material.opacity = this.opacity
                }).delay(1000)
                .start();

        return sprite;

    }

    var globe_createSatelliteCanvas = function(numFrames, pixels, rows, waveStart, numWaves) {

        var canvas = document.createElement("canvas");

        var cols = numFrames / rows;

        var waveInterval = Math.floor((numFrames-waveStart)/numWaves);

        var waveDist = pixels - 25; // width - center of satellite
        var distPerFrame = waveDist / (numFrames-waveStart)

        canvas.width=numFrames*pixels / rows;
        canvas.height=pixels*rows;

        var ctx=canvas.getContext("2d");

        var offsetx = 0,
            offsety = 0;
        var curRow = 0;

        for(var i = 0; i< numFrames; i++){
            if(i - curRow * cols >= cols){
                offsetx = 0;
                offsety += pixels;
                curRow++;
            }

            var centerx = offsetx + 25;
            var centery = offsety + Math.floor(pixels/2);

           /* white circle around red core */
            // i have between 0 and wavestart to fade in
            // i have between wavestart and  waveend - (time between waves*2) 
            // to do a full spin close and then back open
            // i have between waveend-2*(timebetween waves)/2 and waveend to rotate Math.PI/4 degrees
            // this is probably the ugliest code in all of here -- basically I just messed arund with stuff until it looked ok
           
            ctx.lineWidth=2;
            ctx.strokeStyle="#FFFFFF";
            var buffer=Math.PI/16;
            var start = -Math.PI + Math.PI/4;
            var radius = 8;
            var repeatAt = Math.floor(numFrames-2*(numFrames-waveStart)/numWaves)+1;

            /* fade in and out */
            if(i<waveStart){
                radius = radius*i/waveStart;
            }

            var swirlDone = Math.floor((repeatAt-waveStart) / 2) + waveStart;

            for(var n = 0; n < 4; n++){
                ctx.beginPath();

                if(i < waveStart || i>=numFrames){

                    ctx.arc(centerx, centery, radius,n* Math.PI/2 + start+buffer, n*Math.PI/2 + start+Math.PI/2-2*buffer);

                } else if(i > waveStart && i < swirlDone){
                    var totalTimeToComplete = swirlDone - waveStart;
                    var distToGo = 3*Math.PI/2;
                    var currentStep = (i-waveStart);
                    var movementPerStep = distToGo / totalTimeToComplete;

                    var startAngle = -Math.PI + Math.PI/4 + buffer + movementPerStep*currentStep;

                    ctx.arc(centerx, centery, radius,Math.max(n*Math.PI/2 + start,startAngle), Math.max(n*Math.PI/2 + start + Math.PI/2 - 2*buffer, startAngle +Math.PI/2 - 2*buffer));

                } else if(i >= swirlDone && i< repeatAt){
                    var totalTimeToComplete = repeatAt - swirlDone;
                    var distToGo = n*2*Math.PI/4;
                    var currentStep = (i-swirlDone);
                    var movementPerStep = distToGo / totalTimeToComplete;
                

                    var startAngle = Math.PI/2 + Math.PI/4 + buffer + movementPerStep*currentStep;
                    ctx.arc(centerx, centery, radius,startAngle, startAngle + Math.PI/2 - 2*buffer);

                } else if(i >= repeatAt && i < (numFrames-repeatAt)/2 + repeatAt){

                    var totalTimeToComplete = (numFrames-repeatAt)/2;
                    var distToGo = Math.PI/2;
                    var currentStep = (i-repeatAt);
                    var movementPerStep = distToGo / totalTimeToComplete;
                    var startAngle = n*(Math.PI/2)+ Math.PI/4 + buffer + movementPerStep*currentStep;

                    ctx.arc(centerx, centery, radius,startAngle, startAngle + Math.PI/2 - 2*buffer);

                } else{
                    ctx.arc(centerx, centery, radius,n* Math.PI/2 + start+buffer, n*Math.PI/2 + start+Math.PI/2-2*buffer);
                }
                ctx.stroke();
            }

            // frame i'm on * distance per frame

            /* waves going out */
            var frameOn;

            for(var wi = 0; wi<numWaves; wi++){
                frameOn = i-(waveInterval*wi)-waveStart;
                if(frameOn > 0 && frameOn * distPerFrame < pixels - 25){
                    ctx.strokeStyle="rgba(255,255,255," + (.9-frameOn*distPerFrame/(pixels-25)) + ")";
                    ctx.lineWidth=2;
                    ctx.beginPath();
                    ctx.arc(centerx, centery, frameOn * distPerFrame, -Math.PI/12, Math.PI/12);
                    ctx.stroke();
                }
            }
            /* red circle in middle */

            ctx.fillStyle="#000";
            ctx.beginPath();
            ctx.arc(centerx,centery,3,0,2*Math.PI);
            ctx.fill();

            ctx.strokeStyle="#FF0000";
            ctx.lineWidth=2;
            ctx.beginPath();
            if(i<waveStart){
                ctx.arc(centerx,centery,3*i/waveStart,0,2*Math.PI);
            } else {
                ctx.arc(centerx,centery,3,0,2*Math.PI);
            }
            ctx.stroke();

            offsetx += pixels;
        }

        return canvas;
    };

    var globe_createSpecialMarkerCanvas = function() {

        var canvas = document.createElement("canvas");

        canvas.width=100;
        canvas.height=100;

        var ctx=canvas.getContext("2d");

        ctx.strokeStyle="#FFCC00";
        ctx.lineWidth=3;
        ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2, canvas.width/3+10, 0, 2* Math.PI);
        ctx.stroke();

        ctx.fillStyle="#FFCC00";
        ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2, canvas.width/4, 0, 2* Math.PI);
        ctx.fill();

        return canvas;

    }

    var globe_mainParticles = function(){

        var material, geometry;

        var colors = [];

        var sprite = this.hexTexture;
        var myColors1 = pusher.color('#ffcc00').hueSet();
        var myColors = [];
        for(var i = 0; i< myColors1.length; i++){
            myColors.push(myColors1[i]);

            // myColors.push(myColors1[i].shade(.2 + Math.random()/2.0));
            // myColors.push(myColors1[i].shade(.2 + Math.random()/2.0));
        }
        var geometry = new THREE.Geometry();

        for ( i = 0; i < this.points.length; i ++ ) {
            

            var vertex = new THREE.Vector3();
            var point = globe_mapPoint(this.points[i].lat, this.points[i].lon, 500);
            var delay = this.swirlTime*((180+this.points[i].lon)/360.0); 

            vertex.x = 0;
            vertex.y = 0;
            vertex.z = this.cameraDistance+1;

            geometry.vertices.push( vertex );

            globe_addPointAnimation.call(this,delay, i, {
                x : point.x*this.swirlMultiplier,
                y : point.y*this.swirlMultiplier,
                z : point.z*this.swirlMultiplier});

            for(var a = 0; a < 4; a++){
                globe_addPointAnimation.call(this,delay + 500 + (60)*a, i, {
                    x : point.x*(this.swirlMultiplier - (.1 + a/40.0)),
                    y : point.y*(this.swirlMultiplier - (.1 + a/40.0)),
                    z : point.z*(this.swirlMultiplier - (.1 + a/40.0))});
            }

            globe_addPointAnimation.call(this,delay + 690, i, {
                x : point.x,
                y : point.y,
                z : point.z});

            colors[i] = new THREE.Color( myColors[Math.floor(Math.random() * myColors.length)].hex6());

        }

        geometry.colors = colors;

        material = new THREE.ParticleSystemMaterial( { size: 13, map: sprite, vertexColors: true, transparent: false} );

        this.globe_particles = new THREE.ParticleSystem( geometry, material );
        this.globe_particles.geometry.dynamic=true;


        this.scene.add( this.globe_particles );

    };

    var globe_swirls = function(){
        var geometrySpline;
        var sPoint;
        var _this = this;

        this.swirlMaterial = new THREE.LineBasicMaterial({
                color: 0x8FD8D8,
                transparent: true,
                linewidth: 2,
                opacity: .8
            });

        for(var i = 0; i<75; i++){
            geometrySpline = new THREE.Geometry();

            var lat = Math.random()*180 + 90;
            var lon =  Math.random()*5;
            var lenBase = 4 + Math.floor(Math.random()*5);

            if(Math.random()<.3){
                lon = Math.random()*30 - 50;
                lenBase = 3 + Math.floor(Math.random()*3);
            }

            for(var j = 0; j< lenBase; j++){
                var thisPoint = globe_mapPoint(lat, lon - j * 5);
                sPoint = new THREE.Vector3(thisPoint.x*this.swirlMultiplier, thisPoint.y*this.swirlMultiplier, thisPoint.z*this.swirlMultiplier);

                geometrySpline.vertices.push(sPoint);  
            }

            this.swirl.add(new THREE.Line(geometrySpline, this.swirlMaterial));
            
        }
        this.scene.add(this.swirl);
    };

    var globe_removeMarker = function(marker){

        var pos = marker.line.geometry.vertices[1];
        var _this = this;
        var scaleDownBy = 1+ Math.random()*.2;

        if(!marker.active){
            return;
        }

        marker.active = false;

        for(var i = marker.startSmokeIndex; i< marker.smokeCount + marker.startSmokeIndex; i++){
            var realI = i % _this.smokeAttributes.active.value.length;
            _this.smokeAttributes.active.value[realI] = 0.0;
            _this.smokeAttributes.active.needsUpdate = true;
        }

        new TWEEN.Tween({posx: pos.x, posy: pos.y, posz: pos.z, opacity: 1})
            .to( {posx: pos.x/scaleDownBy, posy: pos.y/scaleDownBy, posz: pos.z/scaleDownBy, opacity: 0}, 1000 )
            .onUpdate(function(){

                marker.line.geometry.vertices[1].set(this.posx, this.posy, this.posz);
                marker.line.geometry.verticesNeedUpdate = true;
                marker.label.material.opacity = this.opacity;
                marker.top.material.opacity = this.opacity;
                marker.top.position.set(this.posx, this.posy, this.posz);
            })
            .onComplete(function(){
                _this.scene.remove(marker.label);
                _this.scene.remove(marker.top);
            })
            .start();

        this.quills.push({
            line: marker.line,
            latlng: marker.latlng
        });

        if(this.quills.length > this.maxQuills){
            globe_removeQuill.call(this, this.quills.shift());
        }


    };

    var globe_removeQuill = function(quill){

        var pos = quill.line.geometry.vertices[1];
        var pos2 = quill.line.geometry.vertices[0];
        var _this = this;
        var scaleDownBy = 1+ Math.random()*.2;

        delete this.markerIndex[quill.latlng];

        new TWEEN.Tween({posx: pos.x, posy: pos.y, posz: pos.z, opacity: 1})
            .to( {posx: pos2.x, posy: pos2.y, posz: pos2.z}, 1000 )
            .onUpdate(function(){
                quill.line.geometry.vertices[1].set(this.posx, this.posy, this.posz);
                quill.line.geometry.verticesNeedUpdate = true;
            })
            .onComplete(function(){
                _this.scene.remove(quill.line);
            })
            .start();

    };

    var globe_updateSatellites = function(renderTime){
        for(var i = 0; i< this.satelliteAnimations.length; i++){
            this.satelliteAnimations[i].update(renderTime);
        }
    };

    var globe_registerMarker = function(marker, lat, lng){
        var labelKey = Math.floor(lat/20) + '-' + Math.floor(lng/40);
        if(Math.abs(lat)>80){
            labelKey = Math.floor(lat/20);
        }
        this.markerCoords[labelKey] = marker;
        
    };

    var globe_findNearbyMarkers = function(lat, lng){
        var ret = [];
        var labelKey = Math.floor(lat/20) + '-' + Math.floor(lng/40);
        if(Math.abs(lat)>80){
            labelKey = Math.floor(lat/20);
        }

        if(this.markerCoords[labelKey]){
            ret.push(this.markerCoords[labelKey]);
        }

        return ret;
        
    };

    /* globe constructor */

    function globe(opts){

        if(!opts){
            opts = {};
        }

        var baseSampleMultiplier = .85;

        var defaults = {
            mapUrl: "equirectangle_projection.png",
            size: 100,
            width: document.width,
            height: document.height,
            swirlMultiplier: 1.15,
            swirlTime: 3500,
            cameraDistance: 1700,
            samples: [
                { 
                    offsetLat: 0,
                    offsetLon: 0,
                    incLat: baseSampleMultiplier * 2,
                    incLon: baseSampleMultiplier * 4
                },
                { 
                    offsetLat: baseSampleMultiplier,
                    offsetLon: baseSampleMultiplier * 2,
                    incLat: baseSampleMultiplier * 2,
                    incLon: baseSampleMultiplier * 4
                }
                ],
            points: [],
            globe_pointAnimations: [],
            swirl: new THREE.Object3D(),
            markers: [],
            quills: [],
            markerCoords: {},
            maxMarkers: 20,
            maxQuills:100,
            markerIndex: {},

            satelliteAnimations: [],
            satelliteMeshes: []

        };

        this.smokeIndex = 0;

        extend(opts, defaults);

        for(var i in defaults){
            if(!this[i]){
                this[i] = defaults[i];
            }
        }

    }

    /* public globe functions */

    globe.prototype.init = function(cb){
        var  projectionContext,
            img = document.createElement('img'),
            projectionCanvas = document.createElement('canvas'),
            _this = this;
            
        document.body.appendChild(projectionCanvas);
        projectionContext = projectionCanvas.getContext('2d');

        var numRegistered = 0;

        var registerCallback = function(){
            numRegistered++;
            return function(){

                numRegistered--;

                if(numRegistered == 0){
                    //image has loaded, may rsume
                    projectionCanvas.width = img.width;
                    projectionCanvas.height = img.height;
                    projectionContext.drawImage(img, 0, 0, img.width, img.height);
                    for (var i = 0; i< _this.samples.length; i++){
                        
                        globe_samplePoints(projectionContext,img.width, img.height, _this.samples[i].offsetLat, _this.samples[i].offsetLon, _this.samples[i].incLat, _this.samples[i].incLon, function(point){
                            if((point.lat > -60 || Math.random() > .9) && Math.random()>.2){ // thin it out (especially antartica)
                                _this.points.push(point);
                            }
                        });
                    }
                    document.body.removeChild(projectionCanvas);

                    // create the webgl context, renderer and camera
                    if(_this.containerId){
                        _this.container = document.getElementById(_this.containerId);
                        _this.width = _this.container.clientWidth;
                        _this.height = _this.container.clientHeight;
                    } else {
                        _this.container = document.createElement( 'div' );
                        _this.container.width = _this.width;
                        _this.container.height = _this.height;
                        document.body.appendChild( _this.container );
                    }

                    // TEMP
                    // _this.container.appendChild( _this.specialPointCanvas);

                    _this.renderer = new THREE.WebGLRenderer( { antialias:true } );
                    // _this.renderer = new THREE.CanvasRenderer( { clearAlpha: 1 } );
                    _this.renderer.setSize( _this.width, _this.height);
                    // _this.renderer.autoClear = false;
                    _this.container.appendChild( _this.renderer.domElement );

                    // create the camera

                    _this.camera = new THREE.PerspectiveCamera( 50, _this.width / _this.height, 1, _this.cameraDistance + 275 );
                    _this.camera.position.z = _this.cameraDistance;
                    
                    _this.cameraAngle=(Math.PI * 2) * .5;

                    // create the scene

                    _this.scene = new THREE.Scene();

                    _this.scene.fog = new THREE.Fog( 0x000000, _this.cameraDistance-200, _this.cameraDistance+275 );

                    // add the globe particles
                    
                    globe_mainParticles.call(_this);

                    // add the swirls
                    globe_swirls.call(_this);

                    // pregenerate the satellite canvas
                    var numFrames = 50;
                    var pixels = 100;
                    var rows = 10;
                    var waveStart = Math.floor(numFrames/8);
                    var numWaves = 8;
                    var repeatAt = Math.floor(numFrames-2*(numFrames-waveStart)/numWaves)+1;
                    _this.satelliteCanvas = globe_createSatelliteCanvas.call(this, numFrames, pixels, rows, waveStart, numWaves);

                    // initialize the smoke
                    // create particle system
                    _this.smokeParticleGeometry = new THREE.Geometry();

                   _this.smokeVertexShader = [
                       "#define PI 3.141592653589793238462643",
                       "#define DISTANCE 600.0",
                       "attribute float myStartTime;",
                       "attribute float myStartLat;",
                       "attribute float myStartLon;",
                       "attribute float active;",
                       "uniform float currentTime;",
                       "uniform vec3 color;",
                       "varying vec4 vColor;",
                       "",
                       "vec3 getPos(float lat, float lon)",
                       "{",
                           "if (lon < -180.0){",
                           "   lon = 180.0;",
                           "}",
                           "float phi = (90.0 - lat) * PI / 180.0;",
                           "float theta = (180.0 - lon) * PI / 180.0;",
                           "float x = DISTANCE * sin(phi) * cos(theta);",
                           "float y = DISTANCE * cos(phi);",
                           "float z = DISTANCE * sin(phi) * sin(theta);",
                           "return vec3(x, y, z);",
                       "}",
                       "",
                       "void main()",
                       "{",
                           "float dt = currentTime - myStartTime;",
                           "if (dt < 0.0){",
                              "dt = 0.0;",
                           "}",
                           "if (dt > 0.0 && active > 0.0) {",
                             "dt = mod(dt,1500.0);",
                           "}",
                           "float opacity = 1.0 - dt/ 1500.0;",
                           "if (dt == 0.0){",
                              "opacity = 0.0;",
                           "}",
                           "float cameraAngle = (2.0 * PI) / (20000.0/currentTime);",
                           "float myAngle = (180.0-myStartLon) * PI / 180.0;",
                           "opacity = opacity * (cos(myAngle - cameraAngle - PI) + 1.0)/2.0;",
                           "float newPosRaw = myStartLon - (dt / 50.0);",
                           "vec3 newPos = getPos(myStartLat, myStartLon - ( dt / 50.0));",
                           "vColor = vec4( color, opacity );", //     set color associated to vertex; use later in fragment shader.
                           "vec4 mvPosition = modelViewMatrix * vec4( newPos, 1.0 );",
                           "gl_PointSize = 2.5 - (dt / 1500.0);",
                           "gl_Position = projectionMatrix * mvPosition;",
                       "}"
                       ].join("\n");

                   _this.smokeFragmentShader = [
                       "varying vec4 vColor;",     
                        "void main()", 
                        "{",
                           "gl_FragColor = vColor;",
                        "}"
                    ].join("\n");

                    _this.smokeAttributes = {
                        myStartTime: {type: 'f', value: []},
                        myStartLat: {type: 'f', value: []},
                        myStartLon: {type: 'f', value: []},
                        active: {type: 'f', value: []}
                    };

                    _this.smokeUniforms = {
                        currentTime: { type: 'f', value: 0.0},
                        color: { type: 'c', value: new THREE.Color("#aaa")},
                    }

                    _this.smokeMaterial = new THREE.ShaderMaterial( {
                        uniforms:       _this.smokeUniforms,
                        attributes:     _this.smokeAttributes,
                        vertexShader:   _this.smokeVertexShader,
                        fragmentShader: _this.smokeFragmentShader,
                        transparent:    true
                    });

                    for(var i = 0; i< 2000; i++){
                        var vertex = new THREE.Vector3();
                        vertex.set(1000,1000,1000);
                        _this.smokeParticleGeometry.vertices.push( vertex );
                        _this.smokeAttributes.myStartTime.value[i] = 0.0;
                        _this.smokeAttributes.myStartLat.value[i] = 0.0;
                        _this.smokeAttributes.myStartLon.value[i] = 0.0;
                        _this.smokeAttributes.active.value[i] = 0.0;
                    }
                    _this.smokeAttributes.myStartTime.needsUpdate = true;
                    _this.smokeAttributes.myStartLat.needsUpdate = true;
                    _this.smokeAttributes.myStartLon.needsUpdate = true;
                    _this.smokeAttributes.active.needsUpdate = true;

                    var particleSystem = new THREE.ParticleSystem( _this.smokeParticleGeometry, _this.smokeMaterial);

                    _this.scene.add( particleSystem);

                    cb();
                }

            }
        };

        this.markerTopTexture = new THREE.ImageUtils.loadTexture( 'markertop.png', undefined, registerCallback());
        this.hexTexture = THREE.ImageUtils.loadTexture( "hex.png", undefined, registerCallback());
        
        this.specialMarkerTexture = new THREE.Texture(globe_createSpecialMarkerCanvas.call(this));
        this.specialMarkerTexture.needsUpdate = true;

        img.addEventListener('load', registerCallback());

        img.src = this.mapUrl;
    };

    globe.prototype.addMarker = function(lat, lng, text){

        var _this = this;
        var point = globe_mapPoint(lat,lng);


        /* check to see if we have somebody at that exact lat-lng right now */

        var checkExisting = this.markerIndex[lat + "-" + lng];
        if(checkExisting){
            return false;
        }

        // always make at least a line for the quill
        //
        /* add line */
        var markerGeometry = new THREE.Geometry();
        var markerMaterial = new THREE.LineBasicMaterial({
            color: 0x8FD8D8,
            });
        markerGeometry.vertices.push(new THREE.Vector3(point.x, point.y, point.z));
        markerGeometry.vertices.push(new THREE.Vector3(point.x, point.y, point.z));
        var line = new THREE.Line(markerGeometry, markerMaterial);
        this.scene.add(line);

        line._globe_multiplier = 1.2; // if normal line, make it 1.2 times the radius in orbit

        var existingMarkers = globe_findNearbyMarkers.call(_this, lat, lng);
        var allOld = true;
        for(var i = 0; i< existingMarkers.length; i++){
            if(Date.now() - existingMarkers[i].creationDate < 10000){
                allOld = false;
            }
        }
        this.markerIndex[lat + "-" + lng] = true;

        if(existingMarkers.length == 0 || allOld){
            // get rid of old ones
            
            for(var i = 0; i< existingMarkers.length; i++){
                globe_removeMarker.call(this, existingMarkers[i]);
            }

            // create the new one

            /* add the text */
            var textSprite = globe_createLabel(text, point.x*1.18, point.y*1.18, point.z*1.18, 18, "white");
            this.scene.add(textSprite);

            /* add the top */
            var markerTopMaterial = new THREE.SpriteMaterial({map: _this.markerTopTexture, color: 0xFD7D8, depthTest: false, fog: true});
            var markerTopSprite = new THREE.Sprite(markerTopMaterial);
            markerTopSprite.scale.set(15, 15);
            markerTopSprite.position.set(point.x*1.2, point.y*1.2, point.z*1.2);


            /* add the smoke */
            var startSmokeIndex = _this.smokeIndex;

            for(var i = 0; i< 30; i++){
                _this.smokeParticleGeometry.vertices[_this.smokeIndex].set(point.x * 1.2, point.y * 1.2, point.z * 1.2);
                _this.smokeParticleGeometry.verticesNeedUpdate = true;
                _this.smokeAttributes.myStartTime.value[_this.smokeIndex] = _this.totalRunTime + (i*50 + 1500);
                _this.smokeAttributes.myStartLat.value[_this.smokeIndex] = lat;
                _this.smokeAttributes.myStartLon.value[_this.smokeIndex] = lng;
                _this.smokeAttributes.active.value[_this.smokeIndex] = 1.0;
                _this.smokeAttributes.myStartTime.needsUpdate = true;
                _this.smokeAttributes.myStartLat.needsUpdate = true;
                _this.smokeAttributes.myStartLon.needsUpdate = true;
                _this.smokeAttributes.active.needsUpdate = true;

                _this.smokeIndex++;
                _this.smokeIndex = _this.smokeIndex % _this.smokeParticleGeometry.vertices.length;
            }

            var m = {
                line: line,
                label: textSprite,
                top: markerTopSprite,
                startSmokeIndex: startSmokeIndex,
                smokeCount: 30,
                active: true,
                creationDate: Date.now(),
                latlng: lat + "-" + lng
            };

            this.markers.push(m);

            globe_registerMarker.call(_this,m, lat, lng);

            setTimeout(function(){
                _this.scene.add(markerTopSprite);
            }, 1500)

        } else {
            line._globe_multiplier = 1 + (.05 + Math.random() * .15); // randomize how far out
            this.quills.push({
                line: line,
                latlng: lat + "-" + lng
            });
            

            if(this.quills.length > this.maxQuills){
                globe_removeQuill.call(this, this.quills.shift());
            }
        }

        new TWEEN.Tween(point)
            .to( {x: point.x*line._globe_multiplier, y: point.y*line._globe_multiplier, z: point.z*line._globe_multiplier}, 1500 )
            .easing( TWEEN.Easing.Elastic.InOut )
            .onUpdate(function(){
                markerGeometry.vertices[1].x = this.x;
                markerGeometry.vertices[1].y = this.y;
                markerGeometry.vertices[1].z = this.z;
                markerGeometry.verticesNeedUpdate = true;
            })
            .start();


    }

    globe.prototype.addConnectedPoints = function(lat1, lng1, text1, lat2, lng2, text2){

        var _this = this;

        var point1 = globe_mapPoint(lat1,lng1);
        var point2 = globe_mapPoint(lat2,lng2);

        var markerMaterial = new THREE.SpriteMaterial({map: _this.specialMarkerTexture, opacity: .7, depthTest: false, fog: true});
        // var markerMaterial = new THREE.SpriteMaterial({map: _this.markerTopTexture});

        var marker1 = new THREE.Sprite(markerMaterial);
        var marker2 = new THREE.Sprite(markerMaterial);

        marker1.scale.set(0, 0);
        marker2.scale.set(0, 0);

        marker1.position.set(point1.x*1.2, point1.y*1.2, point1.z*1.2);
        marker2.position.set(point2.x*1.2, point2.y*1.2, point2.z*1.2);

        this.scene.add(marker1);
        this.scene.add(marker2);

        var textSprite1 = globe_createLabel(text1.toUpperCase(), point1.x*1.25, point1.y*1.25, point1.z*1.25, 25, "white", "#FFCC00");
        var textSprite2 = globe_createLabel(text2.toUpperCase(), point2.x*1.25, point2.y*1.25, point2.z*1.25, 25, "white", "#FFCC00");

        this.scene.add(textSprite1);
        this.scene.add(textSprite2);

        new TWEEN.Tween({x: 0, y: 0})
            .to({x: 50, y: 50}, 2000)
            .easing( TWEEN.Easing.Elastic.InOut )
            .onUpdate(function(){
                marker1.scale.set(this.x, this.y);
            })
            .start();

        new TWEEN.Tween({x: 0, y: 0})
            .to({x: 45, y: 45}, 2000)
            .easing( TWEEN.Easing.Elastic.InOut )
            .onUpdate(function(){
                marker2.scale.set(this.x, this.y);
            })
            .delay(2200)
            .start();

        var geometrySpline = new THREE.Geometry();
        var materialSpline = new THREE.LineBasicMaterial({
            color: 0xFFCC00,
            transparent: true,
            linewidth: 2,
            opacity: .5
        });

        var geometrySpline2 = new THREE.Geometry();
        var materialSpline2 = new THREE.LineBasicMaterial({
            color: 0xFFCC00,
            linewidth: 1,
            transparent: true,
            opacity: .5
        });

        var latdist = (lat2 - lat1)/99;
        var londist = (lng2 - lng1)/99;
        var startPoint = globe_mapPoint(lat1, lng1);
        var pointList = [];
        var pointList2 = [];

        for(var j = 0; j< 100; j++){
            // var nextlat = ((90 + lat1 + j*1)%180)-90;
            // var nextlon = ((180 + lng1 + j*1)%360)-180;

            
            var nextlat = (((90 + lat1 + j*latdist)%180)-90) * (.5 + Math.cos(j*(5*Math.PI/2)/99)/2) + (j*lat2/99/2);
            var nextlon = ((180 + lng1 + j*londist)%360)-180;
            pointList.push({lat: nextlat, lon: nextlon, index: j});
            if(j == 0 || j == 99){
                pointList2.push({lat: nextlat, lon: nextlon, index: j});
            } else {
                pointList2.push({lat: nextlat+1, lon: nextlon, index: j});
            }
            // var thisPoint = globe_mapPoint(nextlat, nextlon);
            sPoint = new THREE.Vector3(startPoint.x*1.2, startPoint.y*1.2, startPoint.z*1.2);
            sPoint2 = new THREE.Vector3(startPoint.x*1.2, startPoint.y*1.2, startPoint.z*1.2);
            // sPoint = new THREE.Vector3(thisPoint.x*1.2, thisPoint.y*1.2, thisPoint.z*1.2);

            sPoint.globe_index = j;
            sPoint2.globe_index = j;

            geometrySpline.vertices.push(sPoint);  
            geometrySpline2.vertices.push(sPoint2);  
        }

        var currentLat = lat1;
        var currentLon = lng1;
        var currentPoint;
        var currentVert;

        var update = function(){
            var nextSpot = pointList.shift();
            var nextSpot2 = pointList2.shift();
            
            for(var x = 0; x< geometrySpline.vertices.length; x++){
                
                currentVert = geometrySpline.vertices[x];
                currentPoint = globe_mapPoint(nextSpot.lat, nextSpot.lon);

                currentVert2 = geometrySpline2.vertices[x];
                currentPoint2 = globe_mapPoint(nextSpot2.lat, nextSpot2.lon);


                if(x >= nextSpot.index){
                    currentVert.set(currentPoint.x*1.2, currentPoint.y*1.2, currentPoint.z*1.2);
                    currentVert2.set(currentPoint2.x*1.19, currentPoint2.y*1.19, currentPoint2.z*1.19);
                }
                geometrySpline.verticesNeedUpdate = true;
                geometrySpline2.verticesNeedUpdate = true;
            }
            if(pointList.length > 0){
                setTimeout(update,30);
            }

        };
        setTimeout(function(){
            update();
        }, 2000);


        this.scene.add(new THREE.Line(geometrySpline, materialSpline));
        this.scene.add(new THREE.Line(geometrySpline2, materialSpline2, THREE.LinePieces));
            
    }


    globe.prototype.addSatellite = function(lat, lon, dist, newTexture){

        var point = globe_mapPoint(lat,lon);
        point.x *= dist;
        point.y *= dist;
        point.z *= dist;

        var numFrames = 50;
        var pixels = 100;
        var rows = 10;
        var waveStart = Math.floor(numFrames/8);
        var numWaves = 8;
        var repeatAt = Math.floor(numFrames-2*(numFrames-waveStart)/numWaves)+1;

        if(newTexture || !this.satelliteTexture){
           this.satelliteTexture = new THREE.Texture(this.satelliteCanvas)
           this.satelliteTexture.needsUpdate = true;
           var animator = new TextureAnimator(this.satelliteTexture,rows, numFrames/rows, numFrames, 80, repeatAt); 
           this.satelliteAnimations.push(animator);
        }

        var material = new THREE.MeshBasicMaterial({
            map : this.satelliteTexture,
            transparent: true
        });

        var geo = new THREE.PlaneGeometry(150,150,1,1);
        var mesh = new THREE.Mesh(geo, material);

        mesh.tiltMultiplier = Math.PI/2 * (1 - Math.abs(lat / 90));
        mesh.tiltDirection = (lat > 0 ? -1 : 1);
        mesh.lon = lon;

        this.satelliteMeshes.push(mesh);

        mesh.position.set(point.x, point.y, point.z);

        mesh.rotation.z = -1*(lat/90)* Math.PI/2;
        mesh.rotation.y = (lon/180)* Math.PI
        this.scene.add(mesh);
        return {mesh: mesh, shutDownFunc: (animator ? animator.shutDown : function(){})};

    };

    globe.prototype.removeSatellite = function(sat){
        var _this = this;


        function kill(){
            var pos = -1;
            for(var i = 0; i < _this.satelliteMeshes.length; i++){
                if(sat.mesh == _this.satelliteMeshes[i]){
                    pos = i;
                }
            }

            // cannot remove the first one
            if(pos >= 0){
                _this.scene.remove(sat.mesh);
                _this.satelliteMeshes.splice(pos,1);
            }
        }

        // don't shut down the first one
        if(this.satelliteAnimations.length > 1){
            sat.shutDownFunc(kill);

        } else {
            kill();
        }


    };


    globe.prototype.tick = function(){
        globe_runPointAnimations.call(this);
        TWEEN.update();

        if(!this.lastRenderDate){
            this.lastRenderDate = new Date();
        }

        if(!this.firstRenderDate){
            this.firstRenderDate = new Date();
        }

        this.totalRunTime = new Date() - this.firstRenderDate;

        var renderTime = new Date() - this.lastRenderDate;
        this.lastRenderDate = new Date();
        var rotateCameraBy = (2 * Math.PI)/(20000/renderTime);

        this.cameraAngle += rotateCameraBy;

        this.camera.position.x = this.cameraDistance * Math.cos(this.cameraAngle);
        this.camera.position.y = 400;
        this.camera.position.z = this.cameraDistance * Math.sin(this.cameraAngle);


        for(var i = 0; i< this.satelliteMeshes.length; i++){
            var mesh = this.satelliteMeshes[i];
            // this.satelliteMeshes[i].rotation.y-=rotateCameraBy;
            mesh.lookAt(this.camera.position);
            mesh.rotateZ(mesh.tiltDirection * Math.PI/2);
            mesh.rotateZ(Math.sin(this.cameraAngle + (mesh.lon / 180) * Math.PI) * mesh.tiltMultiplier * mesh.tiltDirection * -1);

            
        }

        if(this.swirlTime > this.totalRunTime){
            if(this.totalRunTime/this.swirlTime < .1){
                this.swirlMaterial.opacity = (this.totalRunTime/this.swirlTime)*10 - .2;
            } else if(this.totalRunTime/this.swirlTime < .9){
                this.swirlMaterial.opacity = .8;
            }if(this.totalRunTime/this.swirlTime > .9){
                this.swirlMaterial.opacity = Math.max(1-this.totalRunTime/this.swirlTime,0);
            }
            this.swirl.rotateY((2 * Math.PI)/(this.swirlTime/renderTime));
        } else if(this.swirl){
            this.scene.remove(this.swirl);
            delete[this.swirl];

        }

        // do the particles
        
        this.smokeUniforms.currentTime.value = this.totalRunTime;

        this.camera.lookAt( this.scene.position );
        this.renderer.render( this.scene, this.camera );
        globe_updateSatellites.call(this, renderTime);

    }

    /* Box */

    var box_createSideCanvas = function(){

        var sideCanvas =  renderToCanvas(200, 100, function(ctx){


            var gradient = ctx.createLinearGradient(0, -100, 0, 100);
            gradient.addColorStop(0, "#fff");
            gradient.addColorStop(1, "transparent");
            ctx.fillStyle = gradient;
            ctx.fillRect(0,0,200, 100);

        }.bind(this));

        // this.container.appendChild( sideCanvas );
        
        return sideCanvas;

    };

    var Box = function(opts){

        // create the webgl context, renderer and camera
        if(opts.containerId){
            this.container = document.getElementById(opts.containerId);
            this.width = this.container.clientWidth - 5;
            this.height = this.container.clientHeight - 5;
        } else {
            this.container = document.createElement( 'div' );
            this.container.width = this.width;
            this.container.height = this.height;
            document.body.appendChild( this.container );
        }

        this.cameraDistance = 75;

        this.trackers = [];
        this.trackerBalls = [];

        // TEMP
        // _this.container.appendChild( _this.specialPointCanvas);

        this.renderer = new THREE.WebGLRenderer( { antialias : true } );
        // this.renderer = new THREE.CanvasRenderer( { clearAlpha: 1 } );
        this.renderer.setSize( this.width, this.height);
        // this.renderer.autoClear = false;
        this.container.appendChild( this.renderer.domElement );


        this.camera = new THREE.PerspectiveCamera( 50, this.width / this.height, 1, 500 );
        // this.camera = new THREE.OrthographicCamera( this.width/-2, this.width /2, this.height /2, this.height/-2, 1, 1000 );
        this.camera.position.z = this.cameraDistance;

        this.cameraAngle=(Math.PI * 2) * .5;

        this.boxWidth = 50;
        this.boxHeight = 20;
        this.boxDepth = 50;

        this.scene = new THREE.Scene();

        this.scene.fog = new THREE.Fog( 0x000000, this.cameraDistance-200, this.cameraDistance+550 );

        /* tracker */
        var tracker = {};
        this.trackerGeometry = new THREE.Geometry();
        var trackerMaterial = new THREE.LineBasicMaterial({
            color: 0xFFFFFF,
            opacity: .3,
            transparent: true
            });

        var trackerBallCanvas = renderToCanvas(10, 10, function(ctx){
            ctx.beginPath();
            ctx.fillStyle = "#aaa";
            ctx.arc(5,5,3,0, 2* Math.PI, true);
            ctx.closePath();
            ctx.fill();

        });
        this.trackerBallTexture = new THREE.Texture(trackerBallCanvas);
        this.trackerBallTexture.needsUpdate = true;

        // this.container.appendChild(this.trackerBallCanvas);

        this.trackerBallMaterial = new THREE.SpriteMaterial({size: 10, 
                                                           map: this.trackerBallTexture, 
                                                           opacity: 0,
                                                           depthTest: false});

        var forwardToBackCount = 0;

        for(var i = 0; i< 7; i++){
            var trackerX = Math.random() * this.boxWidth - this.boxWidth/2;
            var trackerY = Math.floor(.5 + Math.random()) * this.boxHeight;
            var trackerZ = Math.random() * this.boxDepth - this.boxDepth/2;
            var verts = [];
            var count = 0;
            var randSeed = Math.random();
            var randSeed2 = Math.random() + .3;
            var randSeed3 = Math.random();


            if(Math.random() < .5 && forwardToBackCount < 5){
                // x axis

                forwardToBackCount++;
                
                var vert0 =  new THREE.Vector3(trackerX, trackerY, this.boxDepth/2);
                var vert1 = new THREE.Vector3(trackerX, trackerY, -this.boxDepth/2);
                this.trackerGeometry.vertices.push(vert0);
                this.trackerGeometry.vertices.push(vert1);

                var ball = new THREE.Sprite(this.trackerBallMaterial);
                ball.position.set(10,10,10);
                ball.scale.set(1,1);
                this.scene.add(ball);
                this.trackerBalls.push(ball);

                this.trackers.push({
                    update: (function(geo, a, balls, l, w, d, h, rand, rand2, rand3){
                        return function(time){
                            var posTime = Math.max(time, 3000);
                            geo.vertices[a-2].x = Math.max(-w*rand3/2,Math.min(w*rand3/2, w * Math.cos(rand2 * (rand * w + posTime/1000)) / 2));
                            geo.vertices[a-2].z = sCurve(Math.min(1, time/2000)) * d/2;
                            geo.vertices[a-1].x = Math.max(-w*rand3/2,Math.min(w*rand3/2, w * Math.cos(rand2 * (rand * w + posTime/1000)) / 2));
                            geo.vertices[a-1].z = -sCurve(Math.min(1, time/2000)) * d/2;
                            geo.verticesNeedUpdate = true;

                            balls[l-1].position.set(geo.vertices[a-2].x, geo.vertices[a-2].y, geo.vertices[a-2].z);

                        }
                    })(this.trackerGeometry, this.trackerGeometry.vertices.length, this.trackerBalls, this.trackerBalls.length, this.boxWidth, this.boxDepth, this.boxHeight,randSeed, randSeed2, randSeed3)
                });

                if(Math.random() < .3){

                    var vert2 = new THREE.Vector3(trackerX, this.boxHeight, this.boxDepth/2);
                    var vert3 = new THREE.Vector3(trackerX, 0, this.boxDepth/2);
                    this.trackerGeometry.vertices.push(vert2);
                    this.trackerGeometry.vertices.push(vert3);

                    var ball = new THREE.Sprite(this.trackerBallMaterial);
                    ball.position.set(10,10,10);
                    ball.scale.set(1,1);
                    this.scene.add(ball);
                    this.trackerBalls.push(ball);

                    this.trackers.push({
                        update: (function(geo, a, balls, l, w, d, h, rand, rand2, rand3){
                            return function(time){
                                var posTime = Math.max(time, 3000);
                                geo.vertices[a-2].x = Math.max(-w*rand3/2,Math.min(w*rand3/2,w * Math.cos(rand2 * (rand * w + posTime/1000)) / 2));
                                geo.vertices[a-2].y = sCurve(Math.min(1, time/2000)) * h/2 + h/2;
                                geo.vertices[a-1].x = Math.max(-w*rand3/2, Math.min(w*rand3/2,w * Math.cos(rand2 * (rand * w + posTime/1000)) / 2));
                                geo.vertices[a-1].y = h/2 -sCurve(Math.min(1, time/2000)) * h/2;
                                geo.verticesNeedUpdate = true;

                                balls[l-1].position.set(geo.vertices[a-2].x, geo.vertices[a-2].y, geo.vertices[a-2].z);

                            }
                        })(this.trackerGeometry, this.trackerGeometry.vertices.length, this.trackerBalls, this.trackerBalls.length, this.boxWidth, this.boxDepth,this.boxHeight, randSeed, randSeed2, randSeed3)
                    });

                }  else if(Math.random() > .7){
                    var vert2 = new THREE.Vector3(trackerX, this.boxHeight, -this.boxDepth/2);
                    var vert3 = new THREE.Vector3(trackerX, 0, -this.boxDepth/2);
                    this.trackerGeometry.vertices.push(vert2);
                    this.trackerGeometry.vertices.push(vert3);

                    var ball = new THREE.Sprite(this.trackerBallMaterial);
                    ball.position.set(10,10,10);
                    ball.scale.set(1,1);
                    this.scene.add(ball);
                    this.trackerBalls.push(ball);

                    this.trackers.push({
                        update: (function(geo, a, balls, l, w, d, h, rand, rand2, rand3){
                            return function(time){
                            var posTime = Math.max(time, 3000);
                                geo.vertices[a-2].x = Math.max(-w*rand3/2,Math.min(w*rand3/2,w * Math.cos(rand2 * (rand * w + posTime/1000)) / 2));
                                geo.vertices[a-2].y = sCurve(Math.min(1, time/2000)) * h/2 + h/2;
                                geo.vertices[a-1].x = Math.max(-w*rand3/2,Math.min(w*rand3/2,w * Math.cos(rand2 * (rand * w + posTime/1000)) / 2));
                                geo.vertices[a-1].y = h/2-sCurve(Math.min(1, time/2000)) * h/2;
                                geo.verticesNeedUpdate = true;
                                
                                balls[l-1].position.set(geo.vertices[a-2].x, 0, geo.vertices[a-2].z);

                            }
                        })(this.trackerGeometry, this.trackerGeometry.vertices.length, this.trackerBalls, this.trackerBalls.length, this.boxWidth, this.boxDepth, this.boxHeight, randSeed, randSeed2, randSeed3)
                    });
                }

            } else {
                // y axis
                var vert0 = new THREE.Vector3(this.boxWidth/2, trackerY, trackerZ);
                var vert1 = new THREE.Vector3(-this.boxWidth/2, trackerY, trackerZ);

                this.trackerGeometry.vertices.push(vert0);
                this.trackerGeometry.vertices.push(vert1);

                var ball = new THREE.Sprite(this.trackerBallMaterial);
                ball.position.set(10,10,10);
                ball.scale.set(1,1);
                this.scene.add(ball);
                this.trackerBalls.push(ball);

                this.trackers.push({
                    update: (function(geo, a, balls, l, w, d, h, rand, rand2, rand3){
                        return function(time){
                            var posTime = Math.max(time, 3000);
                            geo.vertices[a-2].z = Math.max(-d*rand3/2, Math.min(d*rand3/2, d * Math.cos(rand2 * (rand * d + posTime/1000)) / 2));
                            geo.vertices[a-1].z = Math.max(-d*rand3/2, Math.min(d*rand3/2, d * Math.cos(rand2 * (rand * d + posTime/1000)) / 2));
                            geo.vertices[a-2].x = sCurve(Math.min(1, time/2000)) * w/2;
                            geo.vertices[a-1].x = -sCurve(Math.min(1, time/2000)) * w/2
                            geo.verticesNeedUpdate = true;

                            balls[l-1].position.set(geo.vertices[a-2].x, geo.vertices[a-2].y, geo.vertices[a-2].z);
                        }
                    })(this.trackerGeometry, this.trackerGeometry.vertices.length, this.trackerBalls, this.trackerBalls.length, this.boxWidth, this.boxDepth, this.boxHeight, randSeed, randSeed2, randSeed3)
                });

                if(Math.random() < .3){
                    var vert2 = new THREE.Vector3(this.boxWidth/2, this.boxHeight, trackerZ);
                    var vert3 = new THREE.Vector3(this.boxWidth/2, 0, trackerZ);

                    this.trackerGeometry.vertices.push(vert2);
                    this.trackerGeometry.vertices.push(vert3);

                    var ball = new THREE.Sprite(this.trackerBallMaterial);
                    ball.position.set(10,10,10);
                    ball.scale.set(1,1);
                    this.scene.add(ball);
                    this.trackerBalls.push(ball);

                    this.trackers.push({
                        update: (function(geo, a, balls, l, w, d, h, rand, rand2, rand3){
                            return function(time){
                            var posTime = Math.max(time, 3000);
                                geo.vertices[a-2].z = Math.max(-d*rand3/2, Math.min(d*rand3/2, d * Math.cos(rand2 * (rand * d + posTime/1000)) / 2));
                                geo.vertices[a-1].z = Math.max(-d*rand3/2, Math.min(d*rand3/2, d * Math.cos(rand2 * (rand * d + posTime/1000)) / 2));
                                geo.vertices[a-2].y = h/2 + sCurve(Math.min(1, time/2000)) * h/2;
                                geo.vertices[a-1].y = h/2 - sCurve(Math.min(1, time/2000)) * h/2;
                                geo.verticesNeedUpdate = true;

                                balls[l-1].position.set(geo.vertices[a-2].x, geo.vertices[a-2].y, geo.vertices[a-2].z);
                            }
                        })(this.trackerGeometry, this.trackerGeometry.vertices.length, this.trackerBalls, this.trackerBalls.length, this.boxWidth, this.boxDepth, this.boxHeight, randSeed, randSeed2, randSeed3)
                    });

                }  else if(Math.random() > .7){
                    var vert2 = new THREE.Vector3(-this.boxWidth/2, this.boxHeight, trackerZ);
                    var vert3 = new THREE.Vector3(-this.boxWidth/2, 0, trackerZ);

                    this.trackerGeometry.vertices.push(vert2);
                    this.trackerGeometry.vertices.push(vert3);

                    var ball = new THREE.Sprite(this.trackerBallMaterial);
                    ball.position.set(10,10,10);
                    ball.scale.set(1,1);
                    this.scene.add(ball);
                    this.trackerBalls.push(ball);

                    this.trackers.push({
                        update: (function(geo, a, balls, l, w, d, h, rand, rand2, rand3){
                            return function(time){
                            var posTime = Math.max(time, 3000);
                                geo.vertices[a-2].z = Math.max(-d*rand3/2, Math.min(d*rand3/2, d * Math.cos(rand2 * (rand * d + time/1000)) / 2));
                                geo.vertices[a-1].z = Math.max(-d*rand3/2, Math.min(d*rand3/2, d * Math.cos(rand2 * (rand * d + time/1000)) / 2));
                                geo.vertices[a-2].y = h/2 + sCurve(Math.min(1, time/2000)) * h/2;
                                geo.vertices[a-1].y = h/2 - sCurve(Math.min(1, time/2000)) * h/2;
                                geo.verticesNeedUpdate = true;

                                balls[l-1].position.set(geo.vertices[a-2].x, geo.vertices[a-2].y, geo.vertices[a-2].z);
                            }
                        })(this.trackerGeometry, this.trackerGeometry.vertices.length, this.trackerBalls, this.trackerBalls.length, this.boxWidth, this.boxDepth, this.boxHeight, randSeed, randSeed2, randSeed3)
                    });

                }
            }

        }
        

        this.scene.add(new THREE.Line(this.trackerGeometry, trackerMaterial, THREE.LinePieces));

        /* sides of box */

        var boxTexture = new THREE.Texture(box_createSideCanvas.call(this));
        boxTexture.needsUpdate = true;

        // this.container.appendChild( this.satelliteCanvas);
        this.sideMaterial = new THREE.MeshBasicMaterial({
            map : boxTexture,
            transparent: true,
            opacity: 0
        });

        this.sideMaterial.side = THREE.DoubleSide;

        var face1 = new THREE.PlaneGeometry(this.boxWidth,this.boxHeight/4,1,1);
        var face2 = new THREE.PlaneGeometry(this.boxWidth,this.boxHeight/4,1,1);
        var face3 = new THREE.PlaneGeometry(this.boxDepth,this.boxHeight/4,1,1);
        var face4 = new THREE.PlaneGeometry(this.boxDepth,this.boxHeight/4,1,1);


        var mesh1 = new THREE.Mesh(face1, this.sideMaterial);
        var mesh2 = new THREE.Mesh(face2, this.sideMaterial);
        var mesh3 = new THREE.Mesh(face3, this.sideMaterial);
        var mesh4 = new THREE.Mesh(face4, this.sideMaterial);
    
        mesh1.position = {x: 0, y: 7*this.boxHeight/8, z: this.boxDepth/2};
        mesh2.position = {x: 0, y: 7*this.boxHeight/8, z: -this.boxDepth/2};
        mesh3.position = {x: -this.boxWidth/2, y: 7*this.boxHeight/8, z: 0};
        mesh4.position = {x: this.boxWidth/2, y: 7*this.boxHeight/8, z: 0};
        mesh3.rotateY(Math.PI/2);
        mesh4.rotateY(Math.PI/2);

        this.scene.add(mesh1);
        this.scene.add(mesh2);
        this.scene.add(mesh3);
        this.scene.add(mesh4);

        // create particle system
        this.particleGeometry = new THREE.Geometry();

       this.particleVertexShader = [
           "attribute vec3 color;",
           "attribute float opacity;",
           "varying vec4 vColor;",
            "void main()",
            "{",
               "vColor = vec4( color, opacity );", //     set color associated to vertex; use later in fragment shader.
               "vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
               "gl_PointSize = 1.0;",
                "gl_Position = projectionMatrix * mvPosition;",
            "}"
           ].join("\n");

       this.particleFragmentShader = [
           "varying vec4 vColor;",     
            "void main()", 
            "{",
           "gl_FragColor = vColor;",
            "}"
        ].join("\n");

        this.shaderAttributes = {
            color: { type: 'c', value: []},
            opacity: {type: 'f', value: []}
        };

        this.shaderMaterial = new THREE.ShaderMaterial( {
            uniforms:       {},
            attributes:     this.shaderAttributes,
            vertexShader:   this.particleVertexShader,
            fragmentShader: this.particleFragmentShader,
            transparent:    true
        });


        for(var i = 0; i< this.boxWidth * this.boxDepth; i++){
            var x = i % this.boxWidth - this.boxWidth/2;
            var z = (Math.floor(i / this.boxDepth) -this.boxDepth/2 );
            var vertex = new THREE.Vector3();
            vertex.x = x;
            vertex.y = (this.boxHeight)*Math.sin(x/8)*Math.cos(z/8) * (((this.boxDepth/2)-Math.abs(x))/this.boxWidth/2) * ((this.boxDepth/2-Math.abs(z))/this.boxDepth/2);
            vertex.z = z;
            this.particleGeometry.vertices.push( vertex );
            this.shaderAttributes.color.value[i] = new THREE.Color(0x00eeee);
            this.shaderAttributes.opacity.value[i] = 0.0;
        }

        this.particleColors = [];
        
        for(var i = 0; i< 5; i++){
            this.particleColors.push(new THREE.Color(pusher.color("#00eeee").blend("#ffcc00", i/4).hex6()));
        }

        var particleSystem = new THREE.ParticleSystem( this.particleGeometry, this.shaderMaterial);

        this.scene.add( particleSystem);
        
        this.frameGeometry = new THREE.Geometry();
        var frameMaterial = new THREE.LineBasicMaterial({
            color: 0xFFFFFF,
            opacity: .5,
            transparent: true
            });

        var maxTime = 2000;

        this.frameSegments = [];

        var addFrameAnimation = function(point, start, end, startTime, endTime){
            
            this.frameSegments.push({
                point: point,
                startTime: 1000 + startTime + start[1] * 200,
                endTime: 1000 + endTime + start[1] * 200,
                func: function(t){
                    return {x: start[0] + (end[0]-start[0])*(t/(endTime-startTime)),
                        y: start[1] + (end[1]-start[1])*(t/(endTime-startTime)),
                        z: start[2] + (end[2]-start[2])*(t/(endTime-startTime))
                    };
                }
            });

        }

        for(var i = 0; i < 2; i++){
            this.frameGeometry.vertices.push(new THREE.Vector3(this.boxWidth/2, i*2 - 2, this.boxDepth/2));
            this.frameGeometry.vertices.push(new THREE.Vector3(this.boxWidth/2, i*2 - 2, this.boxDepth/2));

            addFrameAnimation.call(this, this.frameGeometry.vertices[this.frameGeometry.vertices.length-1], [this.boxWidth/2, i*2 - 2, this.boxDepth/2], [this.boxWidth/2, i*2 - 2, -this.boxDepth/2], 0, 1000);

            this.frameGeometry.vertices.push(new THREE.Vector3(this.boxWidth/2, i*2 -2, -this.boxDepth/2));
            this.frameGeometry.vertices.push(new THREE.Vector3(this.boxWidth/2, i*2 - 2, -this.boxDepth/2));

            addFrameAnimation.call(this, this.frameGeometry.vertices[this.frameGeometry.vertices.length-1], [this.boxWidth/2, i*2 - 2, -this.boxDepth/2], [-this.boxWidth/2, i*2 - 2, -this.boxDepth/2], 500, 1500);

            this.frameGeometry.vertices.push(new THREE.Vector3(-this.boxWidth/2, i*2 - 2, -this.boxDepth/2));
            this.frameGeometry.vertices.push(new THREE.Vector3(-this.boxWidth/2, i*2 - 2, -this.boxDepth/2));

            addFrameAnimation.call(this, this.frameGeometry.vertices[this.frameGeometry.vertices.length-1], [-this.boxWidth/2, i*2 - 2, -this.boxDepth/2], [-this.boxWidth/2, i*2 - 2, this.boxDepth/2], 1000, 2000);

            this.frameGeometry.vertices.push(new THREE.Vector3(-this.boxWidth/2, i*2 - 2, this.boxDepth/2));
            this.frameGeometry.vertices.push(new THREE.Vector3(-this.boxWidth/2, i*2 - 2, this.boxDepth/2));

            addFrameAnimation.call(this, this.frameGeometry.vertices[this.frameGeometry.vertices.length-1], [-this.boxWidth/2, i*2 - 2, this.boxDepth/2], [this.boxWidth/2, i*2 - 2, this.boxDepth/2], 1500, 2500);

        }

        this.frameGeometry.vertices.push(new THREE.Vector3(this.boxWidth/2, -2, this.boxDepth/2));
        this.frameGeometry.vertices.push(new THREE.Vector3(this.boxWidth/2, -2, this.boxDepth/2));
        addFrameAnimation.call(this, this.frameGeometry.vertices[this.frameGeometry.vertices.length-1], [this.boxWidth/2, -2, this.boxDepth/2], [this.boxWidth/2, 0, this.boxDepth/2], 0, 500);

        this.frameGeometry.vertices.push(new THREE.Vector3(this.boxWidth/2, -2, -this.boxDepth/2));
        this.frameGeometry.vertices.push(new THREE.Vector3(this.boxWidth/2, -2, -this.boxDepth/2));
        addFrameAnimation.call(this, this.frameGeometry.vertices[this.frameGeometry.vertices.length-1], [this.boxWidth/2, -2, -this.boxDepth/2], [this.boxWidth/2, 0, -this.boxDepth/2], 500, 1000);

        this.frameGeometry.vertices.push(new THREE.Vector3(-this.boxWidth/2, -2, -this.boxDepth/2));
        this.frameGeometry.vertices.push(new THREE.Vector3(-this.boxWidth/2, -2, -this.boxDepth/2));
        addFrameAnimation.call(this, this.frameGeometry.vertices[this.frameGeometry.vertices.length-1], [-this.boxWidth/2, -2, -this.boxDepth/2], [-this.boxWidth/2, 0, -this.boxDepth/2], 1000, 1500);

        this.frameGeometry.vertices.push(new THREE.Vector3(-this.boxWidth/2, -2, this.boxDepth/2));
        this.frameGeometry.vertices.push(new THREE.Vector3(-this.boxWidth/2, -2, this.boxDepth/2));
        addFrameAnimation.call(this, this.frameGeometry.vertices[this.frameGeometry.vertices.length-1], [-this.boxWidth/2, -2, this.boxDepth/2], [-this.boxWidth/2, 0, this.boxDepth/2], 1500, 2000);

        var line = new THREE.Line(this.frameGeometry, frameMaterial, THREE.LinePieces);

        this.scene.add(line);

    };

    Box.prototype.tick = function(){

        var startTime = 2000;
        var maxTime = 5000;

        if(!this.lastRenderDate){
            this.lastRenderDate = new Date();
        }

        if(!this.firstRenderDate){
            this.firstRenderDate = new Date();
        }

        var totalRunTime = new Date() - this.firstRenderDate - startTime;

        if(totalRunTime < 0)
            return;

        var renderTime = new Date() - this.lastRenderDate;
        this.lastRenderDate = new Date();


        /* run intro animations */
        var percentComplete = Math.min(totalRunTime, maxTime - startTime) / (maxTime - startTime);

        if(!this.animationsDone){

            if(totalRunTime > maxTime){
                this.animationsDone = true;
                totalRunTime = maxTime;
            }


            /* do the frame */

            for(var i = 0; i<this.frameSegments.length; i++){
                var fStartTime = this.frameSegments[i].startTime;
                var fEndTime = this.frameSegments[i].endTime;

                if(totalRunTime > fStartTime){
                    var point = this.frameSegments[i].point;
                    var func = this.frameSegments[i].func;

                    var newPoint = func(Math.min(totalRunTime,fEndTime) - fStartTime);

                    if(point.x !== newPoint.x || point.y !== newPoint.y || point.z !== newPoint.z){
                        point.x = newPoint.x;
                        point.y = newPoint.y;
                        point.z = newPoint.z;

                        this.frameGeometry.verticesNeedUpdate = true;
                    }

                }
            } 


            /* do the particles */

            // this.particleMaterial.opacity = Math.pow(percentComplete, 2) / 2;

            /* do the sides */

            this.trackerBallMaterial.opacity = sCurve(percentComplete);

            if(totalRunTime > 1000){
                this.sideMaterial.opacity = Math.pow((Math.min(totalRunTime, maxTime)-1000) / (maxTime-1000), 2);
            }
        }

        /* move the lines */

        for(var i = 0; i< this.trackers.length; i++){
            this.trackers[i].update(totalRunTime);
        }

        /* move the particles inside */

        for(var i = 0; i< this.particleGeometry.vertices.length; i++){
            var x = (i %this.boxWidth) - this.boxWidth/2;
            var z = (Math.floor(i / this.boxDepth) -this.boxDepth/2 );
            var y = Math.sin(Math.PI * 2 * (((totalRunTime / 100) % this.boxHeight)/this.boxHeight)) * this.boxHeight * Math.sin(x/8)*Math.cos(z/8) * (((this.boxWidth/2)-Math.abs(x))/(this.boxWidth/2)) * (((this.boxDepth/2)-Math.abs(z))/(this.boxDepth/2));

            var maxColors = this.particleColors.length - 1;

            this.particleGeometry.vertices[i].x = x;
            this.particleGeometry.vertices[i].y = y
            this.particleGeometry.vertices[i].z = z;

            // fix that 36...
            if(!this.animationsDone){
               this.shaderAttributes.opacity.value[i] = Math.min(1,(36 - Math.sqrt(Math.pow(x,2) + Math.pow(z,2)))/36 * sCurve(percentComplete) + Math.max(y,0)/10);
            }
            this.shaderAttributes.color.value[i] = this.particleColors[Math.min(maxColors,Math.max(0,Math.floor(y)))];
        }
        if(!this.animationsDone){
            this.shaderAttributes.opacity.needsUpdate = true;
        }
        this.shaderAttributes.color.needsUpdate = true;
        this.particleGeometry.verticesNeedUpdate = true;



        var rotateCameraBy = (2 * Math.PI)/(20000/renderTime);

        this.cameraAngle += rotateCameraBy;

        this.camera.position.x = this.cameraDistance * Math.cos(this.cameraAngle);
        this.camera.position.y = this.cameraDistance/2;
        this.camera.position.z = this.cameraDistance * Math.sin(this.cameraAngle);
        this.camera.lookAt( this.scene.position );
        this.renderer.render( this.scene, this.camera );
    };

    /* Satbar */

    var SatBar = function(canvasId){
        this.canvas = document.getElementById(canvasId);
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.context = this.canvas.getContext("2d");

        // this.context.font = "8pt Arial";
        this.context.font = "7pt Inconsolata";
        this.context.textAlign = "center";
        this.context.textBaseline = "middle";

    };

    var satbar_drawBox = function(context,x,y,size, zone, percent){
        if(!percent){
            percent = 1;
        }

        context.strokeStyle="#00EEEE";
        context.fillStyle="#00EEEE";

        context.beginPath();
        context.moveTo(x, y-size*percent/2);
        context.lineTo(x, y+size*percent/2);
        context.stroke();

        context.beginPath();
        context.moveTo(x-size*percent/2, y);
        context.lineTo(x+size*percent/2, y);
        context.stroke();


        if(zone !== undefined && zone>-1){
            context.fillRect(x-size*percent/2 + (zone%2)*size*percent/2, y-size*percent/2 + Math.floor(zone/2)*size*percent/2, size*percent/2,size*percent/2);
        }

        context.beginPath();
        context.arc(x,y,size*percent/4,0,Math.PI*2);
        context.fillStyle="#000";
        context.fill();

        context.fillStyle="#00EEEE";

        context.rect(x-size*percent/2,y-size*percent/2,size*percent,size*percent);
        context.stroke();

        // this.context.rect(5,15,20,20);

    };

    var satbar_drawLines = function(context,x,width, percent){

        context.strokeStyle="#00EEEE";
        context.lineWidth=2;
        context.moveTo(x, 15);
        context.lineTo(x+width * percent, 15);

        context.moveTo(x, 35);
        context.lineTo(x+width * percent, 35);

        context.moveTo(35 + percent*(width-35)/3 + 5, 15);
        context.lineTo(35 + percent*(width-35)/3 + 5, 20);

        context.moveTo(35 + 2*percent*(width-35)/3, 15);
        context.lineTo(35 + 2*percent*(width-35)/3, 20);
        
        context.moveTo(35 + percent*(width-35)/3 + 5, 30);
        context.lineTo(35 + percent*(width-35)/3 + 5, 35);

        context.moveTo(35 + 2*percent*(width-35)/3, 30);
        context.lineTo(35 + 2*percent*(width-35)/3, 35);
        context.stroke();

        if(percent >.8){
            context.fillStyle=shadeColor("#000000",100*(percent*percent));
            context.fillText("satellite", 35 + (width-35)/6, 25);
            context.fillText("data", 35+percent*(width-35)/2, 25);
            context.fillText("uplink", 35+percent*5*(width-35)/6, 25);
        }

    };

    SatBar.prototype.tick = function(){
        if(!this.firstTick){
            this.firstTick = new Date();
        }
        
        var timeSinceStarted = new Date() - this.firstTick;
        var finishTime = 2000;

        if(timeSinceStarted > 2200){

            // we've finished rendereding

            return;
        }

        var percentComplete = Math.min(1,timeSinceStarted/finishTime);

        this.context.clearRect(0,0,this.width, this.height);

        /* draw lines */

        satbar_drawLines(this.context, 35, this.width, percentComplete);

        /* draw insignia
         */

        satbar_drawBox(this.context, 15, 25, 20, 1, Math.min(1,percentComplete*2));

    }

    SatBar.prototype.setZone = function(zone){
        zone = Math.max(-1,zone);
        zone = Math.min(3,zone);

        this.context.clearRect(0,0,35, 35);

        satbar_drawBox(this.context, 15, 25, 20, zone, 1);

    }

    var LocationBar = function(canvasId, loclist){


        this.canvas = document.getElementById(canvasId);
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.locations = {};

        this.locations = loclist;

        this.context = this.canvas.getContext("2d");

        // this.context.font = "8pt Arial";
        this.context.font = "8pt Inconsolata";
        this.context.textAlign = "top";
        this.context.textBaseline = "left";

    };

    var locationbar_drawLocation = function(key, y, percentage){

        this.context.strokeStyle="#00EEEE";
        this.context.lineWidth=1;
        this.context.beginPath();
        this.context.moveTo(0, y+22);
        this.context.lineTo(this.width * percentage, y+22);
        this.context.stroke();
        this.context.closePath()
        
        this.context.strokeStyle="#666";
        this.context.beginPath();
        this.context.moveTo(0, y+30);
        this.context.lineTo(this.width * percentage, y+30);
        this.context.stroke();
        this.context.closePath()

        if(this.locations[key].color == undefined){
            this.locations[key].color = Math.floor(Math.random()*2)
        }

        var labelWidth = this.context.measureText(this.locations[key].label1).width;

        if(this.locations[key].color){
            this.context.fillStyle = "#00EEEE";
        } else {
            this.context.fillStyle = "#FFCC00";
        }

        this.context.fillRect(0, y+2,labelWidth+8,10);

        this.context.fillStyle = "#000";
        this.context.fillText(this.locations[key].label1, 4, y+11);

        this.context.fillStyle = "#FFF";
        this.context.fillText(this.locations[key].label2, 14 + labelWidth, y+11);

        this.context.fillStyle = "#00EEEE";

        for(var i = 0; i<this.locations[key].points.length; i++){

            this.context.beginPath();
            this.context.arc(this.width * percentage * this.locations[key].points[i], y+22,2,0,Math.PI*2);
            this.context.fill();

        }

    };


    LocationBar.prototype.tick = function(){
        if(!this.firstTick){
            this.firstTick = new Date();
        }
        
        var timeSinceStarted = new Date() - this.firstTick;
        var finishTime = 2000;

        // if(timeSinceStarted > 2200){

        //     // we've finished rendereding

        //     return;
        // }

        var percentComplete = Math.min(1,timeSinceStarted/finishTime);

        this.context.clearRect(0,0,this.width, this.height);


        var count = 0;
        for(var i in this.locations){
            if(!this.locations[i].blank){
                locationbar_drawLocation.call(this, i, count*45+10, percentComplete);
            }
            count++;
        }

    }

    
    var SimpleClock = function(canvasId){

        if(this.firstTick == undefined){
            this.firstTick = new Date();
        }

        var canvas = document.getElementById(canvasId);
        this.context = canvas.getContext("2d");

        this.width = canvas.width;
        this.height = canvas.height;

        this.centerx = this.width/2;
        this.centery = this.height/2;

        this.backBuffer = renderToCanvas(this.width, this.height, function(ctx){
            var x = canvas.width / 2;
            var y = canvas.height / 2;

            ctx.beginPath();
            ctx.strokeStyle="#666";
            ctx.arc(x, y, 8, 0, Math.PI*2);
            ctx.stroke();
            ctx.closePath();
            ctx.beginPath();
            ctx.strokeStyle="#333";
            ctx.arc(x, y, 16, 0, Math.PI*2);
            ctx.stroke();
            ctx.beginPath();
            ctx.strokeStyle="#666";
            ctx.arc(x, y, 24, 0, Math.PI*2);
            ctx.stroke();
            ctx.closePath();


            ctx.strokeStyle="#333";
            ctx.beginPath();
            ctx.moveTo(x,y+8)
            ctx.lineTo(x,y+24)
            ctx.moveTo(x,y-8)
            ctx.lineTo(x,y-24)
            ctx.moveTo(x+8,y)
            ctx.lineTo(x+24,y)
            ctx.moveTo(x-8,y)
            ctx.lineTo(x-24,y)
            ctx.stroke();
            ctx.closePath();


        });


    }

    SimpleClock.prototype.tick = function(){
        var timeSinceStarted = new Date() - this.firstTick;

        this.context.clearRect(0,0,this.width, this.height);
        this.context.drawImage(this.backBuffer, 0, 0);

        this.context.strokeStyle="#666";
        this.context.beginPath();
        this.context.moveTo(this.centerx, this.centery);
        this.context.lineTo(this.centerx + 24*Math.sin(timeSinceStarted/10000), this.centery - 24*Math.cos(timeSinceStarted/10000));
        this.context.moveTo(this.centerx, this.centery);
        this.context.lineTo(this.centerx + 24*Math.sin(timeSinceStarted/100000), this.centery - 24*Math.cos(timeSinceStarted/100000));
        this.context.stroke();
        this.context.closePath();


   };

   var timertrees_drawTree = function(x,height){

       this.context.beginPath();
       this.context.lineWidth=1;
       this.context.moveTo(x, this.height-9);
       this.context.lineTo(x, height);
       this.context.stroke();
       this.context.closePath();
       this.context.beginPath();
       this.context.arc(x, height,  2, 0, Math.PI*2);
       this.context.fill();
       this.context.closePath();
   }

   var timertrees_render = function(){

       var i = 0,
           lineLocation = 0,
           prevLocations = [], 
           start = .25 + (12-moment.utc().hour())/24, 
           end = .75 + (12-moment.utc().hour())/24,
           lines = [];

       var locationOk = function(loc, width){
           var j = 0;
           for( ; j< prevLocations.length; j++){
               if(Math.abs(loc-prevLocations[j]) < 5){
                   return false;
               }
           }
           return true;
       }

       if(start < 0){
           lines.push({left: 0, right: end * this.width});
           lines.push({left: (1 + start) * this.width, right: this.width});

       } else if(start > .5) {
           lines.push({left: 0, right: (1-end) * this.width});
           lines.push({left: start * this.width, right: this.width});

       } else {
           lines.push({left: start * this.width, right: end * this.width})
       } 
       this.context.beginPath();
       this.context.lineWidth=1;
       this.context.strokeStyle="#666";
       this.context.moveTo(0, this.height-9);
       this.context.lineTo(this.width-1,this.height-9);
       this.context.stroke();
       this.context.closePath();

       for(var sub = i; sub< lines.length; sub++){
           this.context.beginPath();
           this.context.strokeStyle="#FFCC00";
           this.context.lineWidth=2;
           this.context.moveTo(lines[sub].left, this.height-9);
           this.context.lineTo(lines[sub].right,this.height-9);
           this.context.stroke();
           this.context.closePath();
       }

       this.context.textAlign = "center";
       this.context.fillStyle="#666";
       this.context.font = "5pt Inconsolata";

       this.context.textBaseline = "bottom";
       this.context.fillText("asfdiuojfd", this.width/10, this.height);
       this.context.fillText("807ujkoasd", 3*this.width/10, this.height);
       this.context.fillText("asdfiounfalk", 5*this.width/10, this.height);
       this.context.fillText("kjljk", 7*this.width/10, this.height);
       this.context.fillText("adfoiuh", 9*this.width/10, this.height);


       this.context.lineWidth=1;
       this.context.strokeStyle="#00EEEE";
       this.context.fillStyle="#00EEEE";
       for( ; i< 20; i++){
           lineLocation = Math.random() * this.width-2; 
           while(!locationOk(lineLocation)){
               lineLocation = Math.random() * this.width-2;
           }
           prevLocations.push(lineLocation);

           var endLocation = Math.random() * (this.height - 13) + 2;

           timertrees_drawTree.call(this, lineLocation, endLocation);

       }

   };

   var TimerTrees = function(canvasId){

        if(this.firstTick == undefined){
            this.firstTick = new Date();
        }

        var canvas = document.getElementById(canvasId);
        this.context = canvas.getContext("2d");

        this.width = canvas.width;
        this.height = canvas.height;

        timertrees_render.call(this);

    };

    var stockchart_addGrid = function(ctx, ticks, width, height){

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

    var StockChart = function(containerId, opts){

        var defaults = {
            ticks: 7,
            holdTime: 10000,
            swipeTime: 800,
        }

        extend(opts, defaults);
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

        for(var j = 0; j < 4; j++){
            var data = [];

            for(var i = 0; i< 50; i++){
                data.push(100-((20+i) + Math.random()*30));
            }

            var quarter = "";
            if(j == 0){
                quarter = "1st Quarter";
            } else if(j==1){
                quarter = "2nd Quarter";
            } else if(j==2){
                quarter = "3rd Quarter";
            } else if(j==3){
                quarter = "4th Quarter";
            }

            this.addFrame(quarter, data);

            this.frames[this.frames.length-1].id = "stock-chart-canvas" + j;
            this.frames[this.frames.length-1].div = document.createElement("div");
            this.frames[this.frames.length-1].div.appendChild( this.frames[j] );
            this.container.appendChild(this.frames[this.frames.length-1].div);
        }
    };

    StockChart.prototype.addFrame = function(label, data) {

       // get bounds of the data
       
       var max, min;

       for(var i = 0; i< data.length; i++){
           if(max == undefined || max < data[i]){
               max = data[i];
           }
           if(min == undefined || min > data[i]){
               min = data[i];
           }
       }

       var increment = (max - min) / this.opts.ticks; 
       var heightIncrement  = (this.height) / this.opts.ticks; 

       var frameCanvas = renderToCanvas(this.width, this.height, function(ctx){
           // draw the y ticks

           ctx.fillStyle = "#000";
           ctx.fillRect(0,0,this.width, this.height);
           
           stockchart_addGrid(ctx, this.opts.ticks, this.width, this.height);

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
               ctx.lineTo(30 + i*xIncrement, data[i]);
           }
           ctx.lineTo(this.width, this.height-1);
           ctx.stroke();
           var gradient = ctx.createLinearGradient(0, 0, 0, this.height);
           gradient.addColorStop(0, shadeColor("#00eeee",-60));
           gradient.addColorStop(1, 'rgba(0,238,238,.5)');
           ctx.fillStyle = gradient;
           ctx.fill();
           ctx.closePath();

           ctx.fillStyle = "rgba(255,255,255,.5)";
           for(var i = 0; i < data.length; i++){

               ctx.beginPath();
               ctx.arc(30 + i*xIncrement, data[i], 2, 0, 2*Math.PI);
               ctx.fill();
           }

           // draw the label
           ctx.font = "7pt Inconsolata";
           var textWidth = ctx.measureText(label).width;

           ctx.textAlign = "left";
           ctx.fillStyle="#000";
           ctx.strokeStyle="#00eeee";
           ctx.textBaseline = "top";

           drawCurvedRectangle(ctx, 40, 1, textWidth + 10, 16, 2);
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
            this.frames[this.currentFrame].div.style.width = (this.width * sCurve(this.percentDone)) + "px";
        }
    };

    var StockChartSmall = function(canvasId, opts){

        var defaults = {
            ticks: 5
        }

        var darkerColor = shadeColor("#00eeee",-50);

        extend(opts, defaults);
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

        for(var i = 0; i< 20; i++){
            data.push(Math.random()*this.height);
        }

        var xIncrement = (this.width)/(data.length-1);

        this.context.strokeStyle = "#aaa"
        this.context.beginPath();
        this.context.moveTo(0,0);

        for(var i = 0; i < data.length; i++){
            this.context.lineWidth = "1px";
            this.context.lineTo(i*xIncrement, this.height - data[i]);
        }
        this.context.lineTo(this.width, 0);
        this.context.stroke();
        this.context.fillStyle = "#000";
        this.context.fill();

    }

    /* Swirls */


    var SwirlPoint = function(label, radius, canvas){

        this.hitTime = Date.now();
        this.hit = true;
        this.startTime = Date.now();

        this.startRadians = Math.random() * Math.PI * 2;

        this.radius = radius;
        this.label = label;
        this.canvas = canvas;
        this.context = this.canvas.getContext("2d");

        this.x = this.canvas.width / 2;
        this.y = this.canvas.height / 2;

        this.animate();
    }

    SwirlPoint.prototype.animate = function(){

        var timeSinceStart = Date.now() - this.startTime;

        var radians = this.startRadians + (timeSinceStart/10000) * Math.PI * 2;

        this.x = this.canvas.width / 2 + Math.sin(radians) * this.radius;
        this.y = this.canvas.height / 2 + Math.cos(radians) * this.radius;


    };

    SwirlPoint.prototype.draw = function(currentTime){


        if(Date.now() - this.hitTime < 1000){
            this.context.fillStyle = "#ffcc00";
        } else {
            this.context.fillStyle = "#aaa";
        }

        if(this.hit){
            this.hit = false;
            if(this.x < this.canvas.width / 2){
                this.context.fillText(this.label, this.x + 10, this.y-10);

            } else {
                this.context.fillText(this.label, this.x + 10, this.y+10);

            }
        }

        this.context.beginPath();
        this.context.arc(this.x, this.y, 1, 0, Math.PI * 2);
        this.context.fill();
        this.context.closePath();

    };


    var Swirls = function(containerId, opts){

        this.container = document.getElementById(containerId);
        this.container.width = 290;
        this.container.height = 225
        this.canvas = document.createElement("canvas");
        this.canvas.width = this.container.width;
        this.canvas.height = this.container.height;
        this.context = this.canvas.getContext("2d");
        this.container.appendChild(this.canvas);

        this.width = this.container.width;
        this.height = this.container.height;

        this.points = {};

        this.background = renderToCanvas(this.width, this.height, function(ctx){
            ctx.fillStyle = "#111";
            ctx.fillRect(5,5, this.width -10, this.height-10);
            ctx.strokeStyle = "#666"

            ctx.beginPath();
            ctx.moveTo(this.width/2 + .5,5);
            ctx.lineTo(this.width/2 + .5,this.height - 5);
            ctx.stroke();
            ctx.closePath();

            ctx.beginPath();
            ctx.moveTo(5,this.height/2);
            ctx.lineTo(this.width-5,this.height/2);
            ctx.stroke();
            ctx.closePath();

            ctx.beginPath();
            ctx.lineWidth = 4;
            ctx.moveTo(0,20);
            ctx.lineTo(0,0);
            ctx.lineTo(20, 0);
            ctx.stroke();
            ctx.closePath();

            ctx.beginPath();
            ctx.lineWidth = 4;
            ctx.moveTo(this.width,20);
            ctx.lineTo(this.width,0);
            ctx.lineTo(this.width -20, 0);
            ctx.stroke();
            ctx.closePath();

            ctx.beginPath();
            ctx.lineWidth = 4;
            ctx.moveTo(this.width,this.height-20);
            ctx.lineTo(this.width,this.height);
            ctx.lineTo(this.width -20, this.height);
            ctx.stroke();
            ctx.closePath();

            ctx.beginPath();
            ctx.lineWidth = 4;
            ctx.moveTo(this.width,this.height-20);
            ctx.lineTo(this.width,this.height);
            ctx.lineTo(this.width -20, this.height);
            ctx.stroke();
            ctx.closePath();

            ctx.beginPath();
            ctx.lineWidth = 4;
            ctx.moveTo(0,this.height-20);
            ctx.lineTo(0,this.height);
            ctx.lineTo(20, this.height);
            ctx.stroke();
            ctx.closePath();

            ctx.fillStyle = "#666";
            ctx.fillRect(this.width/2-1.5, 2, 4, 6);
            ctx.fillRect(this.width/2-1.5, this.height-8, 4, 6);
            ctx.fillRect(2, this.height/2-2, 6, 4);
            ctx.fillRect(this.width-8, this.height/2-2, 6, 4);

        }.bind(this));

        this.context.drawImage(this.background, 0, 0);
        this.context.fillStyle = "#fff";
    };

    Swirls.prototype.tick = function(){

        this.context.globalAlpha = .02;
        this.context.drawImage(this.background, 0, 0);
        this.context.globalAlpha = 1.0;

        /*
        this.context.beginPath();
        this.context.arc(Math.random() * this.width, Math.random() * this.height, 2, 0, Math.PI * 2);
        this.context.fill();
        this.context.closePath();
        */

        for(var p in this.points){
            this.points[p].animate();
            this.points[p].draw();
        }
    };

    Swirls.prototype.hit = function(label){

        if(this.points[label]){
            this.points[label].hitTime = Date.now();
            this.points[label].hit = true;
            return;
        }

        this.points[label] = new SwirlPoint(label, Math.random() * 100, this.canvas);
    };

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

       this.context.font = "bold 18px Inconsolata";
       var textWidth = this.context.measureText(text).width;

       drawCurvedRectangle(this.context, (this.width - textWidth -24)/2, 30, textWidth + 24, 60, 3);
       drawCurvedRectangle(this.context, (this.width - textWidth -10)/2, 65, textWidth + 10, 20, 3);

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

    return {
        globe: globe,
        SatBar: SatBar,
        LocationBar: LocationBar,
        SimpleClock: SimpleClock,
        TimerTrees: TimerTrees,
        StockChart: StockChart,
        StockChartSmall: StockChartSmall,
        Box: Box,
        Swirls: Swirls,
        Logo: Logo

    };

})();
