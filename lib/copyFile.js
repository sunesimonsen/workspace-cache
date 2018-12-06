const fs = require("fs-extra");
const os = require("os");
const cpus = os.cpus().length;

const { fanOut, forEach, pipeline, tap } = require("@transformation/core");

const copyFile = () =>
  pipeline(
    fanOut(
      forEach(({ source, destination }) => fs.copy(source, destination)),
      cpus * 2
    ),
    tap(({ source, destination }) => `${source} => ${destination}`)
  );

module.exports = copyFile;
