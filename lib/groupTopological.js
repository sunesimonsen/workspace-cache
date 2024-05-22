const {
  filter,
  flatMap,
  groupBy,
  pipeline,
  sortBy,
  toArray,
} = require("@transformation/core");

const groupTopological = () =>
  pipeline(
    filter((p) => p.hierarchy === "root"),
    toArray(),
    flatMap((packages) => {
      let workQueue = packages;
      const seen = new Set();
      let level = 0;

      // Assign a topological level to each package
      while (workQueue.length > 0) {
        const newWork = [];

        for (const p of workQueue) {
          p.level = Math.max(level, p.level || 0);
          if (!seen.has(p)) {
            seen.add(p);

            for (const d of p.localDependencies) {
              newWork.push(d);
            }
          }
        }

        workQueue = newWork;
        level++;
      }

      return Array.from(seen);
    }),
    sortBy("level:desc"),
    groupBy(({ level }) => `level-${level}`)
  );

module.exports = groupTopological;
