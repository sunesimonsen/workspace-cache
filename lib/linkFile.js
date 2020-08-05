const fs = require("fs-extra");
const { parallel, forEach, pipeline } = require("@transformation/core");

const debug = require("./debug");

const linkFile = ({ cwd, concurrency }) =>
  pipeline(
    parallel(
      forEach(async ({ source, destination }) => {
        await fs.ensureSymlink(destination, source);
        const now = new Date();
        await fs.utimes(destination, now, now);
      }),
      concurrency
    ),
    debug(({ source, destination }) => `link: ${source} => ${destination}`)
  );

module.exports = linkFile;
