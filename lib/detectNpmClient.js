const fs = require("fs-extra");
const path = require("path");

const detectNpmClient = async cwd => {
  try {
    const stats = await fs.stat(path.join(cwd, "yarn.lock"));
    if (stats.isFile()) {
      return "yarn";
    }
  } catch (e) {
    // ignore
  }

  return "npm";
};

module.exports = detectNpmClient;
