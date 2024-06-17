const crypto = require("crypto");
const mem = require("mem");

const calculatePackageHash = mem((p, seen = new Set()) => {
  if (seen.has(p.name)) {
    throw new Error(`Circular dependencies involving ${p.name}`);
  }
  seen.add(p.name);
  const hash = crypto.createHash("sha256");
  hash.update(p.filesHash);
  for (const dependency of p.localDependencies) {
    const dependencyHash = calculatePackageHash(dependency);
    hash.update(dependencyHash);
  }
  return hash.digest("hex");
});

module.exports = calculatePackageHash;
