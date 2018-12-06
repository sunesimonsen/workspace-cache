const fs = require("fs-extra");
const path = require("path");
const copyFile = require("./copyFile");
const os = require("os");
const cpus = os.cpus().length;

const { fanOut, flatMap, forEach, pipeline } = require("@transformation/core");

const readCacheFiles = () =>
  pipeline(
    flatMap(({ dir, packageDefinition, cacheDir }) =>
      packageDefinition.files.map(file => ({
        source: path.join(cacheDir, file),
        destination: path.join(dir, file),
      }))
    ),
    fanOut(
      forEach(({ destination }) => fs.remove(destination)),
      2 * cpus
    ),
    copyFile()
  );

module.exports = readCacheFiles;
