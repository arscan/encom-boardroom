
;ENCOM = (function(){

    /* encom fucntions */

    var extend = function(first, second) {
        for(var i in first){
            second[i] = first[i];
        }
    };

    var waitForAll = function(waits, cb){
        this.waitfor_count = waits.length;

        var finished = function(){
            this.waitfor_count--;
            if(!this.waitfor_count){
                cb();
            }
        }

        for(var i = 0; i< waits.length; i++){
            waits[i](finished);
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
            repeatAtTile=0;
        }

        if(endAtTile == undefined){
            endAtTile=numTiles;
        }

        this.shutDown = false;
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

    var globe_createLabel = function(text, x, y, z, size, color, backGroundColor, backgroundMargin) {
        if(!backgroundMargin)
            backgroundMargin = 50;

        var canvas = document.createElement("canvas");

        var context = canvas.getContext("2d");
        context.font = size + "pt Arial";

        var textWidth = context.measureText(text).width;

        canvas.width = textWidth;
        canvas.height = size;
        context = canvas.getContext("2d");
        context.font = size + "pt Arial";

        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = color;
        context.fillText(text, canvas.width / 2, canvas.height / 2);

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
        var context = canvas.getContext("2d");

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
                    // ctx.strokeStyle=shadeColor("#000000",100*(1-frameOn*distPerFrame/(pixels-25)));
                    ctx.lineWidth=4;
                    ctx.beginPath();
                    ctx.arc(centerx, centery, frameOn * distPerFrame, -Math.PI/12, Math.PI/12);
                    ctx.stroke();
                }
            }

            /*
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

           */


            offsetx += pixels;
        }

        return canvas;
    };

    var globe_mainParticles = function(){

        var material, geometry;

        var colors = [];

        var sprite = THREE.ImageUtils.loadTexture( "hex.png" );
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

            for(var a = 0; a < 7; a++){
                globe_addPointAnimation.call(this,delay + 500 + (300/10.0)*a, i, {
                    x : point.x*(this.swirlMultiplier - (.1 + a/70.0)),
                    y : point.y*(this.swirlMultiplier - (.1 + a/70.0)),
                    z : point.z*(this.swirlMultiplier - (.1 + a/70.0))});
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
        var geometrySpline,
            materialSpline = new THREE.LineBasicMaterial({
            color: 0x8FD8D8,
            transparent: true,
            linewidth: 2,
            opacity: 1
        });
        var sPoint;
        var _this = this;

        new TWEEN.Tween( {opacity: 1})
            .to( {opacity: 0}, 500 )
            .delay(this.swirlTime-500)
            .onUpdate(function(){
                materialSpline.opacity = this.opacity;

            })
            .start();

        setTimeout(function(){
            _this.scene.remove(_this.swirl);
        }, this.swirlTime);


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

            this.swirl.add(new THREE.Line(geometrySpline, materialSpline));
            
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
                _this.scene.remove(marker.label);
                _this.scene.remove(marker.top);
            })
            .start();

        /* old way
        this.scene.remove(marker.line);
        this.scene.remove(marker.label);

        new TWEEN.Tween({posx: pos.x, posy: pos.y, posz: pos.z, opacity: 1})
            .to( {posx: pos.x/1.2, posy: pos.y/1.2, posz: pos.z/1.2, opacity: 0}, 1000 )
            .easing( TWEEN.Easing.Bounce.Out)
            .onUpdate(function(){

                //marker.line.geometry.vertices[1].set(this.posx, this.posy, this.posz);
                //marker.line.geometry.verticesNeedUpdate = true;
                //marker.label.material.opacity = this.opacity;
                marker.top.position.set(this.posx, this.posy, this.posz);
            })
            .onComplete(function(){
            })
            .start();

       */
    };

    var globe_removeMarkerLabel = function(marker){

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
            cameraDistance: 2000,
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
            self = this;
            
        document.body.appendChild(projectionCanvas);
        projectionContext = projectionCanvas.getContext('2d');

        this.markerTopTexture = new THREE.ImageUtils.loadTexture( 'markertop.png' );

        img.addEventListener('load', function(){
            //image has loaded, may rsume
            projectionCanvas.width = img.width;
            projectionCanvas.height = img.height;
            projectionContext.drawImage(img, 0, 0, img.width, img.height);
            for (var i = 0; i< self.samples.length; i++){
                
                globe_samplePoints(projectionContext,img.width, img.height, self.samples[i].offsetLat, self.samples[i].offsetLon, self.samples[i].incLat, self.samples[i].incLon, function(point){
                    self.points.push(point);
                });
            }
            document.body.removeChild(projectionCanvas);

            // create the webgl context, renderer and camera
            if(self.containerId){
                self.container = document.getElementById(self.containerId);
                self.width = self.container.width;
                self.height = self.container.height;
            } else {
                self.container = document.createElement( 'div' );
                self.container.width = self.width;
                self.container.height = self.height;
            }

            document.body.appendChild( self.container );

            self.renderer = new THREE.WebGLRenderer( { clearAlpha: 1 } );
            self.renderer.setSize( self.width, self.height);
            self.container.appendChild( self.renderer.domElement );

            // create the camera

            self.camera = new THREE.PerspectiveCamera( 50, self.width / self.height, 1, 3000 );
            self.camera.position.z = this.cameraDistance;
            self.cameraAngle=(Math.PI * 2) * .5;

            // create the scene

            self.scene = new THREE.Scene();
            self.scene.fog = new THREE.Fog( 0x000000, self.cameraDistance-200, self.cameraDistance+550 );

            // create the stats thing
            
            if(Stats){
                self.stats = new Stats();
                self.stats.domElement.style.position = 'absolute';
                self.stats.domElement.style.top = '0px';
                self.container.appendChild( self.stats.domElement );
            }

            // add the globe particles
            
            globe_mainParticles.call(self);

            // add the swirls
            globe_swirls.call(self);

            if(cb){
                cb();
            }
        });


        img.src = this.mapUrl;
    }

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
        this.scene.add(textSprite);


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

        if(this.markerCoords[labelKey]){
            this.markerCoords[labelKey].material.opacity = 0;
        }

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
                _this.scene.add(markerTop);

            })
            .start();
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

        console.log(Math.floor(waveEnd-(waveEnd-waveStart)/numWaves));

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

        if(this.stats){
            this.stats.update();
        }

        if(!this.lastRenderDate){
            this.lastRenderDate = new Date();
        }



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

            // console.log(1-Math.abs(this.satelliteMeshes[i].lat/90.0))
            // console.log(this.satelliteMeshes[i].theta);
            // console.log(this.cameraAngle);
            // console.log(Math.sin(this.cameraAngle));
            //     this.satelliteMeshes[i].rotateZ(.66*Math.PI+1*(-3* Math.PI/2 - Math.cos(1*this.cameraAngle)));
            // if(this.satelliteMeshes[i].lat > 0){
            //     this.satelliteMeshes[i].rotateZ(.66*Math.PI+1*(-3* Math.PI/2 - Math.cos(1*this.cameraAngle)));
            // } else {
            //     this.satelliteMeshes[i].rotateZ(-3* Math.PI/2 - Math.cos(1*this.cameraAngle));
            // }
            
        }


        this.camera.lookAt( this.scene.position );

        this.swirl.rotateY((2 * Math.PI)/(this.swirlTime/renderTime));
        this.renderer.render( this.scene, this.camera );
        globe_updateSatellites.call(this, renderTime);

    }


    return {
        globe: globe,
        waitForAll: waitForAll
    };

})();
