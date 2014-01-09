
;ENCOM = (function(){

    /* encom fucntions */

    var extend = function(first, second) {
        for(var i in first){
            second[i] = first[i];
        }
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


    // based on from http://stemkoski.github.io/Three.js/Texture-Animation.html
    var TextureAnimator = function(texture, tilesHoriz, tilesVert, numTiles, tileDispDuration, repeatAtTile, endAtTile) 
    {   
        var _this = this;
        // note: texture passed by reference, will be updated by the update function.
        
        if(repeatAtTile == undefined){
            repeatAtTile=-1;
        }

        if(endAtTile == undefined){
            endAtTile=numTiles;
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
                        if (this.currentTile == endAtTile && !this.shutDownFlag)
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

    var globe_isPixelBlack = function(context, x, y){
        return context.getImageData(x,y,1,1).data[0] === 0;
    };

    var globe_samplePoints = function(projectionContext, width, height, latoffset, lonoffset, latinc, loninc, cb){
        var points = [];
        for(var lat = 90-latoffset; lat > -90; lat -= latinc){
            for(var lon = -180+lonoffset; lon < 180; lon += loninc){
                var point = globe_latLonToXY(width, height, lat, lon);
                if(globe_isPixelBlack(projectionContext,point.x, point.y)){
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
        // context.font = size + "pt Arial";
        context.font = size + "pt Inconsolata";

        var textWidth = context.measureText(text).width;

        canvas.width = textWidth;
        canvas.height = size;
        if(underlineColor){
            canvas.height += 30;
        }
        context = canvas.getContext("2d");
        // context.font = size + "pt Arial";
        context.font = size + "pt Inconsolata";

        context.textAlign = "center";
        context.textBaseline = "middle";
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

        // context.strokeStyle = "black";
        // context.strokeRect(0, 0, canvas.width, canvas.height);

        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;

        var material = new THREE.SpriteMaterial({
            map : texture,
            useScreenCoordinates: false,
            opacity:0
            
            });
        var sprite = new THREE.Sprite(material);
        sprite.position = {x: x*1.1, y: y + (y < 0 ? -20 : 20), z: z*1.1};
        sprite.scale.set(canvas.width, canvas.height);
            new TWEEN.Tween( {opacity: 0})
                .to( {opacity: 1}, 500 )
                .onUpdate(function(){
                    material.opacity = this.opacity
                }).delay(1000)
                .start();

        return sprite;

    }

    var globe_createSatelliteCanvas = function(numFrames, pixels, rows, waveStart, waveEnd, satEnd, numWaves) {

        var canvas = document.createElement("canvas");

        var cols = numFrames / rows;

        var waveInterval = Math.floor((waveEnd-waveStart)/numWaves);

        var waveDist = pixels - 25; // width - center of satellite
        var distPerFrame = waveDist / (waveEnd-waveStart)

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
           
            ctx.lineWidth=4;
            ctx.strokeStyle="#FFFFFF";
            var buffer=Math.PI/16;
            var start = -Math.PI + Math.PI/4;
            var radius = 16;
            var repeatAt = Math.floor(waveEnd-2*(waveEnd-waveStart)/numWaves)+1;

            /* fade in and out */
            if(i<waveStart){
                radius = 16*i/waveStart;
            } else if (i>=satEnd){
                radius = 16*(1-(i-satEnd)/(numFrames-satEnd));
            }

            var swirlDone = Math.floor((repeatAt-waveStart) / 2) + waveStart;

            for(var n = 0; n < 4; n++){
                ctx.beginPath();

                if(i < waveStart || i>=waveEnd){

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

                } else if(i >= repeatAt && i < (waveEnd-repeatAt)/2 + repeatAt){

                    var totalTimeToComplete = (waveEnd-repeatAt)/2;
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

            /* red circle in middle */

            ctx.strokeStyle="#FF0000";
            ctx.lineWidth=4;
            ctx.beginPath();
            if(i<waveStart){
                ctx.arc(centerx,centery,7*i/waveStart,0,2*Math.PI);
            } else if (i>=waveEnd){
                ctx.arc(centerx,centery,7*(1-(i-waveEnd)/(numFrames-waveEnd)),0,2*Math.PI);
            } else {
                ctx.arc(centerx,centery,7,0,2*Math.PI);
            }
            ctx.stroke();


            // frame i'm on * distance per frame

            /* waves going out */
            var frameOn;

            for(var wi = 0; wi<numWaves; wi++){
                frameOn = i-(waveInterval*wi)-waveStart;
                if(frameOn > 0 && frameOn * distPerFrame < pixels - 25){
                    ctx.strokeStyle="rgba(255,255,255," + (.9-frameOn*distPerFrame/(pixels-25)) + ")";
                    ctx.lineWidth=4;
                    ctx.beginPath();
                    ctx.arc(centerx, centery, frameOn * distPerFrame, -Math.PI/12, Math.PI/12);
                    ctx.stroke();
                }
            }

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
        var myColors1 = pusher.color('orange').hueSet();
        var myColors = [];
        for(var i = 0; i< myColors1.length; i++){
            myColors.push(myColors1[i]);

            myColors.push(myColors1[i].shade(.2 + Math.random()/2.0));
            myColors.push(myColors1[i].shade(.2 + Math.random()/2.0));
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

        material = new THREE.ParticleSystemMaterial( { size: 10, map: sprite, vertexColors: true, transparent: true } );

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

        // new TWEEN.Tween( {opacity: 1})
        //     .to( {opacity: 0}, 500 )
        //     .delay(this.swirlTime-500)
        //     .onUpdate(function(){
        //         materialSpline.opacity = this.opacity;

        //     })
        //     .start();


        // setTimeout(function(){
        //     _this.scene.remove(_this.swirl);
        // }, this.swirlTime);

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
                _this.scene_sprite.remove(marker.label);
                _this.scene_sprite.remove(marker.top);
            })
            .start();

    };

    var globe_updateSatellites = function(renderTime){
        for(var i = 0; i< this.satelliteAnimations.length; i++){
            this.satelliteAnimations[i].update(renderTime);
        }
    };

    /* globe constructor */

    function globe(opts){

        if(!opts){
            opts = {};
        }

        var defaults = {
            mapUrl: "equirectangle_projection.png",
            size: 100,
            width: document.width,
            height: document.height,
            swirlMultiplier: 1.20,
            swirlTime: 3500,
            cameraDistance: 1700,
            samples: [
                { 
                    offsetLat: 0,
                    offsetLon: 0,
                    incLat: 2,
                    incLon: 4
                },
                { 
                    offsetLat: 1,
                    offsetLon: 2,
                    incLat: 2,
                    incLon: 4
                }
                ],
            points: [],
            globe_pointAnimations: [],
            swirl: new THREE.Object3D(),
            markers: [],
            markerCoords: {},
            maxMarkers: 20,
            maxLines:1000,

            satelliteAnimations: [],
            satelliteMeshes: []

        };

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

                    _this.renderer = new THREE.WebGLRenderer( { clearAlpha: 1 } );
                    // _this.renderer = new THREE.CanvasRenderer( { clearAlpha: 1 } );
                    _this.renderer.setSize( _this.width, _this.height);
                    _this.renderer.autoClear = false;
                    _this.container.appendChild( _this.renderer.domElement );

                    // create the camera

                    _this.camera = new THREE.PerspectiveCamera( 50, _this.width / _this.height, 1, 3000 );
                    _this.camera.position.z = this.cameraDistance;
                    _this.cameraAngle=(Math.PI * 2) * .5;

                    // create the scene

                    _this.scene = new THREE.Scene();
                    _this.scene_sprite = new THREE.Scene();

                    _this.scene.fog = new THREE.Fog( 0x000000, _this.cameraDistance-200, _this.cameraDistance+550 );

                    // add the globe particles
                    
                    globe_mainParticles.call(_this);

                    // add the swirls
                    globe_swirls.call(_this);

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

        var point = globe_mapPoint(lat,lng);
        var markerGeometry = new THREE.Geometry();
        var markerMaterial = new THREE.LineBasicMaterial({
            color: 0x8FD8D8,
            });
        var _this = this;

        markerGeometry.vertices.push(new THREE.Vector3(point.x, point.y, point.z));
        markerGeometry.vertices.push(new THREE.Vector3(point.x, point.y, point.z));

        var line = new THREE.Line(markerGeometry, markerMaterial);

        var textSprite = globe_createLabel(text, point.x*1.2, point.y*1.2, point.z*1.2, 20, "white");
        // textMesh.rotateY(Math.PI/2 - cameraAngle);

        this.scene.add(line);
        this.scene_sprite.add(textSprite);


        var markerMaterial = new THREE.SpriteMaterial({map: _this.markerTopTexture, color: 0xFD7D8});
        var markerTop = new THREE.Sprite(markerMaterial);
        markerTop.scale.set(15, 15);
        markerTop.position.set(point.x*1.2, point.y*1.2, point.z*1.2);

        this.markers.push({
            line: line,
            label: textSprite,
            top: markerTop
        });

        var labelKey = Math.floor(lat/10) + '-' + Math.floor(lng/10);
        if(Math.abs(lat)>80){
            labelKey = Math.floor(lat/10);
        }

        // if(this.markerCoords[labelKey]){
        //     this.markerCoords[labelKey].material.opacity = 0;
        // }

        this.markerCoords[labelKey] = textSprite;

        if(this.markers.length > this.maxMarkers){
            globe_removeMarker.call(this, this.markers.shift());
        }

        new TWEEN.Tween(point)
            .to( {x: point.x*1.2, y: point.y*1.2, z: point.z*1.2}, 1500 )
            .easing( TWEEN.Easing.Elastic.InOut )
            .onUpdate(function(){
                markerGeometry.vertices[1].x = this.x;
                markerGeometry.vertices[1].y = this.y;
                markerGeometry.vertices[1].z = this.z;
                markerGeometry.verticesNeedUpdate = true;
            })
            .onComplete(function(){
                _this.scene_sprite.add(markerTop);

            })
            .start();
    }

    globe.prototype.addConnectedPoints = function(lat1, lng1, text1, lat2, lng2, text2){

        var _this = this;

        var point1 = globe_mapPoint(lat1,lng1);
        var point2 = globe_mapPoint(lat2,lng2);

        var markerMaterial = new THREE.SpriteMaterial({map: _this.specialMarkerTexture, opacity: .7});
        // var markerMaterial = new THREE.SpriteMaterial({map: _this.markerTopTexture});

        var marker1 = new THREE.Sprite(markerMaterial);
        var marker2 = new THREE.Sprite(markerMaterial);

        marker1.scale.set(0, 0);
        marker2.scale.set(0, 0);

        marker1.position.set(point1.x*1.2, point1.y*1.2, point1.z*1.2);
        marker2.position.set(point2.x*1.2, point2.y*1.2, point2.z*1.2);


        this.scene_sprite.add(marker1);
        this.scene_sprite.add(marker2);

        var textSprite1 = globe_createLabel(text1.toUpperCase(), point1.x*1.25, point1.y*1.25, point1.z*1.25, 25, "white", "#FFCC00");
        var textSprite2 = globe_createLabel(text2.toUpperCase(), point2.x*1.25, point2.y*1.25, point2.z*1.25, 25, "white", "#FFCC00");

        this.scene_sprite.add(textSprite1);
        this.scene_sprite.add(textSprite2);

        new TWEEN.Tween({x: 0, y: 0})
            .to({x: 55, y: 55}, 2000)
            .easing( TWEEN.Easing.Elastic.InOut )
            .onUpdate(function(){
                marker1.scale.set(this.x, this.y);
            })
            .start();

        new TWEEN.Tween({x: 0, y: 0})
            .to({x: 55, y: 55}, 2000)
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
            linewidth: 4,
            opacity: .5
        });

        var latdist = (lat2 - lat1)/39;
        var londist = (lng2 - lng1)/39;
        var startPoint = globe_mapPoint(lat1, lng1);
        var pointList = [];

        for(var j = 0; j< 40; j++){
            // var nextlat = ((90 + lat1 + j*1)%180)-90;
            // var nextlon = ((180 + lng1 + j*1)%360)-180;

            
            var nextlat = (((90 + lat1 + j*latdist)%180)-90) * (.5 + Math.cos(j*(5*Math.PI/2)/39)/2) + (j*lat2/39/2);
            var nextlon = ((180 + lng1 + j*londist)%360)-180;
            pointList.push({lat: nextlat, lon: nextlon, index: j});
            // var thisPoint = globe_mapPoint(nextlat, nextlon);
            sPoint = new THREE.Vector3(startPoint.x*1.2, startPoint.y*1.2, startPoint.z*1.2);
            // sPoint = new THREE.Vector3(thisPoint.x*1.2, thisPoint.y*1.2, thisPoint.z*1.2);

            sPoint.globe_index = j;

            geometrySpline.vertices.push(sPoint);  
        }

        var currentLat = lat1;
        var currentLon = lng1;
        var currentPoint;
        var currentVert;

        var update = function(){
            var nextSpot = pointList.shift();
            
            for(var x = 0; x< geometrySpline.vertices.length; x++){
                
                currentVert = geometrySpline.vertices[x];
                currentPoint = globe_mapPoint(nextSpot.lat, nextSpot.lon);

                if(x >= nextSpot.index){
                    currentVert.set(currentPoint.x*1.2, currentPoint.y*1.2, currentPoint.z*1.2);
                }
                geometrySpline.verticesNeedUpdate = true;
            }
            if(pointList.length > 0){
                setTimeout(update,30);
            }

        };
        setTimeout(function(){
            update();
        }, 2000);


        this.scene.add(new THREE.Line(geometrySpline, materialSpline));
            
    }


    globe.prototype.addSatellite = function(lat, lon, dist){

        var point = globe_mapPoint(lat,lon);
        point.x *= dist;
        point.y *= dist;
        point.z *= dist;

        var numFrames = 100;
        var pixels = 200;
        var rows = 10;
        var waveStart = Math.floor(numFrames/8);
        var waveEnd = Math.floor(numFrames/2);
        var satEnd = Math.floor(7*numFrames/8);
        var numWaves = 6;
        var repeatAt = Math.floor(waveEnd-2*(waveEnd-waveStart)/numWaves)+1;

        if(!this.satelliteCanvas){
            this.satelliteCanvas = globe_createSatelliteCanvas.call(this, numFrames, pixels, rows, waveStart, waveEnd, satEnd, numWaves);
        }
        var satelliteTexture = new THREE.Texture(this.satelliteCanvas);
        satelliteTexture.needsUpdate = true;

        // this.container.appendChild( this.satelliteCanvas);

        var animator = new TextureAnimator(satelliteTexture,rows, numFrames/rows, numFrames, 80, repeatAt, waveEnd);

        this.satelliteAnimations.push(animator);

        var material = new THREE.MeshBasicMaterial({
            map : satelliteTexture,
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
        return {mesh: mesh, shutDownFunc: animator.shutDown};

    };

    globe.prototype.removeSatellite = function(sat){
        var _this = this;

        sat.shutDownFunc(function(){
            var pos = -1;
            for(var i = 0; i < _this.satelliteMeshes.length; i++){
                if(sat.mesh == _this.satelliteMeshes[i]){
                    pos = i;
                }
            }

            if(pos >= 0){
                _this.scene.remove(sat.mesh);
                _this.satelliteMeshes.splice(pos,1);
            }
        });

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

        var totalRunTime = new Date() - this.firstRenderDate;

        var renderTime = new Date() - this.lastRenderDate;
        this.lastRenderDate = new Date();
        var rotateCameraBy = (2 * Math.PI)/(20000/renderTime);

        this.cameraAngle += rotateCameraBy;

        this.camera.position.x = this.cameraDistance * Math.cos(this.cameraAngle);
        this.camera.position.y = 200*Math.sin(this.cameraAngle);
        this.camera.position.z = this.cameraDistance * Math.sin(this.cameraAngle);


        for(var i = 0; i< this.satelliteMeshes.length; i++){
            var mesh = this.satelliteMeshes[i];
            // this.satelliteMeshes[i].rotation.y-=rotateCameraBy;
            mesh.lookAt(this.camera.position);
            mesh.rotateZ(mesh.tiltDirection * Math.PI/2);
            mesh.rotateZ(Math.sin(this.cameraAngle + (mesh.lon / 180) * Math.PI) * mesh.tiltMultiplier * mesh.tiltDirection * -1);

            
        }

        if(this.swirlTime > totalRunTime){
            if(totalRunTime/this.swirlTime < .1){
                this.swirlMaterial.opacity = (totalRunTime/this.swirlTime)*10 - .2;
            } else if(totalRunTime/this.swirlTime < .9){
                this.swirlMaterial.opacity = .8;
            }if(totalRunTime/this.swirlTime > .9){
                this.swirlMaterial.opacity = Math.max(1-totalRunTime/this.swirlTime,0);
            }
            this.swirl.rotateY((2 * Math.PI)/(this.swirlTime/renderTime));
        } else if(this.swirl){
            this.scene.remove(this.swirl);
            delete[this.swirl];

        }


        this.camera.lookAt( this.scene.position );
        this.renderer.render( this.scene_sprite, this.camera );
        this.renderer.render( this.scene, this.camera );
        globe_updateSatellites.call(this, renderTime);

    }

    /* Satbar */

    var SatBar = function(canvasId){
        this.canvas = document.getElementById(canvasId);
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.context = this.canvas.getContext("2d");

        // this.context.font = "8pt Arial";
        this.context.font = "8pt Inconsolata";
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

        context.moveTo(35 + percent*(width-35)/3, 15);
        context.lineTo(35 + percent*(width-35)/3, 20);

        context.moveTo(35 + 2*percent*(width-35)/3, 15);
        context.lineTo(35 + 2*percent*(width-35)/3, 20);
        
        context.moveTo(35 + percent*(width-35)/3, 30);
        context.lineTo(35 + percent*(width-35)/3, 35);

        context.moveTo(35 + 2*percent*(width-35)/3, 30);
        context.lineTo(35 + 2*percent*(width-35)/3, 35);
        context.stroke();

        if(percent >.6){
            context.fillStyle=shadeColor("#000000",100*percent);
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

    return {
        globe: globe,
        SatBar: SatBar,
        LocationBar: LocationBar
    };

})();
