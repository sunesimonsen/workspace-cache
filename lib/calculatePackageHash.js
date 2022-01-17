const crypto = require("crypto");
const mem = require("mem");

const calculatePackageHash = mem((p) => {
  const hash = crypto.createHash("sha256");
  hash.update(p.filesHash);
  for (const dependency of p.localDependencies) {
    const dependencyHash = calculatePackageHash(dependency);
    hash.update(dependencyHash);
  }
  return hash.digest("hex");
});

module.exports = calculatePackageHash;
