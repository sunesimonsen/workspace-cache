const fs = require("fs-extra");
const path = require("path");
const copyFile = require("./copyFile");

const {
  parallel,
  filter,
  flatMap,
  forEach,
  pipeline,
} = require("@transformation/core");

const readCacheFiles = ({ cwd, concurrency }) =>
  pipeline(
    flatMap(({ dir, packageDefinition, cacheDir }) =>
      packageDefinition.files.map((file) => ({
        source: path.join(cacheDir, file),
        destination: path.join(dir, file),
      }))
    ),
    parallel(
      forEach(({ destination }) => fs.remove(destination)),
      concurrency
    ),
    filter(({ source }) => fs.existsSync(source)),
    copyFile({ cwd, concurrency })
  );

module.exports = readCacheFiles;
