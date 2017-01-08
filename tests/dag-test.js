(function (QUnit, DAG) {
  "use strict";

  QUnit.module('DAG');

  QUnit.test('detects circular dependencies when added', function(assert){
    var graph = new DAG();

    graph.add('eat omelette', 1);
    graph.add('buy eggs', 2) ;
    graph.add('fry omelette', 3, 'eat omelette', 'shake eggs');
    graph.add('shake eggs', 4, undefined, 'buy eggs');
    graph.add('buy oil', 5, 'fry omelette');
    graph.add('warm oil', 6, 'fry omelette', 'buy oil');
    graph.add('prepare salad', 7);
    graph.add('prepare the table', 8, 'eat omelette');
    graph.add('clear the table', 9, undefined, 'eat omelette');
    graph.add('say grace', 10, 'eat omelette', 'prepare the table');

    assert.throws(function() {
        graph.add('imposible', 11, 'shake eggs', 'eat omelette');
      },
      new Error('cycle detected: imposible <- eat omelette <- fry omelette <- shake eggs <- imposible'),
      'raises an error when a circular dependency is added'
    );
  });

  QUnit.test('#topsort iterates over the edges respecting precedence order', function(assert){
    var graph = new DAG();
    var names = [];
    var index = 0;

    graph.add('eat omelette', 1);
    graph.add('buy eggs', 2) ;
    graph.add('fry omelette', 3, 'eat omelette', 'shake eggs');
    graph.add('shake eggs', 4, undefined, 'buy eggs');
    graph.add('buy oil', 5, 'fry omelette');
    graph.add('warm oil', 6, 'fry omelette', 'buy oil');
    graph.add('prepare salad', 7);
    graph.add('prepare the table', 8, 'eat omelette');
    graph.add('clear the table', 9, undefined, 'eat omelette');
    graph.add('say grace', 10, 'eat omelette', 'prepare the table');

    graph.each(function(name, key){
      names[index] = name;
      index++;
    });

    assert.ok(names.indexOf('buy eggs') < names.indexOf('shake eggs'), 'you need eggs to shake them');
    assert.ok(names.indexOf('buy oil') < names.indexOf('warm oil'), 'you need oil to warm it');
    assert.ok(names.indexOf('eat omelette') < names.indexOf('clear the table'), 'you clear the table after eat');
    assert.ok(names.indexOf('fry omelette') < names.indexOf('eat omelette'), 'cook before eat');
    assert.ok(names.indexOf('shake eggs') < names.indexOf('fry omelette'), 'shake before put into the pan');
    assert.ok(names.indexOf('prepare salad') > -1, 'we don\'t know when we prepare the salad, but we do');
  });

  QUnit.test('#add supports both strings and arrays to specify precedences', function(assert){
    var graph = new DAG();
    var names = [];
    var index = 0;

    graph.add('eat omelette', 1);
    graph.add('buy eggs', 2) ;
    graph.add('fry omelette', 3, 'eat omelette', 'shake eggs');
    graph.add('shake eggs', 4, undefined, 'buy eggs');
    graph.add('buy oil', 5, ['fry omelette', 'shake eggs', 'prepare the table'], ['warm oil']);
    graph.add('prepare the table', 5, undefined, ['fry omelette']);

    graph.each(function(name, value){
      names[index] = name;
      index++;
    });

    assert.deepEqual(names, ['buy eggs', 'warm oil', 'buy oil', 'shake eggs', 'fry omelette', 'eat omelette', 'prepare the table']);
  });

  QUnit.test('#addEdges check old API', function(assert){
    var graph = new DAG();
    var names = [];
    var index = 0;

    graph.addEdges('eat omelette', 1);
    graph.addEdges('buy eggs', 2) ;
    graph.addEdges('fry omelette', 3, 'eat omelette', 'shake eggs');
    graph.addEdges('shake eggs', 4, undefined, 'buy eggs');
    graph.addEdges('buy oil', 5, ['fry omelette', 'shake eggs', 'prepare the table'], ['warm oil']);
    graph.addEdges('prepare the table', 5, undefined, ['fry omelette']);

    graph.topsort(function(name, value){
      names[index] = name;
      index++;
    });

    assert.deepEqual(names, ['buy eggs', 'warm oil', 'buy oil', 'shake eggs', 'fry omelette', 'eat omelette', 'prepare the table']);
  });

}(typeof QUnit === 'undefined' ? require('qunitjs') : QUnit,
  typeof DAG === 'undefined' ? require('../dag-map.umd').default : DAG.default));
