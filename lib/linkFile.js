const fs = require("fs-extra");
const path = require("path");
const { parallel, forEach, pipeline } = require("@transformation/core");

const debug = require("./debug");
const testLog = require("./testLog");

const linkFile = ({ cwd, concurrency }) =>
  pipeline(
    testLog(
      ({ source, destination }) =>
        `link: ${path.relative(cwd, source)} => ${path.relative(
          cwd,
          destination
        )}`
    ),
    debug(({ source, destination }) => `link: ${source} => ${destination}`),
    parallel(
      forEach(async ({ source, destination }) => {
        await fs.ensureSymlink(
          path.relative(path.dirname(source), destination),
          source
        );
        const now = new Date();
        await fs.utimes(destination, now, now);
      }),
      concurrency
    )
  );

module.exports = linkFile;
