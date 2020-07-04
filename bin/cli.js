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
                        shared: only list shared packages
                        root: only list root packages

    run <script>        run a npm script in each packages that contains that script

      --filter          all: (default) all packages
                        not-cached: all packages that is not cached for the current version
                        cached: all packages that is cached for the current version

      --hierarchy       all: (default) don't filter based on hierarchy
                        shared: only list shared packages
                        root: only list root packages

    write               synchronizes to the cache

    read                synchronizes from the cache

    clean               clean the cache

      --older-than n    will clean files older than n days,
                        n must be between 0 and 120 and defaults to 30

  Examples

    workspace-cache list
    workspace-cache list --filter cached
    workspace-cache list --filter not-cached


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

ensure(["list", "write", "read", "run", "clean"].includes(command));
ensure(
  typeof options.olderThan === "number" &&
    options.olderThan >= 0 &&
    options.olderThan <= 120
);
ensure(command !== "run" || args.length > 0);
ensure(typeof options.concurrency === "number" && options.concurrency >= 1);
ensure(["all", "not-cached", "cached"].includes(options.filter));
ensure(["all", "shared", "root"].includes(options.hierarchy));

const cwd = process.cwd();
const cacheDir = path.join(cwd, options.cache);

main(cwd, cacheDir, command, args, options).catch(e => {
  console.error(e.message);
  console.error(e.stack);
  process.exit(1);
});
