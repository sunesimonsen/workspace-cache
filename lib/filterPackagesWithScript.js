const { filter } = require("@transformation/core");

const filterPackagesWithScript = script =>
  filter(
    ({ packageDefinition }) =>
      packageDefinition.scripts && packageDefinition.scripts[script]
  );

module.exports = filterPackagesWithScript;
