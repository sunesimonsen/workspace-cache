const {
  flatMap,
  pipeline,
  sortBy,
  splitArray,
  toArray,
  transform,
} = require("@transformation/core");

const addLocalDependencies = () =>
  pipeline(
    toArray(),
    flatMap((packages) => {
      const packagesByName = {};
      for (const p of packages) {
        packagesByName[p.name] = { hierarchy: "root", ...p };
      }

      for (const p of packages) {
        const { dependencies = {}, devDependencies = {} } = p.packageDefinition;

        const allDependencies = [
          ...Object.keys(dependencies),
          ...Object.keys(devDependencies),
        ];

        const localDependencies = [];
        for (const dependencyName of allDependencies) {
          const dependency = packagesByName[dependencyName];
          if (dependency) {
            dependency.hierarchy = "shared";
            localDependencies.push(dependency);
          }
        }

        packagesByName[p.name].localDependencies = localDependencies;
      }

      return packages.map((p) => packagesByName[p.name]);
    }),
    transform({
      localDependencies: pipeline(splitArray(), sortBy("name"), toArray()),
    })
  );

module.exports = addLocalDependencies;
