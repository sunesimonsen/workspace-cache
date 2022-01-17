const { chose, filter, pipeline, when } = require("@transformation/core");
const nameGrep = require("./nameGrep");

const filterPackages = (options) =>
  pipeline(
    nameGrep(options.grep),
    when(
      options.hierarchy !== "all",
      filter(({ hierarchy }) => hierarchy === options.hierarchy)
    ),
    chose(options.filter, {
      cached: filter(({ cacheDirExist }) => cacheDirExist),
      "not-cached": filter(({ cacheDirExist }) => !cacheDirExist),
    })
  );

module.exports = filterPackages;
