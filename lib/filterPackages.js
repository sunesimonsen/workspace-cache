const { chose, filter } = require("@transformation/core");

const filterPackages = options =>
  chose(options.filter, {
    cached: filter(({ cacheDirExist }) => cacheDirExist),
    "not-cached": filter(({ cacheDirExist }) => !cacheDirExist),
  });

module.exports = filterPackages;
