const fs = require("fs-extra");
const path = require("path");
const { program, filter, forEach, tap } = require("@transformation/core");
const { glob } = require("@transformation/glob");

const day = 24 * 60 * 60 * 1000;

const clean = ({ cwd, dir, olderThan }) =>
  program(
    glob({
      cwd: dir,
      pattern: "*/*",
      absolute: true,
      onlyFiles: false,
    }),
    filter(async dir => {
      const stat = await fs.stat(dir);
      return stat.mtimeMs + olderThan * day < Date.now();
    }),
    forEach(dir => fs.remove(dir)),
    tap(dir => `Removed ${path.relative(cwd, dir)}`)
  );

module.exports = clean;
