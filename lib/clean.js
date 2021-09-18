const fs = require("fs-extra");
const path = require("path");
const { program, filter, forEach } = require("@transformation/core");
const { glob } = require("@transformation/glob");
const debug = require("./debug");
const testLog = require("./testLog");

const day = 24 * 60 * 60 * 1000;

const clean = ({ cwd, pattern, dir, olderThan }) =>
  program(
    glob({
      cwd: dir,
      pattern,
      absolute: true,
      onlyFiles: false,
    }),
    filter(async (dir) => {
      const stat = await fs.stat(dir);
      return stat.mtimeMs + olderThan * day < Date.now();
    }),
    forEach((dir) => fs.remove(dir)),
    testLog((dir) => `Removed ${path.relative(cwd, dir)}`),
    debug((dir) => `Removed ${dir}`)
  );

module.exports = clean;
