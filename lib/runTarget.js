const {
  pipeline,
  forEach,
  flatMap,
  parallel,
} = require("@transformation/core");
const { execFile } = require("child_process");
const chalk = require("chalk");
const util = require("util");
const execFileAsync = util.promisify(execFile);
const spinner = require("./spinner");

const emphasized = text => chalk.cyan.bold(text);

const runTarget = ({ npmClient, args, concurrency }) =>
  pipeline(
    parallel(
      flatMap(async ({ name, packageDefinition, dir }) => {
        const target = args[0];
        const heading = `${name}: ${npmClient} ${args.join(" ")}`;

        if (packageDefinition.scripts && packageDefinition.scripts[target]) {
          try {
            const { stdout, stderr } = await execFileAsync(npmClient, args, {
              cwd: dir,
              env: { FORCE_COLOR: "true", ...process.env },
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
        } else {
          return [emphasized(`${heading} (skip)\n`)];
        }
      }),
      concurrency
    ),
    spinner("Waiting for input"),
    forEach(message => {
      process.stdout.write(message);
    })
  );

module.exports = runTarget;
