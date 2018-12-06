const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const cpus = os.cpus().length;

const { fanOut, map, forEach, pipeline, tap } = require("@transformation/core");

const writeTimestamps = () =>
  pipeline(
    forEach(({ cacheDir }) => fs.mkdir(cacheDir, { recursive: true })),
    map(({ cacheDir }) => ({
      content: new Date().toUTCString(),
      destination: path.join(cacheDir, "timestamp.txt"),
    })),
    fanOut(
      forEach(({ content, destination }) =>
        fs.writeFile(destination, content, "utf8")
      ),
      cpus * 2
    ),
    tap(({ content, destination }) => `"${content}" => ${destination}`)
  );

module.exports = writeTimestamps;
