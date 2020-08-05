const fs = require("fs-extra");
const { parallel, forEach, pipeline } = require("@transformation/core");

const debug = require("./debug");

const copyFile = ({ cwd, concurrency }) =>
  pipeline(
    parallel(
      forEach(({ source, destination }) =>
        fs.copy(source, destination, { dereference: true })
      ),
      concurrency
    ),
    debug(({ source, destination }) => `copy: ${source} => ${destination}`)
  );

module.exports = copyFile;
