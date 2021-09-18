const {
  pipeline,
  forEach,
  flatMap,
  parallel,
} = require("@transformation/core");

const supportsColor = require("supports-color");
const { exec } = require("child_process");
const chalk = require("chalk");
const spinner = require("./spinner");

const emphasized = (text) => chalk.cyan.bold(text);

const executeCommand = (command, options) =>
  new Promise((resolve, reject) => {
    const cp = exec(command, options);
    let output = "";

    const dataHandler = (data) => {
      output += data;
    };

    cp.stdout.on("data", dataHandler);
    cp.stderr.on("data", dataHandler);

    const exitHandler = (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(
          new Error(`${command} failed with exit code ${code}\n${output}`)
        );
      }
    };

    cp.on("close", exitHandler);
    cp.on("exit", exitHandler);
    cp.on(
      "error",
      (err) =>
        new Error(`${command} failed with error ${err.message}\n${output}`)
    );
  });

const execute = ({ command, concurrency }) => {
  const env = supportsColor.stdout
    ? { ...process.env, FORCE_COLOR: supportsColor.stdout.level }
    : process.env;

  return pipeline(
    parallel(
      flatMap(async ({ name, dir }) => {
        const heading = `${name}: ${command}`;

        try {
          const output = await executeCommand(command, {
            cwd: dir,
            env,
          });

          return [emphasized(heading), output].join("\n");
        } catch (e) {
          throw new Error(
            emphasized(`${heading} (${chalk.red("failed")})\n`) +
              "\n" +
              e.message
          );
        }
      }),
      concurrency
    ),
    spinner("Waiting for input"),
    forEach((message) => {
      process.stdout.write(message);
    })
  );
};

module.exports = execute;
