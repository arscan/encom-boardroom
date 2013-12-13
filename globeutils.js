
;GLOBEUTILS = (function(){

    var globeImage = document.getElementById('globeImage');


    var myColors1 = pusher.color('orange').hueSet();
    var myColors = [];
    for(var i = 0; i< myColors1.length; i++){

        myColors.push(myColors1[i].shade(.2 + Math.random()/2.0));
        myColors.push(myColors1[i].shade(.2 + Math.random()/2.0));
    }



    var latLonToXY = function(width, height, lat,lon){

        var x = Math.floor(width/2.0 + (width/360.0)*lon);
        var y = Math.floor(height - (height/2.0 + (height/180.0)*lat));

        return {x: x, y:y};
    }

    var drawLatLon= function(context, lat,lon){
        var point = latLonToXY(pointCanvas.width, pointCanvas.height, lat,lon);
        drawHex(context, point.x, point.y, 4.0);
        // context.fillStyle="#FF0000";
        // context.fillRect(point.x, point.y, 4, 4);
    }

    var isPixelBlack = function(context, x, y){
        // console.log(context.getImageData(x,y,1,1));
        return context.getImageData(x,y,1,1).data[0] === 0;
    }

    var samplePoints = function(globeContext, width, height, latoffset, lonoffset, latinc, loninc, cb){
        for(var lat = 90-latoffset; lat > -90; lat -= latinc){
            for(var lon = -180+lonoffset; lon < 180; lon += loninc){
                var point = latLonToXY(width, height, lat, lon);
                if(isPixelBlack(globeContext,point.x, point.y)){
                    cb({lat: lat, lon: lon});
                    //drawLatLon(pointContext,lat,lon);
                }
            }
        }
    }

    var drawHex = function(ctx, x, y, width){
        var sqrt3 = Math.sqrt(3);
        ctx.fillStyle= myColors[Math.floor(Math.random()*myColors.length)].hex6();
        ctx.beginPath();
        ctx.moveTo(x, y - width);
        ctx.lineTo(x+width*sqrt3/2.0, y - width/2.0);
        ctx.lineTo(x+width*sqrt3/2.0, y + width/2.0);
        ctx.lineTo(x, y + width);
        ctx.lineTo(x-width*sqrt3/2.0, y + width/2.0);
        ctx.lineTo(x-width*sqrt3/2.0, y - width/2.0);
        ctx.closePath();
        ctx.fill();
    }

    // samplePoints(0, 0,2,4, function(){});
    // samplePoints(1,2, 2,4, function(){});
    // samplePoints(1.25,2.5);
    //

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
        landPoints: landPoints

    };

})();
