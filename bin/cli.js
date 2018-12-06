#!/usr/bin/env node
const meow = require("meow");
const { main } = require("..");

const cli = meow(`
  Usage
    $ workspace-cache <command> [flags] <cache-dir>

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
`);

const [command, ...args] = cli.input;

const commands = ["list", "write", "read", "clean"];

if (!commands.includes(command) || args.length !== 1) {
  console.log(cli.help);
  process.exit(1);
}

const defaults = {
  filter: "all",
  hierarchy: "all",
  olderThan: 30,
};

const flags = cli.flags;

main(command, args, { ...defaults, ...flags }).catch(e => {
  console.error(e.message);
  console.error(e.stack);
  process.exit(1);
});
