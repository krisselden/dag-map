export interface Callback<T> {
  (key: string, value: T | null): void;
}

/**
 * A map of key/value pairs with dependencies contraints that can be traversed
 * in topological order and is checked for cycles.
 *
 * @class DAG
 * @constructor
 */
export default class DAG<T> {
  private _vertices = new Vertices<T>();

  /**
   * Adds a key/value pair with dependencies on other key/value pairs.
   *
   * @public
   * @method add
   * @param {string[]}   key The key of the vertex to be added.
   * @param {any}      value The value of that vertex.
   * @param {string[]|string|undefined}  before A key or array of keys of the vertices that must
   *                                            be visited before this vertex.
   * @param {string[]|string|undefined}   after An string or array of strings with the keys of the
   *                                            vertices that must be after this vertex is visited.
   */
  public add(key: string, value: any,
                  before?: string | string[] | undefined,
                  after?: string | string[] | undefined) {
    let vertices = this._vertices;
    let v = vertices.add(key);
    v.val = value;
    if (before) {
      if (typeof before === "string") {
        vertices.addEdge(v, vertices.add(before));
      } else {
        for (let i = 0; i < before.length; i++) {
          vertices.addEdge(v, vertices.add(before[i]));
        }
      }
    }
    if (after) {
      if (typeof after === "string") {
        vertices.addEdge(vertices.add(after), v);
      } else {
        for (let i = 0; i < after.length; i++) {
          vertices.addEdge(vertices.add(after[i]), v);
        }
      }
    }
  }

  /**
   * Visits key/value pairs in topological order.
   *
   * @public
   * @method  topsort
   * @param {Function} fn The function to be invoked with each key/value.
   */
  public topsort(callback: Callback<T>) {
    this._vertices.topsort(callback);
  }
}

class Vertices<T> {
  private stack: IntStack = new IntStack();
  private result: IntStack = new IntStack();
  private vertices: Vertex<T>[] = [];

  public add(key: string): Vertex<T> {
    if (!key) throw new Error("missing key");
    let vertices = this.vertices;
    let i = 0;
    let vertex: Vertex<T>;
    for (; i < vertices.length; i++) {
      vertex = vertices[i];
      if (vertex.key === key) return vertex;
    }
    return vertices[i] = {
      id: i,
      key: key,
      val: null,
      inc: null,
      out: false,
      mark: false
    };
  }

  public addEdge(v: Vertex<T>, w: Vertex<T>): void {
    this.check(v, w.key);
    let { inc } = w;
    if (!inc) {
      w.inc = [ v.id ];
    } else {
      let i = 0;
      for (; i < inc.length; i++) {
        if (inc[i] === v.id) return;
      }
      inc[i] = v.id;
    }
    v.out = true;
  }

  public topsort(cb: Callback<T>): void {
    this.reset();
    let vertices = this.vertices;
    for (let i = 0; i < vertices.length; i++) {
      let vertex = vertices[i];
      if (vertex.out) continue;
      this.visit(vertex, undefined);
    }
    this.each(cb);
  }

  private check(v: Vertex<T>, w: string): void {
    if (v.key === w) {
      throw new Error("cycle detected: " + w + " <- " + w);
    }
    let inc = v.inc;
    // quick check
    if (!inc || inc.length === 0) return;
    let vertices = this.vertices;
    // shallow check
    for (let i = 0; i < inc.length; i++) {
      let key = vertices[inc[i]].key;
      if (key === w) {
        throw new Error("cycle detected: " + w + " <- " + v.key + " <- " + w);
      }
    }
    // deep check
    this.reset();
    this.visit(v, w);
    if (this.result.len > 0) {
      let msg = "cycle detected: " + w;
      this.each((key) => {
        msg += " <- " + key;
      });
      throw new Error(msg);
    }
  }

  private each(cb: Callback<T>): void {
    let { result, vertices } = this;
    for (let i = 0; i < result.len; i++) {
      let vertex = vertices[result.stack[i]];
      cb(vertex.key, vertex.val);
    }
  }

  // reuse between cycle check and topsort
  private reset(): void {
    this.stack.len = 0;
    this.result.len = 0;
    let vertices = this.vertices;
    for (let i = 0; i < vertices.length; i++) {
      vertices[i].mark = false;
    }
  }

  private visit(start: Vertex<T>, search: string | undefined): void {
    let { stack, result, vertices } = this;
    stack.push(start.id);
    while (stack.len) {
      let index = stack.pop();
      if (index < 0) { // pop frame
        index = ~index;
        if (search) {
          result.pop();
        } else {
          result.push(index);
        }
      } else { // push frame
        let vertex = vertices[index];
        if (vertex.mark) {
          continue;
        }
        if (search) {
          result.push(index);
          if (search === vertex.key) {
            return;
          }
        }
        vertex.mark = true;
        stack.push(~index);
        let incoming = vertex.inc;
        if (incoming) {
          let i = incoming.length;
          while (i--) {
            index = incoming[i];
            if (!vertices[index].mark) {
              stack.push(index);
            }
          }
        }
      }
    }
  }
}

interface Vertex<T> {
  id: number;
  key: string;
  val: T | null;
  inc: number[] | null;
  out: boolean;
  mark: boolean;
}

class IntStack {
  public stack = [0, 0, 0, 0, 0, 0];
  public len = 0;

  push(n: number) {
    this.stack[this.len++] = n;
  }

  pop() {
    return this.stack[--this.len];
  }
}
