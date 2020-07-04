const { flatMap } = require("@transformation/core");
const fs = require("fs-extra");
const path = require("path");

const detectWorkspacePackages = () =>
  flatMap(async rootDir => {
    try {
      const packageDefinition = require(path.join(rootDir, "package.json"));

      if (Array.isArray(packageDefinition.workspaces.packages)) {
        return packageDefinition.workspaces.packages;
      }
    } catch (e) {
      // ignore
    }

    try {
      const lernaJson = JSON.parse(
        await fs.readFile(path.join(rootDir, "lerna.json"))
      );

      if (Array.isArray(lernaJson.packages)) {
        return lernaJson.packages;
      }
    } catch (e) {
      // ignore
    }

    try {
      const stats = await fs.stat("packages");
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
