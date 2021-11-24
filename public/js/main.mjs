const DEFAULT_SCALE = 0.5;
const MINIMUM_SCALE = 0.25;
const MAXIMUM_SCALE = 1;

let _glb, _root, _p0x, _p0y, _p1x, _p1y;

let _scaleBefore = 0;
let _scaleAfter = 0;
let _scaling = false;

window.addEventListener('touchstart', function (e) {
    _scaling = e.touches.length === 2;
    if(_scaling) {
        onTouchStart(e);
    }
});

window.addEventListener('touchmove', function (e) {
    if(_scaling) {
        onTouchMove(e);
    }
});

window.addEventListener('touchend', function (e) {
    if(_scaling) {
        onTouchEnd(e);
    }
});

window.addEventListener("wheel", event => {
    const delta = Math.sign(event.deltaY);
    mouseRescale(delta);
});

function onTouchStart(e) {
    if(_scaling) {
        updateTouch(e);
        _scaleBefore = touchDistance();
    }
}

function onTouchMove(e) {
    if(_scaling) {
        updateTouch(e);
        _scaleAfter = touchDistance();
        if(scaleIncreased()) {
            gestureRescale(-1);
        } else gestureRescale(1);
    }
}

function onTouchEnd(e) {
    clearTouch();
    _scaling = false;
}

function clearTouch(e) {
    _p0x = 
    _p0y = 
    _p1x = 
    _p1y = 0;
}

function updateTouch(e) {
    if(e == null) { return; }
    _p0x = e.touches[0].pageX;
    _p0y = e.touches[0].pageY;
    _p1x = e.touches[1].pageX;
    _p1y = e.touches[1].pageY;
}

function touchDistance() {
    return Math.hypot(
        _p0x - _p1x,
        _p0y - _p1y
    );
}

function scaleIncreased() {
    let scale = _scaleBefore - _scaleAfter;
    return scale > 0;
}

function gestureRescale(delta) {
    if(_glb == null) { return; }
    let sx = _glb.scale.x;
    let sy = _glb.scale.y;
    let sz = _glb.scale.z;
    if(delta > 0) {      
        let dim = 1.03;
        sx *= dim;
        sy *= dim;
        sz *= dim;
        sx = sx > MAXIMUM_SCALE ? MAXIMUM_SCALE : sx;
        sy = sy > MAXIMUM_SCALE ? MAXIMUM_SCALE : sy;
        sz = sz > MAXIMUM_SCALE ? MAXIMUM_SCALE : sz;
        _glb.scale.set(sx, sy, sz);
    }
    else {
        let dim = 0.96;
        sx *= dim;
        sy *= dim;
        sz *= dim;
        sx = sx < MINIMUM_SCALE ? MINIMUM_SCALE : sx;
        sy = sy < MINIMUM_SCALE ? MINIMUM_SCALE : sy;
        sz = sz < MINIMUM_SCALE ? MINIMUM_SCALE : sz;
        _glb.scale.set(sx, sy, sz);
    }
}

function mouseRescale(delta) {
    if(_glb == null) { return; }
    let sx = _glb.scale.x;
    let sy = _glb.scale.y;
    let sz = _glb.scale.z;
    if(delta > 0) {    
        let dim = 1.1;
        sx *= dim;
        sy *= dim;
        sz *= dim;
        sx = sx > MAXIMUM_SCALE ? MAXIMUM_SCALE : sx;
        sy = sy > MAXIMUM_SCALE ? MAXIMUM_SCALE : sy;
        sz = sz > MAXIMUM_SCALE ? MAXIMUM_SCALE : sz;
        _glb.scale.set(sx, sy, sz);
    }
    else {
        let dim = 0.9;
        sx *= dim;
        sy *= dim;
        sz *= dim;
        sx = sx < MINIMUM_SCALE ? MINIMUM_SCALE : sx;
        sy = sy < MINIMUM_SCALE ? MINIMUM_SCALE : sy;
        sz = sz < MINIMUM_SCALE ? MINIMUM_SCALE : sz;
        _glb.scale.set(sx, sy, sz);
    }
}

