/**
 * @author mrdoob / http://mrdoob.com/
 */

/**
* @author robscanlon / http://robscanlon.com
*/

var Stats = function (fpsContainer, msContainer) {

    var startTime = Date.now(), prevTime = startTime;
    var ms = 0, msMin = Infinity, msMax = 0;
    var fps = 0, fpsMin = Infinity, fpsMax = 0;
    var frames = 0;

    var fpsDiv = document.createElement( 'div' );
    fpsDiv.id = 'fps';
    fpsContainer.appendChild( fpsDiv );

    var fpsDescription = document.createElement( 'div' );
    fpsDescription.id = 'fpsDescription';
    fpsDescription.innerHTML = 'Frames per Second';
    fpsDiv.appendChild( fpsDescription );

    var fpsText = document.createElement( 'div' );
    fpsText.id = 'fpsText';
    fpsText.innerHTML = 'FPS';
    fpsDiv.appendChild( fpsText );

    var fpsGraph = document.createElement( 'div' );
    fpsGraph.id = 'fpsGraph';
    fpsDiv.appendChild( fpsGraph );

    while ( fpsGraph.children.length < 74 ) {

        var bar = document.createElement( 'span' );
        fpsGraph.appendChild( bar );

    }

    var msDiv = document.createElement( 'div' );
    msDiv.id = 'ms';
    msContainer.appendChild( msDiv );
    
    var msDescription = document.createElement( 'div' );
    msDescription.id = 'msDescription';
    msDescription.innerHTML = 'Refresh Time';
    msDiv.appendChild( msDescription );

    var msText = document.createElement( 'div' );
    msText.id = 'msText';
    msText.innerHTML = 'MS';
    msDiv.appendChild( msText );

    var msGraph = document.createElement( 'div' );
    msGraph.id = 'msGraph';
    msDiv.appendChild( msGraph );

    while ( msGraph.children.length < 74 ) {

        var bar = document.createElement( 'span' );
        msGraph.appendChild( bar );

    }


    var updateGraph = function ( dom, value ) {

        var child = dom.appendChild( dom.firstChild );
        child.style.height = value + 'px';

    }

    return {

        REVISION: 11,

        begin: function () {

            startTime = Date.now();

        },

        end: function () {

            var time = Date.now();

            ms = time - startTime;
            msMin = Math.min( msMin, ms );
            msMax = Math.max( msMax, ms );

            msText.textContent = ms + ' MS (' + msMin + '-' + msMax + ')';
            updateGraph( msGraph, Math.min( 26, 26 - ( ms / 200 ) * 26 ) );

            frames ++;

            if ( time > prevTime + 1000 ) {

                fps = Math.round( ( frames * 1000 ) / ( time - prevTime ) );
                fpsMin = Math.min( fpsMin, fps );
                fpsMax = Math.max( fpsMax, fps );

                fpsText.textContent = fps + ' FPS (' + fpsMin + '-' + fpsMax + ')';
                updateGraph( fpsGraph, Math.min( 26, 26 - ( fps / 100 ) * 26 ) );

                prevTime = time;
                frames = 0;

            }

            return time;

        },

        update: function () {

            startTime = this.end();

        }

    }

};
