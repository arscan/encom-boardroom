Encom Boardroom
=================

An HTML5 recreation of the [Boardroom
Scene](http://work.gmunk.com/TRON-Board-Room) in Disney's [Tron:
Legacy](http://www.imdb.com/tible/tt1104001/).  It currently displays realtime
data from Github and Wikipedia to make it a bit more fun.  View it in action at
http://www.robscanlon.com/encom-boardroom .

![Boardroom light table](https://raw.github.com/arscan/encom-boardroom/master/images/screenshot_lighttable.jpg "Boardroom light table")

![Boardroom screen](https://raw.github.com/arscan/encom-boardroom/master/images/screenshot.jpg "Boardroom screen")

While I attempted to stay true to the film, it simply wasn't practical to
recreate every element that is portrayed in the scene. The graphics displayed
in the film contain a remarkable amount of detail despite only being visible
for a couple of seconds. I am in awe of those that put it together.

My focus was on the globe and I made it available as a [standalone
library](http://github.com/arscan/encom-globe) for those interested. The other
elements are only loose adaptations of the film version. This project is not
associated with Github, Wikipedia, Tron: Legacy, or Disney. It is just a
tribute.

### Usage

The web application can be launched simply by serving up `./index.html`.  If
you would like the full application, including the feeds from wikipedia and
github, install and run the node application as follows:

```sh
npm install
PORT=8000 node stream-server.js
```

Then point your browser at `http://localhost:8000`.

The code isn't particularly well organized right now to quickly add in new
feeds, but it certainly is possible.  I did split out the globe into its own
[standalone library](https://github.com/arscan/encom-globe) that can be easily
reused though.

### Noteable Dependencies

* [Node.js](http://nodejs.org/)
* [Three.js](http://threejs.org/)
* [Encom Globe](http://www.robscanlon.com/encom-globe)
* [Hexasphere.js](http://www.robscanlon.com/hexasphere/)
* [Quadtree2](https://github.com/burninggramma/quadtree2.js)
* [pleaserotate.js](http://www.github.com/arscan/pleaserotate.js)

### Feed Info

**Github:** Data is being streamed in realtime from Github's [public timeline
feed](http://github.com/timeline.json). Location information is retrieved from
the user's github profile and is mapped using
[geonames.org](http://geonames.org). Historic 2013 data was retrieved from the
[Github Archive](http://githubarchive.org). User pictures are from
[Gravatar](http://gravatar.com) and are throttled to under one per second to
conserve bandwidth.

**Wikipedia:** Data is being streamed in realtime from Wikipedia's [public irc
feed](http://meta.wikimedia.org/wiki/IRC_channels#Raw_feeds). Location
information is only available from anonymous users in the form of IP addresses,
and is mapped to real locations using [freegeoip.net](http://freegeoip.net).

### License

The MIT License (MIT)
Copyright (c) 2014 Robert Scanlon

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
