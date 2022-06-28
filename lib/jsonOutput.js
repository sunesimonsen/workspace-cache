const path = require("path");
const includeDependencies = require("./includeDependencies");

const {
  extend,
  map,
  pipeline,
  sortBy,
  tap,
  toArray,
} = require("@transformation/core");

module.exports = ({ cwd }) =>
  pipeline(
    extend({
      dependencies: pipeline(
        includeDependencies(),
        sortBy("order:desc"),
        map(({ name, path: pathName }) => ({
          name,
          path: path.relative(cwd, pathName),
        })),
        toArray()
      ),
    }),
    map(({ name, dependencies, ...rest }) => ({
      name,
      dependencies: dependencies.filter((p) => p.name !== name),
      ...rest,
    })),
    tap(({ name, path: pathName, dependencies }) =>
      JSON.stringify({
        name,
        path: path.relative(cwd, pathName),
        dependencies,
      })
    )
  );
