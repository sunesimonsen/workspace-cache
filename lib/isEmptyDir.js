const fs = require("fs-extra");
const path = require("path");

const isEmptyDir = async dirPath => {
  for (const dirent of await fs.readdir(dirPath, { withFileTypes: true })) {
    if (
      dirent.isSymbolicLink() ||
      dirent.isFile() ||
      (dirent.isDirectory() &&
        !(await isEmptyDir(path.join(dirPath, dirent.name))))
    ) {
      return false;
    }
  }

  return true;
};

module.exports = isEmptyDir;
