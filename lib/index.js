const fs = require("fs-extra");
const path = require("path");
const os = require("os");
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

const {
  chose,
  emitItems,
  extend,
  fanOut,
  filter,
  map,
  pipeline,
  program,
  sort,
  tap,
  when,
} = require("@transformation/core");

const { globEach } = require("@transformation/glob");

const cpus = os.cpus().length;

const main = async (cwd, command, args, options) => {
  const environment = process.env.NODE_ENV || "development";
  const cacheDir = path.join(args[0], environment);

  if (command === "clean") {
    await clean({
      dir: cacheDir,
      olderThan: options.olderThan,
    });

    await deleteEmpty(cacheDir);
  } else {
    await program(
      emitItems(cwd),
      detectWorkspacePackages(),
      map(packagePath => ({ pattern: `${packagePath}/package.json` })),
      globEach(),
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
          fanOut(map(md5File), cpus * 2),
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
      fanOut(
        extend({
          cacheDirExist: map(
            async p =>
              (await fs.pathExists(p.cacheDir)) &&
              !(await isEmptyDir(p.cacheDir))
          ),
        }),
        2 * cpus
      ),
      chose(command, {
        list: pipeline(
          when(
            options.hierarchy !== "all",
            filter(({ hierarchy }) => options.hierarchy === hierarchy)
          ),
          chose(options.filter, {
            cached: filter(({ cacheDirExist }) => cacheDirExist),
            "not-cached": filter(({ cacheDirExist }) => !cacheDirExist),
          }),
          tap(({ name }) => name)
        ),
        read: pipeline(
          when(p => p.cacheDirExist && p.hasFiles, readCacheFiles())
        ),
        write: pipeline(
          when(
            p => !p.cacheDirExist,
            chose(({ hasFiles }) => hasFiles, {
              true: writeCacheFiles(),
              false: writeTimestamps(),
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
