/* global testOutput */
const { forEach } = require("@transformation/core");

const testLog = (selector) => {
  if (typeof testOutput === "undefined") {
    return false;
  }

  return forEach((value) => {
    testOutput.push(selector(value));
  });
};

module.exports = testLog;
