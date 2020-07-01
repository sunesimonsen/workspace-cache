var packageB = require("package-b");

module.exports = function () {
  console.log(("Hi I'm app-b using " + (packageB())));
};

