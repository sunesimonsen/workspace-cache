const packageB = require("package-b");

module.exports = () => {
  console.log(`Hi I'm app-b using ${packageB()}`);
};
