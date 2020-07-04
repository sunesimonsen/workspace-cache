const fs = require("fs-extra");

const detectNpmClient = async cwd => {
  try {
    const stats = await fs.stat("yarn.lock");
    if (stats.isFile()) {
      return "yarn";
    }
  } catch (e) {
    // ignore
  }

  return "npm";
};

module.exports = detectNpmClient;
