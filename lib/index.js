const fs = require("fs-extra");
const path = require("path");
const md5File = require("md5-file/promise");
const detectWorkspacePackages = require("./detectWorkspacePackages");
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
const filterHierarchy = require("./filterHierarchy");

const {
  chose,
  emitItems,
  extend,
  map,
  parallel,
  pipeline,
  program,
  sort,
  sortBy,
  tap,
  when,
} = require("@transformation/core");

const { globEach } = require("@transformation/glob");

const main = async (cwd, command, args, options) => {
  const environment = process.env.NODE_ENV || "development";
  const cacheDir = path.join(args[0], environment);
  const concurrency = options.concurrency;

  if (command === "clean") {
    await clean({
      cwd,
      dir: cacheDir,
      olderThan: options.olderThan,
    });

    await deleteEmpty(cacheDir);
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
          parallel(map(md5File), concurrency),
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
      sortBy("order"),
      chose(command, {
        list: pipeline(
          filterHierarchy(options),
          filterPackages(options),
          tap(({ name }) => name)
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
              true: writeCacheFiles({ cwd, concurrency }),
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
