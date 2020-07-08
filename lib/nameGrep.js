const { filter } = require("@transformation/core");
const picomatch = require("picomatch");

const nameGrep = pattern => {
  if (!pattern) return false;

  const isMatch = picomatch(pattern);

  return filter(({ name }) => isMatch(name));
};

module.exports = nameGrep;
