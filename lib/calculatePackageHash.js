const crypto = require("crypto");
const mem = require("mem");

const findCircularDependencyLoop = (p, seen = new Set(), path = []) => {
  if (seen.has(p.name)) {
    path.push(p.name);
    throw new Error(`Circular dependencies: ${path.join(" -> ")}`);
  }
  seen.add(p.name);
  for (const dependency of p.localDependencies) {
    findCircularDependencyLoop(dependency, seen, [...path, p.name]);
  }
};

const calculatePackageHash = mem((p, seen = new Set()) => {
  if (seen.has(p.name)) {
    findCircularDependencyLoop(p);
  }
  seen.add(p.name);
  const hash = crypto.createHash("sha256");
  hash.update(p.filesHash);
  for (const dependency of p.localDependencies) {
    const dependencyHash = calculatePackageHash(dependency, seen);
    hash.update(dependencyHash);
  }
  return hash.digest("hex");
});

module.exports = calculatePackageHash;
