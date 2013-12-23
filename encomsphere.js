
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
        // console.log(context.getImageData(x,y,1,1));
        return context.getImageData(x,y,1,1).data[0] === 0;
    };

    var globe_samplePoints = function(globeContext, width, height, latoffset, lonoffset, latinc, loninc, cb){
        var points = [];
        for(var lat = 90-latoffset; lat > -90; lat -= latinc){
            for(var lon = -180+lonoffset; lon < 180; lon += loninc){
                var point = globe_latLonToXY(width, height, lat, lon);
                if(globe_isPixelBlack(globeContext,point.x, point.y)){
                    points.push({lat: lat, lon: lon});
                    //drawLatLon(pointContext,lat,lon);
                }
            }
        }
        return points;
    };

    var globe_addPointAnimation = function(when, verticleIndex, position){
        var pCount = pointAnimations.length-1;
        while(pCount > 0 && pointAnimations[pCount].when < when){
            pCount--;
        }
        pointAnimations.splice(pCount+1,0, {when: when, verticleIndex: verticleIndex, position: position});
    };

    var globe_runPointAnimations = function(){
        var next;

        if(pointAnimations.length == 0){
            return;
        }

        while(pointAnimations.length > 0 && (next = pointAnimations.pop()).when < Date.now()){
            this.globe_particles.geometry.vertices[next.verticleIndex].x = next.position.x;
            this.globe_particles.geometry.vertices[next.verticleIndex].y = next.position.y;
            this.globe_particles.geometry.vertices[next.verticleIndex].z = next.position.z;

            this.globe_particles.geometry.verticesNeedUpdate = true;
        }
        if(next.when >= Date.now()){
            pointAnimations.push(next);

        }

    };

    var globe_mainParticles = function(){

        var material, geometry;

        var colors = [];

        var sprite = THREE.ImageUtils.loadTexture( "hex2.png" );
        //console.log(points.length);
        var myColors1 = pusher.color('orange').hueSet();
        var myColors = [];
        for(var i = 0; i< myColors1.length; i++){
            myColors.push(myColors1[i]);

            myColors.push(myColors1[i].shade(.2 + Math.random()/2.0));
            myColors.push(myColors1[i].shade(.2 + Math.random()/2.0));
        }

        for ( i = 0; i < points.length; i ++ ) {

            var vertex = new THREE.Vector3();
            var point = mapPoint(points[i].lat, points[i].lon, 500);
            var delay = 3000*((180+points[i].lon)/360.0); 

            vertex.x = 0;
            vertex.y = 0;
            vertex.z = cameraDistance+1;

            geometry.vertices.push( vertex );

            globe_addPointAnimation(Date.now() + delay, i, {
                x : point.x*1.05,
                y : point.y*1.05,
                z : point.z*1.05});

            globe_addPointAnimation(Date.now() + delay + 400, i, {
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

    /* globe constructor */

    function globe(opts){

        if(!opts){
            opts = {};
        }

        var defaults = {
            mapUrl: "equirectangle_projection.png",
            size: 100,
            width: 500,
            height: 300,
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
            points: []
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
        var img = document.createElement('img')
            projectionCanvas = document.createElement('canvas'),
            projectionContext,
            self = this;
            
        document.body.appendChild(projectionCanvas);
        projectionContext = projectionCanvas.getContext('2d');

        img.addEventListener('load', function(){
            //image has loaded, may rsume
            globeCanvas.width = img.width;
            globeCanvas.height = img.height;
            globeContext.drawImage(img, 0, 0, img.width, img.height);
            for (var i = 0; i< samples.length; i++){
                globe_samplePoints(globeContext,img.width, img.height, samples[i].offsetLat, samples[i].offsetLon, samples[i].incLat, samples[i].incLon, function(point){
                    self.points.push(point);
                });
            }
            document.body.removeChild(globeCanvas);


            // create the webgl context, renderer and camera
            if(self.containerId){
                container = document.getElementById(self.containerId);
                renderer.setSize( container.width, container.height);
                self.width = container.width;
                self.height = container.height;
            } else {
                container = document.createElement( 'div' );
                renderer.setSize( self.width, self.height);
            }
            
            self.renderer = new THREE.WebGLRenderer( { clearAlpha: 1 } );
            container.appendChild( renderer.domElement );

            // create the camera

            self.camera = new THREE.PerspectiveCamera( 50, self.width / self.height, 1, 3000 );
            self.camera.position.z = this.cameraDistance;
            self.cameraAngle=(Math.PI * 2) * .5;

            self.scene = new THREE.Scene();
            self.scene.fog = new THREE.Fog( 0x000000, self.cameraDistance-200, self.cameraDistance+550 );

            // create the stats thing
            
            if(Stats){
                self.stats = new Stats();
                stats.domElement.style.position = 'absolute';
                stats.domElement.style.top = '0px';
                container.appendChild( stats.domElement );
            }


            cb();
        });



        // LOAD THE MAIN DATA POINTS
        
        // create the image
        // wait for it to load
        //
        // after it loads, run stuff against i
        //

        img.src = this.mapUrl;
    }

    globe.prototype.tick = function(){
        this.globe_runPointAnimations();
        //TWEEN.update();

        //requestAnimationFrame( animate );

        stats.update();


        var renderTime = new Date() - (this.lastRenderDate || this.lastRenderDate = new Date());
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


        this.renderer.render( this.scene, camera );

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
