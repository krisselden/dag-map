module.exports = {
  entry: 'dag-map.js',
  targets: [{
    dest: 'dag-map.umd.js',
    format: 'umd',
    moduleName: 'DAG',
    moduleId: 'dag-map',
    sourceMap: true,
    exports: 'named' // required to be compatible with es2015 import
                     // in typescript
  }]
};
