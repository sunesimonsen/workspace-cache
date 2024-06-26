const fs = require("fs-extra");
const path = require("path");
const hasha = require("hasha");
const detectWorkspacePackages = require("./detectWorkspacePackages");
const detectNpmClient = require("./detectNpmClient");
const sortTopological = require("./sortTopological");
const hasher = require("./hasher");
const calculatePackageHash = require("./calculatePackageHash");
const addLocalDependencies = require("./addLocalDependencies");
const isEmptyDir = require("./isEmptyDir");
const writeCacheFiles = require("./writeCacheFiles");
const writeTimestamps = require("./writeTimestamps");
const readCacheFiles = require("./readCacheFiles");
const clean = require("./clean");
const deleteEmpty = require("delete-empty");
const filterPackages = require("./filterPackages");
const includeDependencies = require("./includeDependencies");
const filterPackagesWithScript = require("./filterPackagesWithScript");
const execute = require("./execute");
const debug = require("./debug");
const jsonOutput = require("./jsonOutput");

const {
  chose,
  emitItems,
  extend,
  map,
  parallel,
  partitionBy,
  pipeline,
  program,
  sort,
  sortBy,
  tap,
  when,
  withGroup,
} = require("@transformation/core");

const { globEach } = require("@transformation/glob");

const main = async (cwd, cache, command, args, options) => {
  const environment = process.env.NODE_ENV || "development";
  const cacheDir = path.join(cache, environment);
  const blobDir = path.join(cache, "blobs");
  const concurrency = options.concurrency;
  const npmClient = await detectNpmClient(cwd);

  if (command === "clean") {
    await clean({
      cwd,
      dir: cacheDir,
      pattern: "*/*",
      olderThan: options.olderThan,
    });

    await clean({
      cwd,
      dir: blobDir,
      pattern: "*",
      olderThan: options.olderThan,
    });

    await deleteEmpty(cache);
  } else {
    await program(
      emitItems(cwd),
      detectWorkspacePackages(),
      map((packagePath) => ({ pattern: `${packagePath}/package.json` })),
      globEach({ cwd, absolute: true }),
      map((packageJsonPath) => ({
        path: packageJsonPath,
        dir: path.dirname(packageJsonPath),
      })),
      extend({
        packageDefinition: map(async (p) =>
          JSON.parse(await fs.readFile(p.path))
        ),
        filesHash: pipeline(
          map(({ dir }) => ({ cwd: dir })),
          globEach({ pattern: "**", gitignore: true, absolute: true }),
          parallel(
            map((file) => hasha.fromFile(file, { algorithm: "md5" })),
            concurrency
          ),
          sort(),
          hasher()
        ),
      }),
      extend({
        name: map((p) => p.packageDefinition.name),
        hasFiles: map((p) =>
          Boolean(
            p.packageDefinition.files && p.packageDefinition.files.length > 0
          )
        ),
      }),
      addLocalDependencies(),
      sortTopological(),
      extend({ hash: map((p) => calculatePackageHash(p)) }),
      extend({
        cacheDir: map((p) => path.join(cacheDir, p.name, p.hash)),
      }),
      parallel(
        extend({
          cacheDirExist: map(
            async (p) =>
              (await fs.pathExists(p.cacheDir)) &&
              !(await isEmptyDir(p.cacheDir))
          ),
        }),
        concurrency
      ),
      chose(command, {
        list: pipeline(
          filterPackages(options),
          when(options.includeDeps, includeDependencies()),
          sortBy("level:desc", "name:desc"),
          chose(Boolean(options.json), {
            true: jsonOutput({ cwd }),
            false: tap(({ name }) => name),
          })
        ),
        run: pipeline(
          filterPackages(options),
          when(options.includeDeps, includeDependencies()),
          chose(Boolean(options.ordered), {
            true: pipeline(
              filterPackagesWithScript(args[0]),
              sortBy("level:desc", "name"),
              partitionBy("level"),
              withGroup(
                execute({
                  command: `${npmClient} run ${args.join(" ")}`,
                  concurrency,
                })
              )
            ),
            false: pipeline(
              filterPackagesWithScript(args[0]),
              sortBy("level:desc", "name"),
              execute({
                command: `${npmClient} run ${args.join(" ")}`,
                concurrency,
              })
            ),
          })
        ),
        exec: pipeline(
          filterPackages(options),
          when(options.includeDeps, includeDependencies()),
          chose(Boolean(options.ordered), {
            true: pipeline(
              sortBy("level:desc", "name"),
              partitionBy("level"),
              withGroup(execute({ command: args.join(" "), concurrency }))
            ),
            false: pipeline(
              sortBy("level:desc", "name"),
              execute({ command: args.join(" "), concurrency })
            ),
          })
        ),
        read: pipeline(
          chose(({ cacheDirExist, hasFiles }) => cacheDirExist && hasFiles, {
            true: readCacheFiles({ cwd, concurrency }),
            false: debug(({ cacheDir }) => `Read: ${cacheDir} doesn't exist`),
          })
        ),
        write: chose(({ hasFiles }) => hasFiles, {
          true: writeCacheFiles({ cwd, blobDir, concurrency }),
          false: writeTimestamps({ cwd, concurrency }),
        }),
      })
    );
  }
};

module.exports = {
  main,
};
