#!/bin/sh
heroku config:set NODE_ENV=production VERBOSE=true
heroku labs:enable websockets
