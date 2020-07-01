var packageA = require("package-a");

module.exports = function () {
  console.log(("Hi I'm app-a using " + (packageA())));
};

