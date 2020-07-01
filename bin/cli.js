#!/usr/bin/env node
const meow = require("meow");
const { main } = require("..");
const os = require("os");
const cpus = os.cpus().length;

const cli = meow(`
  Usage

    $ workspace-cache <command> [flags] <cache-dir>

  Flags
    --concurrency       how many threads to use, defaults to 2 * CPU's

  Commands

    list                list the packages in dependency order

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

    workspace-cache list /tmp/workspace-cache
    workspace-cache list --filter cached /tmp/workspace-cache
    workspace-cache list --filter not-cached /tmp/workspace-cache

    workspace-cache write /tmp/workspace-cache

    workspace-cache read /tmp/workspace-cache

    workspace-cache clean /tmp/workspace-cache
    workspace-cache clean --older-than 3 /tmp/workspace-cache
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
};

const flags = cli.flags;

const options = { ...defaults, ...flags };

ensure(["list", "write", "read", "clean"].includes(command));
ensure(args.length === 1);
ensure(
  typeof options.olderThan === "number" &&
    options.olderThan >= 0 &&
    options.olderThan <= 120
);
ensure(typeof options.concurrency === "number" && options.concurrency >= 1);
ensure(["all", "not-cached", "cached"].includes(options.filter));
ensure(["all", "shared", "root"].includes(options.hierarchy));

const cwd = process.cwd();

main(cwd, command, args, options).catch(e => {
  console.error(e.message);
  console.error(e.stack);
  process.exit(1);
});
