var packageC = require("package-c");

module.exports = function () { return ("package-b -> " + (packageC())); };