(async function() {
    
    const MODEL_PATH = "/3d/model.glb";

    let scene, camera, light, renderer;

    let arToolkitSource, arToolkitContext;

    let blocker = document.getElementById('app-blocker');
    
    let ui = document.getElementById('ui');

    let environmentMap;

    let initialized = false;

    let loaded = false;

    let stopClick = true;

    // modal
    let modal = {
        button: null,
        element: null,
        visible: false
    }
    
    modal.button = document.getElementById("help");
    modal.element = document.getElementById("help-modal");
    
    modal.button.addEventListener("click", function() {
        modal.visible = !modal.visible;
        if(modal.visible) {
            modal.element.style.display = "block";
        } else {
            modal.element.style.display = "none";
        }
    });

    let audio_opening = new Audio('/audio/opening.mp3');
    let audio_closing = new Audio('/audio/closing.mp3');
    let audio_closed0 = new Audio('/audio/closed_0.mp3');
    let audio_closed1 = new Audio('/audio/closed_1.mp3');

    let audio = [
        audio_opening,
        audio_closing,
        audio_closed0,
        audio_closed1
    ];

    let doors = {
        animate: false,
        opening: false,
        speed: 0.01,
        left : null,
        right: null,
        dlx: 0,
        drx: 0
    };

    let router = {
        mesh: null,
        lit: true,
        interval: 1,
        magnitude: 3,
        speed: 0.25
    };

    let posters = {
        index: 0,
        names: [
            "poster_0",
            "poster_1",
            "poster_2"
        ],
        map: new Map()
    }

    let stopAudio = function() {
        audio.map(a => {
            a.pause();
            a.currentTime = 0;
        });
    }

    // change posters
    let changePosters = function() {
        if(posters.map.has(posters.names[posters.index])) {
            posters.map.get(posters.names[posters.index]).visible = false;
        }
        posters.index += 1;
        posters.index = posters.index == posters.map.size ? 0 : posters.index;
        if(posters.map.has(posters.names[posters.index])) {
            posters.map.get(posters.names[posters.index]).visible = true;
        }
    }

    // click event handler
    let onClick = function() {
        if(stopClick) {
            return;
        }

        if(doors.left != null && doors.right != null) {
            stopAudio();
            doors.opening = !doors.opening;
            doors.animate = true;
            if(doors.opening) {
                audio_opening.play();
            }
            else {
                audio_closing.play();
            }
        }
    }

    // update router light
    let updateRouter = function() {
        if(router.mesh != null) {
            router.interval -= router.speed;
            if(router.interval < 0) {
                router.lit = !router.lit;
                router.mesh.material.emissiveIntensity = router.lit ? 2.0 : -1.0;
                router.interval = (Math.random() * router.magnitude);
            }
        }
    }

    // update doors
    let updateDoors = function() {
        if(doors.animate) {
            if(doors.opening) {
                openDoors();
            } else {
                closeDoors();
            }
        }
    }

    let openDoors = function() {
        const DOOR_LEFT_OPEN = -1;
        const DOOR_RIGHT_OPEN = 1;

        if(doors.dlx > DOOR_LEFT_OPEN) {
            doors.dlx -= doors.speed;
            doors.dlx = doors.dlx < DOOR_LEFT_OPEN ? DOOR_LEFT_OPEN : doors.dlx;
            doors.left.position.set(doors.dlx,0,0);
        }

        if(doors.drx < DOOR_RIGHT_OPEN) {
            doors.drx += doors.speed;
            doors.drx = doors.drx > DOOR_RIGHT_OPEN ? DOOR_RIGHT_OPEN : doors.drx;
            doors.right.position.set(doors.drx,0,0);
        }

        if(doors.dlx <= DOOR_LEFT_OPEN && doors.drx >= DOOR_RIGHT_OPEN) {
            stopAudio();
            audio_closed0.play();
            doors.animate = false;
        }
    }
    
    let closeDoors = function() {
        const DOOR_CLOSED = 0;

        if(doors.dlx < DOOR_CLOSED) {
            doors.dlx += doors.speed;
            doors.dlx = doors.dlx > DOOR_CLOSED ? DOOR_CLOSED : doors.dlx;
            doors.left.position.set(doors.dlx,0,0);
        }

        if(doors.drx > DOOR_CLOSED) {
            doors.drx -= doors.speed;
            doors.drx = doors.drx < DOOR_CLOSED ? DOOR_CLOSED : doors.drx;
            doors.right.position.set(doors.drx,0,0);
        }

        if(doors.dlx >= DOOR_CLOSED && doors.drx <= DOOR_CLOSED) {
            stopAudio();
            audio_closed1.play();
            doors.animate = false;

            // change posters only on close
            changePosters();
        }
    }

    // directives
    let setLight = function(o) {
        let light = new THREE.PointLight( 0xffffff, 1, 0 );
        o.add(light);
    }

    let setDoor = function(o) {
        let name = o.name.toLowerCase();
        
        if(name.indexOf("left") >= 0) {
            doors.left = o;
        } else {
            doors.right = o;
        }

        o.traverse(child => {
            if(child.isMesh) {
                child.renderOrder = 2;
            }
        })
    }

    let setOccluder = function(o) {
        if(o.isMesh) {
            o.material.colorWrite = false;
            o.renderOrder = 0;
        }
    }

    let setRouter = function(o) {
        if(o.isMesh) {
            router.mesh = o;
        }
    }

    let setPosters = function(o) {
        o.traverse(child => {
            if(child.isMesh) {
                let name = child.name.toLowerCase();
                if(posters.names.indexOf(name) >= 0) {
                    console.log(name);
                    posters.map.set(name, child);
                }
                child.visible = false;
            }
        });

        if(posters.map.has(posters.names[posters.index])) {
            console.log("set first poster");
            posters.map.get(posters.names[posters.index]).visible = true;
        }
    }

    const directives = new Map([
        ['lightpos', setLight ],
        ['door_axis_left', setDoor ],
        ['door_axis_right', setDoor ],
        ['occluder', setOccluder],
        ['router_light', setRouter],
        ['poster_axis', setPosters]
    ]);

    await init();
    await load();
    await begin();
    
    async function init() {

        // NProgress
        NProgress.start();

        //////////////
        // three.js //
        //////////////

        // init scene
        scene = new THREE.Scene();
    
        // scene will only be visible when pattern is tracked
        scene.visible = false;
    
        // init camera
        camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );

        scene.add(camera);

        // init root object
        _root = new THREE.Object3D();
        scene.add(_root);

        // ambient light
        light = new THREE.AmbientLight( 0xffffff, 0.45 ); 

        scene.add( light );
    
        renderer = new THREE.WebGLRenderer({
            antialias : true,
            alpha: true,
            precision: 'highp',
        });

        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(new THREE.Color('lightgrey'), 0)
        renderer.setSize( 1280, 960 );
        renderer.domElement.style.position = 'absolute'
        renderer.domElement.style.top = '0px'
        renderer.domElement.style.left = '0px'
        document.body.appendChild( renderer.domElement );
    
        /////////////////////
        // artoolkitsource //
        /////////////////////
    
        // create artoolkitsource instance
        arToolkitSource = new THREEx.ArToolkitSource({
            sourceType : 'webcam',
        });
    
        // resize event handler for artoolkitsource
        function onResize() {
            arToolkitSource.onResizeElement();
            arToolkitSource.copyElementSizeTo(renderer.domElement);
            if ( arToolkitContext.arController !== null ) {
                arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
            }	
        }
    
        // hook into window resize event
        window.addEventListener('resize', function() {
            onResize();
        });
        
        //////////////////////
        // artoolkitcontext //
        //////////////////////	
    
        // create artoolkitcontext instance
        arToolkitContext = new THREEx.ArToolkitContext({
            cameraParametersUrl: '/data/camera/camera_para.dat',
            detectionMode: 'mono'
        });
        
        // init artoolkitcontext
        arToolkitContext.init( function onCompleted() {
            // copy projection matrix to camera when initialization complete
            camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
       
            // RACE CONDITION?
            // artoolkit context must be intiialized before the following code can run safely :
            arToolkitSource.init(function onReady() {
                onResize();
        
                // https://github.com/jeromeetienne/AR.js/issues/146
                // artoolkit sets near and far too distant, creating z-fighting issues
                let m = arToolkitContext.getProjectionMatrix();
                let far = 1000;
                let near = 0.1;
            
                m.elements[10] = -(far + near) / (far - near);
                m.elements[14] = -(2 * far * near) / (far - near);
            
                camera.projectionMatrix.copy(m);
        
                setTimeout(function() {
                    onResize();
                    initialized = true;
                }, 1000);
            });
        });
    
        //////////////////////
        // armarkercontrols //
        //////////////////////
    
        // init controls for camera
        let markerControls = new THREEx.ArMarkerControls(arToolkitContext, _root, {
            type: 'pattern', patternUrl: "/data/patterns/hiro.patt",
        })

        markerControls.addEventListener('markerFound', function(event) {
            stopClick = false;
        });
    }

    async function load() {
        
        if(_root) {
            
            // used to generate environment texture map data
            const pmremGenerator = new THREE.PMREMGenerator(renderer);
            // used to load texture
            const textureLoader = new THREE.TextureLoader();
            // used to load model
            const threeGLTFLoader = new THREE.GLTFLoader();               
            // used to display progress to user
            const status = document.getElementById("status-data");

            textureLoader.load(
                // resource URL
                '/img/env.png',
            
                // onLoad callback
                function ( texture ) {

                    environmentMap = pmremGenerator.fromEquirectangular(texture).texture;
                    scene.environment = environmentMap;

                    console.log("environment texture loaded successfully");

                    threeGLTFLoader.load(     
                        // resource URL
                        MODEL_PATH,
        
                        // called when the resource is loaded
                        function ( gltf ) {
    
                            gltf.scene.traverse((child) => {
                                let name = child.name.toLowerCase();
                                if(directives.has(name)) {
                                    let dir = directives.get(name);
                                    dir(child);
                                }
                            });

                            _glb = gltf.scene;
                            _glb.scale.set( 
                                DEFAULT_SCALE, 
                                DEFAULT_SCALE, 
                                DEFAULT_SCALE );
                            
                            window.addEventListener('click', () => {
                                onClick();
                            })
    
                            // dont set visible until ready
                            _glb.visible = false;
    
                            _root.add( _glb );
    
                            loaded = true;
                        },
        
                        // called while loading is progressing
                        function ( xhr ) {
                            let loaded = xhr.loaded / xhr.total * 100;
                            let progress = loaded < 100 ? `[LOADING] %${loaded}` : "[INITIALIZING]";
                            if(status != undefined) {
                                status.innerHTML = progress;
                            }
                        },
    
                        // called when loading has errors
                        function ( error ) {
                            if(status != undefined) {
                                status.innerHTML = "[XHR ERROR: Refresh Page]"
                            }
                            console.log( 'Error loading glTF resource' );
                            console.log( error );
                        }
                    );
                },
            
                // onProgress callback currently not supported
                undefined,
            
                // onError callback
                function ( err ) {
                    console.error( 'An error loading the texture occurred' );
                }
            );

            // set animation & render loop
            if(renderer) {
                renderer.setAnimationLoop( run );
            }
        }
    }

    async function begin() {
        wait();
        function wait() {
            setTimeout(function() {
                if(initialized && loaded) {
                    begin();
                } else wait();
            }, 2000);
        }
        function begin() {
            if(blocker) {
                blocker.style.display = 'none';
            }
            if(NProgress) {
                NProgress.done();
            }
            if(ui) {
                ui.classList.remove("hide");
            }
            if(_glb) {
                _glb.visible = true;
            }
        }
    }

    function run(time) {
        update();
        render();     
    }
    
    function update() {
        updateRouter();
        updateDoors();
        if ( arToolkitSource.ready !== false ) {
            arToolkitContext.update( arToolkitSource.domElement );
        }
        scene.visible = camera.visible;
    }
    
    function render() {
        renderer.render( scene, camera );
    }
})();