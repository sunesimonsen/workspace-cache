const fs = require("fs-extra");
const path = require("path");

const {
  forEach,
  map,
  parallel,
  pipeline,
  tap,
} = require("@transformation/core");

const writeTimestamps = ({ cwd, concurrency }) =>
  pipeline(
    forEach(({ cacheDir }) => fs.mkdir(cacheDir, { recursive: true })),
    map(({ cacheDir }) => ({
      content: new Date().toUTCString(),
      destination: path.join(cacheDir, "timestamp.txt"),
    })),
    parallel(
      forEach(({ content, destination }) =>
        fs.writeFile(destination, content, "utf8")
      ),
      concurrency
    ),
    tap(
      ({ content, destination }) =>
        `"${content}" => ${path.relative(cwd, destination)}`
    )
  );

module.exports = writeTimestamps;
