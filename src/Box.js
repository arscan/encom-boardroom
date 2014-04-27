var THREE = require("three"),
    Utils = require("./Utils"),
    pushercolor = require("pusher.color");

var createSideCanvas = function(){

    var sideCanvas =  Utils.renderToCanvas(200, 100, function(ctx){


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

    var trackerBallCanvas = Utils.renderToCanvas(10, 10, function(ctx){
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
                                                                            geo.vertices[a-2].z = Utils.sCurve(Math.min(1, time/2000)) * d/2;
                                                                            geo.vertices[a-1].x = Math.max(-w*rand3/2,Math.min(w*rand3/2, w * Math.cos(rand2 * (rand * w + posTime/1000)) / 2));
                                                                            geo.vertices[a-1].z = -Utils.sCurve(Math.min(1, time/2000)) * d/2;
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
                                                                                geo.vertices[a-2].y = Utils.sCurve(Math.min(1, time/2000)) * h/2 + h/2;
                                                                                geo.vertices[a-1].x = Math.max(-w*rand3/2, Math.min(w*rand3/2,w * Math.cos(rand2 * (rand * w + posTime/1000)) / 2));
                                                                                geo.vertices[a-1].y = h/2 -Utils.sCurve(Math.min(1, time/2000)) * h/2;
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
                                                                                geo.vertices[a-2].y = Utils.sCurve(Math.min(1, time/2000)) * h/2 + h/2;
                                                                                geo.vertices[a-1].x = Math.max(-w*rand3/2,Math.min(w*rand3/2,w * Math.cos(rand2 * (rand * w + posTime/1000)) / 2));
                                                                                geo.vertices[a-1].y = h/2-Utils.sCurve(Math.min(1, time/2000)) * h/2;
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
                                                                            geo.vertices[a-2].x = Utils.sCurve(Math.min(1, time/2000)) * w/2;
                                                                            geo.vertices[a-1].x = -Utils.sCurve(Math.min(1, time/2000)) * w/2
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
                                                                                geo.vertices[a-2].y = h/2 + Utils.sCurve(Math.min(1, time/2000)) * h/2;
                                                                                geo.vertices[a-1].y = h/2 - Utils.sCurve(Math.min(1, time/2000)) * h/2;
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
                                                                                geo.vertices[a-2].y = h/2 + Utils.sCurve(Math.min(1, time/2000)) * h/2;
                                                                                geo.vertices[a-1].y = h/2 - Utils.sCurve(Math.min(1, time/2000)) * h/2;
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

                                                        var boxTexture = new THREE.Texture(createSideCanvas.call(this));
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
                                                            this.particleColors.push(new THREE.Color(pushercolor("#00eeee").blend("#ffcc00", i/4).hex6()));
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

        this.trackerBallMaterial.opacity = Utils.sCurve(percentComplete);

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
            this.shaderAttributes.opacity.value[i] = Math.min(1,(36 - Math.sqrt(Math.pow(x,2) + Math.pow(z,2)))/36 * Utils.sCurve(percentComplete) + Math.max(y,0)/10);
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

module.exports = Box;
