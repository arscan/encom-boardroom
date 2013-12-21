
;ENCOM = (function(){

    /* encom fucntions */

    var extend = function(first, second) {
        for(var i in first){
            second[i] = first[i];
        }
    }

    var waitForAll = function(waits, cb){
        var this.waitfor_count = waits.length;

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
    }

    var globe_isPixelBlack = function(context, x, y){
        // console.log(context.getImageData(x,y,1,1));
        return context.getImageData(x,y,1,1).data[0] === 0;
    }

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
    }

    function globe(opts){

        if(!opts){
            opts = {};
        }

        var defaults = {
            mapUrl: "equirectangle_projection.png",
            size: 100,
            width: 500,
            height: 300,
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
            points: [];

        extend(opts, defaults);

        for(var i in defaults){
            !this[i] && this[i] = defaults[i];
        }


    }

    /* public globe functions */

    globe.prototype.init = function(cb){
        var img = document.createElement('img')
            projectionCanvas = document.createElement('canvas'),
            projectionContext;
            
        document.body.appendChild(projectionCanvas);
        projectionContext = projectionContext.getContext('2d');

        img.addEventListener('load', function(){
            //image has loaded, may rsume
            globeCanvas.width = img.width;
            globeCanvas.height = img.height;
            globeContext.drawImage(img, 0, 0, img.width, img.height);
            for (var i = 0; i< samples.length; i++){
                samplePoints(globeContext,img.width, img.height, samples[i].offsetLat, samples[i].offsetLon, samples[i].incLat, samples[i].incLon, function(point){
                    this.points.push(point); = 
                });
            }
            document.body.removeChild(globeCanvas);


            // create the webgl context
            // create the camera
            // create the the
            

            if(this.containerId){
                container = document.getElementById(this.containerId);
                renderer.setSize( container.width, container.height);
            } else {
                container = document.createElement( 'div' );
                renderer.setSize( this.width, this.height);

            }
            
            this.renderer = new THREE.WebGLRenderer( { clearAlpha: 1 } );
            container.appendChild( renderer.domElement );


            cb();
        });



        // LOAD THE MAIN DATA POINTS
        
        // create the image
        // wait for it to load
        //
        // after it loads, run stuff against i
        //

                points.push(point);
            });
        }
        cb(points);
    



        img.src = this.mapUrl;
    }

    globe.prototype.tick = function(){


    }

    globe.prototype. = function(){


    }
    
    globe.prototype.addMarker = function(){


    }

    globe.prototype.addMarker = function(){


    }




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



    return {
        globe: globe
        waitForAll: waitForAll;
    };

})();
