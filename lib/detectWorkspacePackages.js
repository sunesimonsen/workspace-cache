const { flatMap } = require("@transformation/core");
const util = require("util");
const fs = require("fs");
const path = require("path");
const readFileAsync = util.promisify(fs.readFile);
const statAsync = util.promisify(fs.stat);

const detectWorkspacePackages = () =>
  flatMap(async rootDir => {
    try {
      const packageDefinition = JSON.parse(
        await readFileAsync(path.join(rootDir, "package.json"))
      );

      if (Array.isArray(packageDefinition.workspaces.packages)) {
        return packageDefinition.workspaces.packages;
      }
    } catch (e) {
      // ignore
    }

    try {
      const lernaJson = JSON.parse(
        await readFileAsync(path.join(rootDir, "lerna.json"))
      );

      if (Array.isArray(lernaJson.packages)) {
        return lernaJson.packages;
      }
    } catch (e) {
      // ignore
    }

    try {
      const stats = await statAsync("packages");
      if (stats.isDirectory()) {
        return ["packages/*"];
      }
    } catch (e) {
      // ignore
    }

    throw new Error(
      `Directory ${rootDir} doesn't include a workspace definition.`
    );
  });

module.exports = detectWorkspacePackages;
