#!/usr/bin/env sh
d8 --trace-ic 'd8-test.js' > ic.log
d8 --runtime-call-stats 'd8-test.js'
