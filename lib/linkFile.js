const fs = require("fs-extra");
const path = require("path");

const { parallel, forEach, pipeline, tap } = require("@transformation/core");

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
    tap(
      ({ source, destination }) =>
        `link: ${path.relative(cwd, source)} => ${path.relative(
          cwd,
          destination
        )}`
    )
  );

module.exports = linkFile;
