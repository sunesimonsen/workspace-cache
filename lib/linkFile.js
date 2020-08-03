const fs = require("fs-extra");
const path = require("path");

const { parallel, forEach, pipeline, tap } = require("@transformation/core");

const linkFile = ({ cwd, concurrency }) =>
  pipeline(
    parallel(
      forEach(({ source, destination }) => fs.ensureLink(source, destination)),
      concurrency
    ),
    tap(
      ({ source, destination }) =>
        `link: ${path.relative(cwd, source)} => ${path.relative(
          cwd,
          destination
        )}`
    )
  );

module.exports = linkFile;
