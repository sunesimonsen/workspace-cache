const packageC = require("package-c");

module.exports = function() {
  return "package-a -> " + packageC();
};
