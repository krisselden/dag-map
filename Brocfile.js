/* jshint node:true, undef:true, unused:true */
var AMDFormatter = require('es6-module-transpiler-amd-formatter');
var closureCompiler = require('broccoli-closure-compiler');
var compileModules = require('broccoli-compile-modules');
var mergeTrees = require('broccoli-merge-trees');
var moveFile = require('broccoli-file-mover');
var pluckFilesFrom = require('broccoli-static-compiler');
var jshint = require('broccoli-jshint');

var concat           = require('broccoli-concat');
var replace          = require('broccoli-string-replace');
var calculateVersion = require('./config/calculateVersion');
var path             = require('path');

var bowerDirectory = 'bower_components';

var loader = pluckFilesFrom(bowerDirectory, {
  srcDir: '/loader',
  files: [ 'loader.js' ],
  destDir: '/tests'
});

var qunit = pluckFilesFrom(bowerDirectory, {
  srcDir: '/qunit/qunit',
  destDir: '/tests'
});

var testLoader = pluckFilesFrom(bowerDirectory, {
  srcDir: 'ember-cli-test-loader',
  files: [ 'test-loader.js' ],
  destDir: '/tests'
});

var testIndex = pluckFilesFrom('tests', {
  srcDir: '/',
  files: ['index.html'],
  destDir: '/tests/'
});

var configTree = pluckFilesFrom('config', {
  srcDir: '/',
  files: [ 'versionTemplate.txt' ],
  destDir: '/'
});

var testsTree = pluckFilesFrom('tests', {
  srcDir: '/',
  files: [ '**/*.js' ],
  destDir: '/'
});

var jshintLib = jshint('lib');
var jshintTests = jshint(testsTree);

var bundle = compileModules('lib', {
  inputFiles: ['dag.umd.js'],
  output: '/dag.js',
  formatter: 'bundle',
});


bundle = concat(mergeTrees([bundle, configTree]), {
  inputFiles: [
    'versionTemplate.txt',
    'dag.js'
  ],
  outputFile: '/dag.js'
});

bundle = replace(bundle, {
  files: [ 'dag.js' ],
  pattern: {
    match: /VERSION_PLACEHOLDER_STRING/g,
    replacement: calculateVersion()
  }
});

function generateNamedAMDTree(inputTree, outputFile) {
  var workingTree = compileModules(inputTree, {
    inputFiles: ['**/*.js'],
    output: '/',
    formatter: new AMDFormatter()
  });

  workingTree = concat(mergeTrees([workingTree, configTree]), {
    inputFiles: [
      'versionTemplate.txt',
      '**/*.js'
    ],
    outputFile: '/' + outputFile
  });

  workingTree = replace(workingTree, {
    files: [ outputFile ],
    pattern: {
      match: /VERSION_PLACEHOLDER_STRING/g,
      replacement: calculateVersion()
    }
  });

  return workingTree;
}

var namedAMDTree = generateNamedAMDTree('lib', 'dag.amd.js');
var namedAMDTestTree = generateNamedAMDTree(mergeTrees(['lib', testsTree, jshintLib, jshintTests]), 'dag-tests.amd.js');

var trees = [qunit, loader, testIndex, testLoader, bundle, namedAMDTree, namedAMDTestTree];

if (process.env.ENV === 'production') {
  trees.push(closureCompiler(moveFile(bundle, {
    srcFile: 'dag.js',
    destFile: 'dag.min.js'
  }), {
    compilation_level: 'ADVANCED_OPTIMIZATIONS',
  }));
}

module.exports = mergeTrees(trees);
