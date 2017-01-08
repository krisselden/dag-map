export interface Callback<T> {
  (key: string, value: T | undefined): void;
}

export type MaybeStringOrArray = string | string[] | undefined;

/**
 * A topologically ordered map of key/value pairs with a simple API for adding constraints.
 *
 * Edges can forward reference keys that have not been added yet (the forward reference will
 * map the key to undefined).
 */
export default class DAG<T> {
  private _vertices = new Vertices<T>();

  /**
   * Adds a key/value pair with dependencies on other key/value pairs.
   *
   * @public
   * @param key    The key of the vertex to be added.
   * @param value  The value of that vertex.
   * @param before A key or array of keys of the vertices that must
   *               be visited before this vertex.
   * @param after  An string or array of strings with the keys of the
   *               vertices that must be after this vertex is visited.
   */
  public add(key: string, value: T | undefined, before?: MaybeStringOrArray, after?: MaybeStringOrArray) {
    if (!key) throw new Error('argument `key` is required');
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
   * @deprecated please use add.
   */
  public addEdges(key: string, value: T | undefined, before?: MaybeStringOrArray, after?: MaybeStringOrArray) {
    this.add(key, value, before, after);
  }

  /**
   * Visits key/value pairs in topological order.
   *
   * @public
   * @param callback The function to be invoked with each key/value.
   */
  public each(callback: Callback<T>) {
    this._vertices.walk(callback);
  }

  /**
   * @deprecated please use each.
   */
  public topsort(callback: Callback<T>) {
    this.each(callback);
  }
}


/** @private */
class Vertices<T> {
  [index: number]: Vertex<T>;
  length = 0;

  private stack: IntStack = new IntStack();
  private path: IntStack = new IntStack();
  private result: IntStack = new IntStack();

  public add(key: string): Vertex<T> {
    if (!key) throw new Error("missing key");
    let l = this.length | 0;
    let vertex: Vertex<T>;
    for (let i = 0; i < l; i++) {
      vertex = this[i];
      if (vertex.key === key) return vertex;
    }
    this.length = l + 1;
    return this[l] = {
      idx: l,
      key: key,
      val: undefined,
      out: false,
      flag: false,
      length: 0
    };
  }

  public addEdge(v: Vertex<T>, w: Vertex<T>): void {
    this.check(v, w.key);
    let l = w.length | 0;
    for (let i = 0; i < l; i++) {
      if (w[i] === v.idx) return;
    }
    w.length = l + 1;
    w[l] = v.idx;
    v.out = true;
  }

  public walk(cb: Callback<T>): void {
    this.reset();
    for (let i = 0; i < this.length; i++) {
      let vertex = this[i];
      if (vertex.out) continue;
      this.visit(vertex, "");
    }
    this.each(this.result, cb);
  }

  private check(v: Vertex<T>, w: string): void {
    if (v.key === w) {
      throw new Error("cycle detected: " + w + " <- " + w);
    }
    // quick check
    if (v.length === 0) return;
    // shallow check
    for (let i = 0; i < v.length; i++) {
      let key = this[v[i]].key;
      if (key === w) {
        throw new Error("cycle detected: " + w + " <- " + v.key + " <- " + w);
      }
    }
    // deep check
    this.reset();
    this.visit(v, w);
    if (this.path.length > 0) {
      let msg = "cycle detected: " + w;
      this.each(this.path, (key) => {
        msg += " <- " + key;
      });
      throw new Error(msg);
    }
  }

  private reset(): void {
    this.stack.length = 0;
    this.path.length = 0;
    this.result.length = 0;
    for (let i = 0, l = this.length; i < l; i++) {
      this[i].flag = false;
    }
  }

  private visit(start: Vertex<T>, search: string): void {
    let { stack, path, result } = this;
    stack.push(start.idx);
    while (stack.length) {
      let index = stack.pop() | 0;
      if (index >= 0) {
        // enter
        let vertex = this[index];
        if (vertex.flag) continue;
        vertex.flag = true;
        path.push(index);
        if (search === vertex.key) break;
        // push exit
        stack.push(~index);
        this.pushIncoming(vertex);
      } else {
        // exit
        path.pop();
        result.push(~index);
      }
    }
  }

  private pushIncoming(incomming: ArrayLike<number>): void {
    let { stack } = this;
    for (let i = incomming.length - 1; i >= 0; i--) {
      let index = incomming[i];
      if (!this[index].flag) {
        stack.push(index);
      }
    }
  }

  private each(indices: IntStack, cb: Callback<T>): void {
    for (let i = 0, l = indices.length; i < l; i++) {
      let vertex = this[indices[i]];
      cb(vertex.key, vertex.val);
    }
  }
}

/** @private */
interface Vertex<T> {
  idx: number;
  key: string;
  val: T | undefined;
  out: boolean;
  flag: boolean;
  [index: number]: number;
  length: number;
}

/** @private */
class IntStack {
  [index: number]: number;
  public length = 0;

  push(n: number) {
    this[this.length++] = n | 0;
  }

  pop() {
    return this[--this.length] | 0;
  }
}
