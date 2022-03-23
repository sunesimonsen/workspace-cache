const fs = require("fs").promises;
const path = require("path");
const { parallel, forEach, pipeline } = require("@transformation/core");

const debug = require("./debug");
const testLog = require("./testLog");

const touch = (fieldOrSelector, { cwd, concurrency }) => {
  const selector =
    typeof fieldOrSelector === "string"
      ? (value) => value[fieldOrSelector]
      : fieldOrSelector;

  const now = new Date();

  return pipeline(
    parallel(
      forEach((item) => fs.utimes(selector(item), now, now)),
      concurrency
    ),
    testLog((item) => `touch: ${path.relative(cwd, selector(item))}`),
    debug((item) => `touch: ${selector(item)}`)
  );
};

module.exports = touch;
