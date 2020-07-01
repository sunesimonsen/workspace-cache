## workspace-cache 

[![Build Status](https://travis-ci.org/sunesimonsen/workspace-cache.svg?branch=master)](https://travis-ci.org/sunesimonsen/workspace-cache)

A command line utility to manage a workspace cache for Yarn workspaces or Lerna.

It will allow you to cache build artifacts based for each packages in a
workspace and retrieve the cached artifacts. It understands the local
dependencies between packages and can figure out which packages has changed
based on the individual files in each package.

## Installation

``` sh
npm install workspace-cache
```

## Usage

```
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
```

## MIT License

Copyright (c) 2020 Sune Simonsen sune@we-knowhow.dk

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
