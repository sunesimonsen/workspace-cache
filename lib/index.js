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
  withGroup,
  when,
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
      dir: cache,
      olderThan: options.olderThan,
    });

    await deleteEmpty(cache);
  } else {
    await program(
      emitItems(cwd),
      detectWorkspacePackages(),
      map(packagePath => ({ pattern: `${packagePath}/package.json` })),
      globEach({ cwd, absolute: true }),
      map(packageJsonPath => ({
        path: packageJsonPath,
        dir: path.dirname(packageJsonPath),
      })),
      extend({
        packageDefinition: map(async p =>
          JSON.parse(await fs.readFile(p.path))
        ),
        filesHash: pipeline(
          map(({ dir }) => ({ cwd: dir })),
          globEach({ pattern: "**", gitignore: true, absolute: true }),
          parallel(
            map(file => hasha.fromFile(file, { algorithm: "md5" })),
            concurrency
          ),
          sort(),
          hasher()
        ),
      }),
      extend({
        name: map(p => p.packageDefinition.name),
        hasFiles: map(p =>
          Boolean(
            p.packageDefinition.files && p.packageDefinition.files.length > 0
          )
        ),
      }),
      addLocalDependencies(),
      sortTopological(),
      extend({ hash: map(calculatePackageHash) }),
      extend({
        cacheDir: map(p => path.join(cacheDir, p.name, p.hash)),
      }),
      parallel(
        extend({
          cacheDirExist: map(
            async p =>
              (await fs.pathExists(p.cacheDir)) &&
              !(await isEmptyDir(p.cacheDir))
          ),
        }),
        concurrency
      ),
      sortBy("order:desc"),
      chose(command, {
        list: pipeline(
          filterPackages(options),
          tap(({ name }) => name)
        ),
        run: pipeline(
          filterPackages(options),
          chose(options.includeDeps ? "includeDeps" : "normal", {
            includeDeps: pipeline(
              includeDependencies(),
              filterPackagesWithScript(args[0]),
              sortBy("level:desc"),
              partitionBy("level"),
              withGroup(
                execute({
                  command: `${npmClient} run ${args.join(" ")}`,
                  concurrency,
                })
              )
            ),
            normal: pipeline(
              filterPackagesWithScript(args[0]),
              execute({
                command: `${npmClient} run ${args.join(" ")}`,
                concurrency,
              })
            ),
          })
        ),
        exec: pipeline(
          filterPackages(options),
          chose(options.includeDeps ? "includeDeps" : "normal", {
            includeDeps: pipeline(
              includeDependencies(),
              sortBy("level:desc"),
              partitionBy("level"),
              withGroup(execute({ command: args.join(" "), concurrency }))
            ),
            normal: execute({ command: args.join(" "), concurrency }),
          })
        ),
        read: pipeline(
          when(
            p => p.cacheDirExist && p.hasFiles,
            readCacheFiles({ cwd, concurrency })
          )
        ),
        write: pipeline(
          when(
            p => !p.cacheDirExist,
            chose(({ hasFiles }) => hasFiles, {
              true: writeCacheFiles({ cwd, blobDir, concurrency }),
              false: writeTimestamps({ cwd, concurrency }),
            })
          )
        ),
      })
    );
  }
};

module.exports = {
  main,
};
