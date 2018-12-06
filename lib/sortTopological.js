const topologicalOrder = require("./topologicalOrder");

const {
  filter,
  flatMap,
  pipeline,
  sortBy,
  toArray,
} = require("@transformation/core");

const sortTopological = () =>
  pipeline(
    filter(p => p.hierarchy === "root"),
    sortBy("name"),
    toArray(),
    flatMap(packages => topologicalOrder(packages))
  );

module.exports = sortTopological;
