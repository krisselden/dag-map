#!/usr/bin/env sh
d8 --trace-hydrogen --trace-phase=Z --trace-deopt \
   --code-comments --hydrogen-track-positions \
   --redirect-code-traces 'd8-test.js'
d8 --trace-ic 'd8-test.js' > ic.log
d8 --runtime-call-stats 'd8-test.js'
