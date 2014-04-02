var StreamServer = (function () {

    var mockUsers = ['9cca89218cefc2a2b79703d50b2f14ab9',
        '001f39d886b094178d85d5acd0d8782a',
        '1693351cfdf5a44cafa40f89b988eb4f',
        'ec8150609d2d6616944b3751ef3309ec',
        '5262283473c69b7d3ae4f26a4ce6a9fb',
        '031ae086c509b79708580b4b64a8ab5b',
        '8b3190da895e48686a313429f8b3850b',
        '4bcdf0f5141a89c3fb4d18e2786fc6f7',
        'b4b7e21776a1081ba754619d20e33f4c',
        'ab2cf758040cee7fccd35f11ce2f72b2',
        '32ef4e3e388cbadc756a008cade3ee6a',
        '4abd5fbf19328cc23f60ca6453d9429c',
        'f40bd5ee6bf6678ff2bca248113d6599',
        '4d0c8fd9e76d64831f089f32ca91879a',
        '0da57fdee303740e5d241fdfd0a93d0d',
        'cb053688f95dbebf60e5c19a3d05110c',
        'b441107a51951ba60e0359afd6e3029f',
        'f1b47bf9bf001c9feb1b5d982c8fa04f',
        '2639272b28fda236c5c163d38a96bee6',
        '8876ddcc2f9e391eaa241ce131eca8ab',
        'df71b16a1ace7c8525c5bd42d768ab80',
        '4aa1c1f60ca46e6c8953f774e6cbab31',
        'b68f5d39138103e8c3b8a6095be84072'
    ];

    var onMessageFn = function(){};
    var onStreamLoadedFn = function(){};

    /* private function */


    var loadScript = function(url, callback)
    {
        // Adding the script tag to the head as suggested before
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;

        // Then bind the event to the callback function.
        // There are several events for cross browser compatibility.
        script.onreadystatechange = callback;
        script.onload = callback;

        // Fire the loading
        head.appendChild(script);
    };

    /* public functions */

    var onStreamLoaded = function(cb) {
        onStreamLoadedFn = cb;
    }

    var onMessage = function(cb) {
        onMessageFn = cb;
    }

    onStreamLoadedFn();
    setInterval(function(){
        onMessageFn({
            location: {
                name: "test",
                lat: Math.random() * 180 - 90,
                lng: Math.random() * 360 - 180
            },
            message: "repo*second*third*user*fifth*java java asdfasdf ajav asdfja sdfjasdfjadsf jasjdf asjdf jasfdj asdfj asdfj asdfj *" + mockUsers[Math.floor(Math.random() * mockUsers.length)]
        });
    }, 100);

    /* expose what we want */

    return {
        onStreamLoaded: onStreamLoaded,
        onMessage: onMessage
    };
}());
