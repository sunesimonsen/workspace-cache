const {
  pipeline,
  forEach,
  flatMap,
  parallel,
} = require("@transformation/core");

const supportsColor = require("supports-color");
const { exec } = require("child_process");
const chalk = require("chalk");
const util = require("util");
const execAsync = util.promisify(exec);
const spinner = require("./spinner");

const emphasized = text => chalk.cyan.bold(text);

const execute = ({ command, concurrency }) => {
  const env = supportsColor.stdout
    ? { ...process.env, FORCE_COLOR: supportsColor.stdout.level }
    : process.env;

  return pipeline(
    parallel(
      flatMap(async ({ name, dir }) => {
        const heading = `${name}: ${command}`;

        try {
          const { stdout, stderr } = await execAsync(command, {
            cwd: dir,
            env,
          });

          return [emphasized(heading), stdout, stderr].join("\n");
        } catch (e) {
          process.stderr.write(
            emphasized(`${heading} (${chalk.red("failed")})\n`)
          );
          process.stderr.write(e.message);
          process.stderr.write("\n");
          throw e;
        }
      }),
      concurrency
    ),
    spinner("Waiting for input"),
    forEach(message => {
      process.stdout.write(message);
    })
  );
};

module.exports = execute;
