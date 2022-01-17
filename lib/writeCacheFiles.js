const fs = require("fs-extra");
const path = require("path");
const copyFile = require("./copyFile");
const linkFile = require("./linkFile");
const hasha = require("hasha");

const {
  extend,
  flatMap,
  forEach,
  map,
  unless,
  pipeline,
  toArray,
  when,
} = require("@transformation/core");

const { globEach } = require("@transformation/glob");

const writeCacheFiles = ({ cwd, blobDir, concurrency }) =>
  pipeline(
    forEach(({ cacheDir }) => fs.mkdir(cacheDir, { recursive: true })),
    flatMap(({ dir, packageDefinition, cacheDir }) =>
      packageDefinition.files.map((file) => ({ dir, cacheDir, file }))
    ),
    extend({
      isDirectory: async ({ dir, file }) => {
        const stats = await fs.stat(path.join(dir, file));
        return stats.isDirectory();
      },
    }),
    when(
      ({ isDirectory }) => isDirectory,
      extend({
        files: pipeline(
          map(({ dir, file }) => ({ cwd: dir, pattern: `${file}/**/*` })),
          globEach(),
          toArray()
        ),
      }),
      flatMap(({ files, dir, cacheDir }) =>
        files.map((file) => ({
          file,
          dir,
          cacheDir,
        }))
      )
    ),
    map(({ file, dir, cacheDir }) => ({
      source: path.join(dir, file),
      link: path.join(cacheDir, file),
      cacheDir,
    })),
    extend({
      destination: map(async ({ source }) =>
        path.join(
          blobDir,
          await hasha.fromFile(source, { algorithm: "sha256" })
        )
      ),
    }),
    extend({
      blobExists: ({ destination }) => fs.pathExists(destination),
    }),
    unless(({ blobExists }) => blobExists, copyFile({ cwd, concurrency })),
    map(({ link, destination, cacheDir }) => ({
      source: link,
      destination,
    })),
    linkFile({ cwd, concurrency })
  );

module.exports = writeCacheFiles;
