QUnit = require('qunitjs');
require('./dag-test.js');

var QUnit = require('qunitjs');
var num = 1;

QUnit.begin(function (details) {
  console.log('1..' + details.totalTests);
});

QUnit.testDone(function (details) {
  console.log((details.failed ? 'not ok ' : 'ok ') + (num++) + ' - ' + details.module + ' - ' + details.name);
});

QUnit.done(function (details) {
  console.log("# total:", details.total, "failed:", details.failed, "passed:", details.passed, "runtime:", details.runtime);
  process.exit(details.failed > 0 ? 1 : 0);
});

QUnit.load();
