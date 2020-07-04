const { filter, pipeline } = require("@transformation/core");
const chalk = require("chalk");
const execute = require("./execute");

const emphasized = text => chalk.cyan.bold(text);

const runTarget = ({ npmClient, args, concurrency }) => {
  const target = args[0];

  return pipeline(
    filter(({ name, packageDefinition }) => {
      const hasTarget =
        packageDefinition.scripts && packageDefinition.scripts[target];

      if (!hasTarget) {
        process.stderr.write(
          emphasized(
            emphasized(`${name}: ${npmClient} ${args.join(" ")} (skip)\n`)
          )
        );
      }

      return hasTarget;
    }),
    execute({ command: "yarn", args, concurrency })
  );
};

module.exports = runTarget;
