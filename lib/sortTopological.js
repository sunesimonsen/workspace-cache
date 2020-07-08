const groupTopological = require("./groupTopological");

const { flatMap, pipeline } = require("@transformation/core");

const sortTopological = () =>
  pipeline(
    groupTopological(),
    flatMap(({ items }) => items)
  );

module.exports = sortTopological;
