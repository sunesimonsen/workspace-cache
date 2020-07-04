const {
  Group,
  filter,
  flatMap,
  pipeline,
  toArray,
} = require("@transformation/core");

const groupTopological = () =>
  pipeline(
    filter(p => p.hierarchy === "root"),
    toArray(),
    flatMap(packages => {
      const levels = [];
      let workQueue = packages;
      const seen = new Set();
      let order = 0;
      let level = 0;

      while (workQueue.length > 0) {
        const newWork = [];

        const nextLevel = [];
        for (const p of workQueue) {
          if (!seen.has(p)) {
            seen.add(p);
            nextLevel.push(p);

            for (const d of p.localDependencies) {
              newWork.push(d);
            }
          }
        }

        nextLevel.sort((a, b) => {
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;
          return 0;
        });

        for (const p of nextLevel) {
          p.order = order++;
          p.level = level;
        }

        levels.push(nextLevel);
        workQueue = newWork;
        level++;
      }

      return levels
        .map((level, i) => Group.create({ key: `level-${i}`, items: level }))
        .reverse();
    })
  );

module.exports = groupTopological;
