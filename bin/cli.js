#!/usr/bin/env node
const meow = require("meow");
const { main } = require("..");
const os = require("os");
const cpus = os.cpus().length;
const path = require("path");

const cli = meow(`
Usage

  $ workspace-cache <command> [flags]

Flags

  --concurrency       how many threads to use, defaults to 2 * CPU's

  --cache             the cache directory, defaults to .workspace-cache

Commands

  list                list the packages in dependency order

    --filter          all: (default) all packages
                      not-cached: all packages that is not cached for the current version
                      cached: all packages that is cached for the current version

    --hierarchy       all: (default) don't filter based on hierarchy
                      shared: only shared packages
                      root: only root packages

    --grep            only packages which name matches the given glob pattern

    --include-deps    include the dependencies for all of the matching packages

  run <script>        run a npm script in each packages that contains that script

    --filter          all: (default) all packages
                      not-cached: all packages that is not cached for the current version
                      cached: all packages that is cached for the current version

    --hierarchy       all: (default) don't filter based on hierarchy
                      shared: only shared packages
                      root: only root packages

    --grep            only packages which name matches the given glob pattern

    --include-deps    runs scripts on all dependencies before the filtered packages

    --ordered         runs scripts on packages in topological order

  exec <command>      run a shell command in each packages

    --filter          all: (default) all packages
                      not-cached: all packages that is not cached for the current version
                      cached: all packages that is cached for the current version

    --hierarchy       all: (default) don't filter based on hierarchy
                      shared: only shared packages
                      root: only root packages

    --grep            only packages which name matches the given glob pattern

    --include-deps    runs the shell command on all dependencies before the filtered packages

    --ordered         runs the shell command on packages in topological order

  write               synchronizes to the cache

  read                synchronizes from the cache

  clean               clean the cache

    --older-than n    will clean files older than n days,
                      n must be between 0 and 120 and defaults to 30

Examples

  workspace-cache list
  workspace-cache list --filter cached
  workspace-cache list --filter not-cached
  workspace-cache list --hierarchy root
  workspace-cache list --hierarchy root --grep "@common/*"

  workspace-cache run build --ordered
  workspace-cache run build --ordered --filter not-cached
  workspace-cache run test --hierarchy root
  workspace-cache run test -- -i
  workspace-cache run test --grep "*streams"
  workspace-cache run test --include-deps --grep "*stream"

  workspace-cache exec ls
  workspace-cache exec -- ls -l
  workspace-cache exec --ordered -- make

  workspace-cache write

  workspace-cache read

  workspace-cache clean
  workspace-cache clean --older-than 3
`);

const [command, ...args] = cli.input;

const ensure = condition => {
  if (!condition) {
    console.log(cli.help);
    process.exit(1);
  }
};

const defaults = {
  filter: "all",
  hierarchy: "all",
  olderThan: 30,
  concurrency: 2 * cpus,
  cache: ".workspace-cache",
};

const flags = cli.flags;

const options = { ...defaults, ...flags };

ensure(["exec", "list", "write", "read", "run", "clean"].includes(command));
ensure(
  typeof options.olderThan === "number" &&
    options.olderThan >= 0 &&
    options.olderThan <= 120
);
ensure(command !== "run" || command !== "exec" || args.length > 0);
ensure(typeof options.concurrency === "number" && options.concurrency >= 1);
ensure(["all", "not-cached", "cached"].includes(options.filter));
ensure(["all", "shared", "root"].includes(options.hierarchy));

const cwd = process.cwd();
const cacheDir = path.resolve(options.cache);

main(cwd, cacheDir, command, args, options).catch(e => {
  console.error(e.message);
  console.error(e.stack);
  process.exit(1);
});
