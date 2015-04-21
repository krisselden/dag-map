var stew = require('broccoli-stew');
var compiledModules = require('broccoli-es6-module-transpiler');
var uglify = require('broccoli-uglify-js');
var find = stew.find;
var env  = stew.env;
var map  = stew.map;
var rename = stew.rename;
var mv = stew.mv;
var path = require('path');
var version = require('git-repo-version');
var fs = require('fs');

var lib       = find('lib');
var tests     = find('tests');
var testIndex = find(tests, 'tests/index.html');
var qunit     = find(path.dirname(require.resolve('qunitjs')) + '/qunit.{js,css}');

var qunit = rename(qunit, path.basename);

var dagMap = compiledModules(lib, {
  format: 'bundle',
  entry: 'dag-map.umd.js',
  output: 'dag-map.js'
});

var tests = compiledModules(find(tests, '**/*.js'), {
  format: 'bundle',
  entry: 'index.umd.js',
  output: 'tests/index.js'
});

env('production', function() {
  dagMap = find([
    rename(uglify(dagMap), '.js', '.min.js'),
    dagMap
  ]);
});

function prependLicense(content, path) {
  var license = fs.readFileSync('./config/versionTemplate.txt').toString().replace(/VERSION_PLACEHOLDER_STRING/, version());

  content.prepend(license);

  return content;
}

module.exports = find([
  map(dagMap, prependLicense),
  tests,
  testIndex,
  mv(qunit, 'tests')
]);
