var StreamServer = (function () {

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
            message: "repo*second*third*user*fifth*java*d8f1dd663be9b8a3845e040f883883c0"
        });
    }, 500);

    /* expose what we want */

    return {
        onStreamLoaded: onStreamLoaded,
        onMessage: onMessage
    };
}());
