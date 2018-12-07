import sourcemaps from "rollup-plugin-sourcemaps";
import buble from "rollup-plugin-buble";

export default {
  input: "dag-map.js",
  plugins: [sourcemaps(), buble()],
  output: [
    {
      file: "dag-map.umd.js",
      format: "umd",
      name: "DAG",
      moduleId: "dag-map",
      sourcemap: true,
      exports: "named" // required to be compatible with es2015 import
      // in typescript
    }
  ]
};
