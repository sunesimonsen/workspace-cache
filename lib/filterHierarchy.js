const { filter, when } = require("@transformation/core");

const filterHierarchy = options =>
  when(
    options.hierarchy !== "all",
    filter(({ hierarchy }) => hierarchy === options.hierarchy)
  );

module.exports = filterHierarchy;
