# dag-map [![Build Status](https://travis-ci.org/krisselden/dag-map.png?branch=master)](https://travis-ci.org/krisselden/dag-map)

An ordered map of key/value pairs and a simple API for adding contraints
(directed and acyclic) which provides a way of iterating key/value pairs
in topological order.

Used for ordering initializers in Ember.  Has a flexible constraint syntax
that can add before/after contraints that can forward reference things
yet to be added.

## API

```js
import DAG from 'dag-map';

let map = new DAG();

// map a key value pair
map.add('eat', 'Eat Dinner');
// add a key value pair with before and after constraints
map.add('serve', 'Serve the food', 'eat', 'set');
// keys can be added after a key has been referenced
map.add('set', 'Set the table');

// graph now is eat -> serve -> set

// constraints can be an array
map.add('cook', 'Cook the roast and veggies', 'serve', ['prep', 'buy']);

map.add('wash', 'Wash the veggies', 'prep', 'buy');
map.add('buy', 'Buy roast and veggies');
map.add('prep', 'Prep veggies', undefined, 'wash');

// log in order (multi valid spots for set the table).
map.topsort((key, val) => console.log(key, val));
// set Set the table
// buy Buy roast and veggies
// wash Wash the veggies
// prep Prep veggies
// cook Cook the roast and veggies
// serve Serve the food
// eat Eat Dinner
```

## Developing

* `npm install`
* `npm test` runs the tests headless
* `npm run build` rebuild
