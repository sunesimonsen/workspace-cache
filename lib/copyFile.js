const fs = require("fs-extra");
const path = require("path");
const { parallel, forEach, pipeline } = require("@transformation/core");

const debug = require("./debug");
const testLog = require("./testLog");

const copyFile = ({ cwd, concurrency }) =>
  pipeline(
    testLog(
      ({ source, destination }) =>
        `copy: ${path.relative(cwd, source)} => ${path.relative(
          cwd,
          destination
        )}`
    ),
    debug(({ source, destination }) => `copy: ${source} => ${destination}`),
    parallel(
      forEach(({ source, destination }) =>
        fs.copy(source, destination, { dereference: true })
      ),
      concurrency
    )
  );

module.exports = copyFile;
