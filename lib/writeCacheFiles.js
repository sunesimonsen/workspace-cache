const fs = require("fs-extra");
const path = require("path");
const copyFile = require("./copyFile");

const { flatMap, forEach, pipeline } = require("@transformation/core");

const writeCacheFiles = ({ cwd }) =>
  pipeline(
    forEach(({ cacheDir }) => fs.mkdir(cacheDir, { recursive: true })),
    flatMap(({ dir, packageDefinition, cacheDir }) =>
      packageDefinition.files.map(file => ({
        source: path.join(dir, file),
        destination: path.join(cacheDir, file),
      }))
    ),
    copyFile({ cwd })
  );

module.exports = writeCacheFiles;
