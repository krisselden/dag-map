var stew = require('broccoli-stew');
var compiledModules = require('broccoli-es6-module-transpiler');
var uglify = require('broccoli-uglify-js');
var find = stew.find;
var env  = stew.env;
var rename = stew.rename;
var mv = stew.mv;
var path = require('path');

var lib       = find('lib');
var tests     = find('tests');
var testIndex = find(tests, 'tests/index.html');
var qunit     = find(path.dirname(require.resolve('qunitjs')) + '/qunit.{js,css}');

var qunit = rename(qunit, path.basename);

var dagMap = compiledModules(lib, {
  format: 'bundle',
  entry: 'dag-map.umd',
  output: 'dag-map.js'
});

var tests = compiledModules(tests, {
  format: 'bundle',
  entry: 'index.umd',
  output: 'tests/index.js'
});

env('production', function() {
  dagMap = find([
    rename(uglify(dagMap), '.js', '.min.js'),
    dagMap
  ]);
});

module.exports = find([
  dagMap,
  tests,
  testIndex,
  mv(qunit, 'tests')
]);
