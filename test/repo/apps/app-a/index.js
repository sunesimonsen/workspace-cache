const packageA = require("package-a");

module.exports = () => {
  console.log(`Hi I'm app-a using ${packageA()}`);
};
