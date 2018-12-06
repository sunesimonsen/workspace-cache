const fs = require("fs-extra");
const { program, filter, forEach, tap } = require("@transformation/core");
const { glob } = require("@transformation/glob");

const day = 24 * 60 * 60 * 1000;

const clean = ({ dir, olderThan }) =>
  program(
    glob({
      cwd: dir,
      pattern: "**",
      absolute: true,
      onlyFiles: true,
    }),
    filter(async fileName => {
      const stat = await fs.stat(fileName);
      return stat.mtimeMs + olderThan * day < Date.now();
    }),
    forEach(fileName => fs.unlink(fileName)),
    tap(fileName => `Removed ${fileName}`)
  );

module.exports = clean;
