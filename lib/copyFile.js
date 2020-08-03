const fs = require("fs-extra");
const path = require("path");

const { parallel, forEach, pipeline, tap } = require("@transformation/core");

const copyFile = ({ cwd, concurrency }) =>
  pipeline(
    parallel(
      forEach(({ source, destination }) =>
        fs.copy(source, destination, { dereference: true })
      ),
      concurrency
    ),
    tap(
      ({ source, destination }) =>
        `copy: ${path.relative(cwd, source)} => ${path.relative(
          cwd,
          destination
        )}`
    )
  );

module.exports = copyFile;
