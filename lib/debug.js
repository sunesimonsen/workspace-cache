const log = require("debug")("workspace-cache");
const { forEach } = require("@transformation/core");

const debug = fieldOrSelector => {
  const selector =
    typeof fieldOrSelector === "string"
      ? value => value[fieldOrSelector]
      : fieldOrSelector;

  return forEach(value => {
    if (selector) {
      log(selector(value));
    } else {
      log(value);
    }
  });
};

module.exports = debug;
