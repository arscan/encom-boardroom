
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

        if(this.globe_pointAnimations.length == 0){
            return;
        }

        while(this.globe_pointAnimations.length > 0 && (next = this.globe_pointAnimations.pop()).when < Date.now()){
            this.globe_particles.geometry.vertices[next.verticleIndex].x = next.position.x;
            this.globe_particles.geometry.vertices[next.verticleIndex].y = next.position.y;
            this.globe_particles.geometry.vertices[next.verticleIndex].z = next.position.z;

            this.globe_particles.geometry.verticesNeedUpdate = true;
        }
        if(next.when >= Date.now()){
            this.globe_pointAnimations.push(next);

        }

    };

    var globe_mainParticles = function(){

        var material, geometry;

        var colors = [];

        var sprite = THREE.ImageUtils.loadTexture( "hex2.png" );
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
            var delay = 3000*((180+this.points[i].lon)/360.0); 

            vertex.x = 0;
            vertex.y = 0;
            vertex.z = this.cameraDistance+1;

            geometry.vertices.push( vertex );

            globe_addPointAnimation.call(this,Date.now() + delay, i, {
                x : point.x*1.05,
                y : point.y*1.05,
                z : point.z*1.05});

            globe_addPointAnimation.call(this,Date.now() + delay + 400, i, {
                x : point.x,
                y : point.y,
                z : point.z});

            colors[i] = new THREE.Color( myColors[Math.floor(Math.random() * myColors.length)].hex6());


        }

        geometry.colors = colors;

        material = new THREE.ParticleSystemMaterial( { size: 8 + Math.random()*10, map: sprite, vertexColors: true, transparent: true } );

        this.globe_particles = new THREE.ParticleSystem( geometry, material );
        this.globe_particles.sortParticles = true;
        this.globe_particles.geometry.dynamic=true;


        this.scene.add( this.globe_particles );

    };


    var globe_swirls = function(){
        var materialSpline = new THREE.LineBasicMaterial({
            color: 0x8FD8D8,
            //transparent: true,
            opacity: 1
        });
        var geometrySpline;

        /*
        new TWEEN.Tween( {opacity: 0})
            .to( {opacity: 1}, 500 )
            .onUpdate(function(){
                materialSpline.opacity = this.opacity;
            })
            .start();

        new TWEEN.Tween( {opacity: 1})
            .to( {opacity: 0}, 500 )
            .delay(2000)
            .onUpdate(function(){
                materialSpline.opacity = this.opacity;

            })
            .start();
           */

        // setTimeout(function(){
        //     for(var i = 0; i < lineCurves.length; i++){
        //         scene.remove(lineCurves[i]);
        //     }
        // }, 4200);


        for(var i = 0; i< 100; i++){
            geometrySpline = new THREE.Geometry();

            var lat = Math.random()*180 + 90;
            var lon =  Math.random()*5-25;
            var lenBase = 4 + Math.floor(Math.random()*5);
            var sPoints = [];

            if(Math.random()<.3){
                lon = Math.random()*30 - 80;
                lenBase = 3 + Math.floor(Math.random()*3);
            }

            for(var j = 0; j< lenBase; j++){
                var thisPoint = globe_mapPoint(lat, lon - j * 5);
                sPoints.push(new THREE.Vector3(thisPoint.x*1.05, thisPoint.y*1.05, thisPoint.z*1.05));
                console.log(thisPoint);
            }

            var spline = new THREE.SplineCurve3(sPoints);

            var splinePoints = spline.getPoints(10);

            for(var k = 0; k < splinePoints.length; k++){
                geometrySpline.vertices.push(splinePoints[k]);  
            }

            this.swirl.add(THREE.Line(geometrySpline, materialSpline));
            
        }
        this.scene.add(this.swirl);
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
            cameraDistance: 2500,
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
            lastRenderDate: new Date(),
            swirl: new THREE.Object3D()
            
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
            globe_swirls.call(self);

            if(cb){
                cb();
            }
        });


        img.src = this.mapUrl;
    }

    globe.prototype.tick = function(){
        globe_runPointAnimations.call(this);
        TWEEN.update();

        //requestAnimationFrame( animate );

        if(this.stats){
            this.stats.update();
        }


        var renderTime = new Date() - this.lastRenderDate;
        this.lastRenderDate = new Date();
        var rotateCameraBy = (2 * Math.PI)/(20000/renderTime);

        this.cameraAngle += rotateCameraBy;

        this.camera.position.x = this.cameraDistance * Math.cos(this.cameraAngle);
        this.camera.position.y = 0;
        this.camera.position.z = this.cameraDistance * Math.sin(this.cameraAngle);


        this.camera.lookAt( this.scene.position );

        //h = ( 360 * ( 1.0 + time ) % 360 ) / 360;
        // material.color.setHSL( h, 1.0, 0.6 );
        //

        /*
        for(var i = 0; i< lineCurves.length; i++){
            lineCurves[i].rotateY((2 * Math.PI)/(3000/renderTime));
        }
       */
      this.swirl.rotateY((2 * Math.PI)/(3000/renderTime));
        this.renderer.render( this.scene, this.camera );

    }

    
    globe.prototype.addMarker = function(){


    }

    /*
    var landPoints = function(img, samples, cb){

        // note:i don't think this is working because i need to wait for the document to finish loading
        var points = [];
        var loaded = false;

        var getPoints = function(){
            if(loaded){
                return;
            } 
            loaded = true;

            var globeCanvas = document.createElement('canvas');
            document.body.appendChild(globeCanvas);
            var globeContext = globeCanvas.getContext('2d');
            globeCanvas.width = img.width;
            globeCanvas.height = img.height;
            globeContext.drawImage(img, 0, 0, img.width, img.height);
            console.log(img.height);

            for (var i = 0; i< samples.length; i++){
                samplePoints(globeContext,img.width, img.height, samples[i].offsetLat, samples[i].offsetLon, samples[i].incLat, samples[i].incLon, function(point){
                    points.push(point);
                });
            }
            cb(points);
            document.body.removeChild(globeCanvas);
        };

        img.addEventListener('load', getPoints);
        // in case we alread finished loading the image
        if(img.complete){
            getPoints();
        }
        setTimeout(function(){
            console.log(img.complete);

        },1000);

    };
   */



    return {
        globe: globe,
        waitForAll: waitForAll
    };

})();
