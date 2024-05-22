const { pipeline, flatMap, toArray } = require("@transformation/core");

const includeDependencies = () =>
  pipeline(
    toArray(),
    flatMap((packages) => {
      const withDependencies = [];
      const seen = new Set();
      let workQuery = packages;
      while (workQuery.length > 0) {
        const newWork = [];
        for (const p of workQuery) {
          if (!seen.has(p.name)) {
            seen.add(p.name);
            withDependencies.push(p);
            newWork.push(...p.localDependencies);
          }
        }
        workQuery = newWork;
      }
      return withDependencies;
    })
  );

module.exports = includeDependencies;
