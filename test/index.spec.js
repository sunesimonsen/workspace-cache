/* global testOutput:true */
const path = require("path");
const sinon = require("sinon");
const fs = require("fs-extra");
const mockIO = require("mock-stdio");
const expect = require("unexpected")
  .clone()
  .use(require("unexpected-sinon"))
  .use(require("unexpected-snapshot"));

const { main } = require("..");

const testDir = __dirname;
const tmp = path.join(testDir, "tmp");
const cwd = path.join(testDir, "repo");
const caches = path.join(testDir, "caches");
const cacheInSync = path.join(caches, "in-sync");
const cacheWithCascadingChange = path.join(caches, "with-cascading-change");
const cacheWithPartialCascadingChange = path.join(
  caches,
  "with-partial-cascading-change"
);
const cacheWithSingleChange = path.join(caches, "with-single-change");

describe("workspace-cache", () => {
  let clock;

  beforeEach(async () => {
    testOutput = [];
    clock = sinon.useFakeTimers({
      toFake: ["Date"],
      now: new Date("Tue, 30 Jun 2020 21:10:00 GMT"),
    });
  });

  afterEach(async () => {
    clock.restore();
    if (await fs.pathExists(tmp)) {
      await fs.remove(tmp);
    }
  });

  describe("list", () => {
    beforeEach(() => {
      sinon.stub(console, "log");
    });

    afterEach(() => {
      console.log.restore();
    });

    describe("--filter all", () => {
      beforeEach(async () => {
        await main(cwd, cacheWithCascadingChange, "list", [], {
          concurrency: 1,
          filter: "all",
          hierarchy: "all",
        });
      });

      it("prints all of the packages", () => {
        expect(console.log, "to have calls satisfying", () => {
          console.log("package-c");
          console.log("package-b");
          console.log("package-a");
          console.log("app-b");
          console.log("app-a");
        });
      });
    });

    describe("--filter cached", () => {
      describe("on a cache with cascading changes", () => {
        beforeEach(async () => {
          await main(cwd, cacheWithCascadingChange, "list", [], {
            concurrency: 1,
            filter: "cached",
            hierarchy: "all",
          });
        });

        it("prints the packages that is cached", () => {
          expect(console.log, "was not called");
        });
      });

      describe("on a cache with partial cascading changes", () => {
        beforeEach(async () => {
          await main(cwd, cacheWithPartialCascadingChange, "list", [], {
            concurrency: 1,
            filter: "cached",
            hierarchy: "all",
          });
        });

        it("prints the packages that is cached", () => {
          expect(console.log, "to have calls satisfying", () => {
            console.log("package-c");
            console.log("package-a");
            console.log("app-a");
          });
        });
      });

      describe("on a cache with a single change", () => {
        beforeEach(async () => {
          await main(cwd, cacheWithSingleChange, "list", [], {
            concurrency: 1,
            filter: "cached",
            hierarchy: "all",
          });
        });

        it("prints the packages that is cached", () => {
          expect(console.log, "to have calls satisfying", () => {
            console.log("package-c");
            console.log("package-b");
            console.log("package-a");
            console.log("app-a");
          });
        });
      });

      describe("on a cache that is in-sync", () => {
        beforeEach(async () => {
          await main(cwd, cacheInSync, "list", [], {
            concurrency: 1,
            filter: "cached",
            hierarchy: "all",
          });
        });

        it("prints the packages that is cached", () => {
          expect(console.log, "to have calls satisfying", () => {
            console.log("package-c");
            console.log("package-b");
            console.log("package-a");
            console.log("app-b");
            console.log("app-a");
          });
        });
      });
    });

    describe("--filter not-cached", () => {
      describe("on a cache with cascading changes", () => {
        beforeEach(async () => {
          await main(cwd, cacheWithCascadingChange, "list", [], {
            concurrency: 1,
            filter: "not-cached",
            hierarchy: "all",
          });
        });

        it("prints the packages that is not cached", () => {
          expect(console.log, "to have calls satisfying", () => {
            console.log("package-c");
            console.log("package-b");
            console.log("package-a");
            console.log("app-b");
            console.log("app-a");
          });
        });
      });

      describe("on a cache with partial cascading changes", () => {
        beforeEach(async () => {
          await main(cwd, cacheWithPartialCascadingChange, "list", [], {
            concurrency: 1,
            filter: "not-cached",
            hierarchy: "all",
          });
        });

        it("prints the packages that is not cached", () => {
          expect(console.log, "to have calls satisfying", () => {
            console.log("package-b");
            console.log("app-b");
          });
        });
      });

      describe("on a cache with a single change", () => {
        beforeEach(async () => {
          await main(cwd, cacheWithSingleChange, "list", [], {
            concurrency: 1,
            filter: "not-cached",
            hierarchy: "all",
          });
        });

        it("prints the packages that is not cached", () => {
          expect(console.log, "to have calls satisfying", () => {
            console.log("app-b");
          });
        });
      });

      describe("on a cache that is in-sync", () => {
        beforeEach(async () => {
          await main(cwd, cacheInSync, "list", [], {
            concurrency: 1,
            filter: "not-cached",
            hierarchy: "all",
          });
        });

        it("prints the packages that is not cached", () => {
          expect(console.log, "was not called");
        });
      });
    });

    describe("--hierarchy shared", () => {
      beforeEach(async () => {
        await main(cwd, cacheInSync, "list", [], {
          concurrency: 1,
          filter: "all",
          hierarchy: "shared",
        });
      });

      it("prints the shared packages", () => {
        expect(console.log, "to have calls satisfying", () => {
          console.log("package-c");
          console.log("package-b");
          console.log("package-a");
        });
      });
    });

    describe("--hierarchy root", () => {
      beforeEach(async () => {
        await main(cwd, cacheInSync, "list", [], {
          concurrency: 1,
          filter: "all",
          hierarchy: "root",
        });
      });

      it("prints the root packages", () => {
        expect(console.log, "to have calls satisfying", () => {
          console.log("app-b");
          console.log("app-a");
        });
      });
    });

    describe("--grep app-?", () => {
      beforeEach(async () => {
        await main(cwd, cacheInSync, "list", [], {
          concurrency: 1,
          filter: "all",
          hierarchy: "all",
          grep: "app-?",
        });
      });

      it("prints the packages that matches the given glob pattern", () => {
        expect(console.log, "to have calls satisfying", () => {
          console.log("app-b");
          console.log("app-a");
        });
      });
    });

    describe("--grep app-a --include-deps", () => {
      beforeEach(async () => {
        await main(cwd, cacheInSync, "list", [], {
          concurrency: 1,
          filter: "all",
          hierarchy: "all",
          grep: "app-a",
          includeDeps: true,
        });
      });

      it("includes all of the dependencies with the given script of the filtered packages", () => {
        expect(console.log, "to have calls satisfying", () => {
          console.log("package-c");
          console.log("package-a");
          console.log("app-a");
        });
      });
    });
    describe("--filter cached --hierarchy shared", () => {
      beforeEach(async () => {
        await main(cwd, cacheWithPartialCascadingChange, "list", [], {
          concurrency: 1,
          filter: "cached",
          hierarchy: "shared",
        });
      });

      it("prints the shared and cached packages", () => {
        expect(console.log, "to have calls satisfying", () => {
          console.log("package-c");
          console.log("package-a");
        });
      });
    });
  });

  describe("run", () => {
    let result;

    const getOutputs = () => {
      const regex = /(package|app)-[abc]: yarn run hello/g;
      let m;
      const results = [];

      do {
        m = regex.exec(result.stdout);
        if (m) {
          results.push(m[0]);
        }
      } while (m);

      return results;
    };

    describe("without filtering", () => {
      beforeEach(async () => {
        mockIO.start();
        try {
          await main(cwd, cacheWithPartialCascadingChange, "run", ["hello"], {
            concurrency: 1,
            filter: "all",
            hierarchy: "all",
          });
        } finally {
          result = mockIO.end();
        }
      });

      it("runs the script in all packages with that script", () => {
        expect(getOutputs(), "to equal", [
          "package-c: yarn run hello",
          "package-b: yarn run hello",
          "app-b: yarn run hello",
          "app-a: yarn run hello",
        ]);
      });
    });

    describe("with filtering", () => {
      beforeEach(async () => {
        mockIO.start();
        try {
          await main(cwd, cacheWithPartialCascadingChange, "run", ["hello"], {
            concurrency: 1,
            filter: "all",
            hierarchy: "all",
            grep: "app-?",
          });
        } finally {
          result = mockIO.end();
        }
      });

      it("honors the filtering", () => {
        expect(getOutputs(), "to equal", [
          "app-b: yarn run hello",
          "app-a: yarn run hello",
        ]);
      });
    });

    describe("with --include-deps", () => {
      beforeEach(async () => {
        mockIO.start();
        try {
          await main(cwd, cacheWithPartialCascadingChange, "run", ["hello"], {
            concurrency: 1,
            filter: "all",
            hierarchy: "all",
            grep: "app-a",
            includeDeps: true,
          });
        } finally {
          result = mockIO.end();
        }
      });

      it("includes all of the dependencies with the given script of the filtered packages", () => {
        expect(getOutputs(), "to equal", [
          "package-c: yarn run hello",
          "app-a: yarn run hello",
        ]);
      });
    });

    describe("with --ordered", () => {
      beforeEach(async () => {
        mockIO.start();
        try {
          await main(cwd, cacheWithPartialCascadingChange, "run", ["hello"], {
            concurrency: 1,
            filter: "all",
            hierarchy: "all",
            grep: "app-a",
            includeDeps: true,
            ordered: true,
          });
        } finally {
          result = mockIO.end();
        }
      });

      it("runs scripts on packages in topological order", () => {
        expect(getOutputs(), "to equal", [
          "package-c: yarn run hello",
          "app-a: yarn run hello",
        ]);
      });
    });
  });

  describe("exec", () => {
    let result;

    const getOutputs = () => {
      const regex = /(package|app)-[abc]: ls/g;
      let m;
      const results = [];

      do {
        m = regex.exec(result.stdout);
        if (m) {
          results.push(m[0]);
        }
      } while (m);

      return results;
    };

    describe("without filtering", () => {
      beforeEach(async () => {
        mockIO.start();
        try {
          await main(cwd, cacheWithPartialCascadingChange, "exec", ["ls"], {
            concurrency: 1,
            filter: "all",
            hierarchy: "all",
          });
        } finally {
          result = mockIO.end();
        }
      });

      it("runs the script in all packages with that script", () => {
        expect(getOutputs(), "to equal", [
          "package-c: ls",
          "package-b: ls",
          "package-a: ls",
          "app-b: ls",
          "app-a: ls",
        ]);
      });
    });

    describe("with filtering", () => {
      beforeEach(async () => {
        mockIO.start();
        try {
          await main(cwd, cacheWithPartialCascadingChange, "exec", ["ls"], {
            concurrency: 1,
            filter: "all",
            hierarchy: "all",
            grep: "app-?",
          });
        } finally {
          result = mockIO.end();
        }
      });

      it("honors the filtering", () => {
        expect(getOutputs(), "to equal", ["app-b: ls", "app-a: ls"]);
      });
    });

    describe("with --include-deps", () => {
      beforeEach(async () => {
        mockIO.start();
        try {
          await main(cwd, cacheWithPartialCascadingChange, "exec", ["ls"], {
            concurrency: 1,
            filter: "all",
            hierarchy: "all",
            grep: "app-a",
            includeDeps: true,
          });
        } finally {
          result = mockIO.end();
        }
      });

      it("includes all of the dependencies with the given script of the filtered packages", () => {
        expect(getOutputs(), "to equal", [
          "package-c: ls",
          "package-a: ls",
          "app-a: ls",
        ]);
      });
    });

    describe("with --ordered", () => {
      beforeEach(async () => {
        mockIO.start();
        try {
          await main(cwd, cacheWithPartialCascadingChange, "exec", ["ls"], {
            concurrency: 1,
            filter: "all",
            hierarchy: "all",
            grep: "app-a",
            includeDeps: true,
            ordered: true,
          });
        } finally {
          result = mockIO.end();
        }
      });

      it("runs scripts on packages in topological order", () => {
        expect(getOutputs(), "to equal", [
          "package-c: ls",
          "package-a: ls",
          "app-a: ls",
        ]);
      });
    });
  });

  describe("read", () => {
    beforeEach(async () => {
      await fs.copy(cwd, tmp);
    });

    describe("on a cache with cascading changes", () => {
      beforeEach(async () => {
        await main(tmp, cacheWithCascadingChange, "read", [], {});
      });

      it("copies cached files into the repo", () => {
        expect(testOutput, "to be empty");
      });
    });

    describe("on a cache with partial cascading changes", () => {
      beforeEach(async () => {
        await main(tmp, cacheWithPartialCascadingChange, "read", [], {});

        testOutput.sort();
      });

      it("copies cached files into the repo", () => {
        expect(testOutput, "to equal snapshot", [
          "copy: ../caches/with-partial-cascading-change/development/app-a/21e16aae1952b5a83f9ef44ec39a0320e4b9c1689650855b7677f9df2a3f76e0/dist => apps/app-a/dist",
          "copy: ../caches/with-partial-cascading-change/development/app-a/21e16aae1952b5a83f9ef44ec39a0320e4b9c1689650855b7677f9df2a3f76e0/duplicated.txt => apps/app-a/duplicated.txt",
          "copy: ../caches/with-partial-cascading-change/development/package-c/d13a3b760af8df0c0eb6115c9d91e69e9aedc60f6ba34f17affef0c56df03f11/dist/index.js => packages/package-c/dist/index.js",
        ]);
      });
    });

    describe("on a cache with a single change", () => {
      beforeEach(async () => {
        await main(tmp, cacheWithSingleChange, "read", [], {});

        testOutput.sort();
      });

      it("copies cached files into the repo", () => {
        expect(testOutput, "to equal snapshot", [
          "copy: ../caches/with-single-change/development/app-a/21e16aae1952b5a83f9ef44ec39a0320e4b9c1689650855b7677f9df2a3f76e0/dist => apps/app-a/dist",
          "copy: ../caches/with-single-change/development/app-a/21e16aae1952b5a83f9ef44ec39a0320e4b9c1689650855b7677f9df2a3f76e0/duplicated.txt => apps/app-a/duplicated.txt",
          "copy: ../caches/with-single-change/development/package-b/d5c1174411acffbf1aadefc78bad0a6c12020867f878ed7692d6a2f4bcd0233d/dist => packages/package-b/dist",
          "copy: ../caches/with-single-change/development/package-b/d5c1174411acffbf1aadefc78bad0a6c12020867f878ed7692d6a2f4bcd0233d/duplicated.txt => packages/package-b/duplicated.txt",
          "copy: ../caches/with-single-change/development/package-c/d13a3b760af8df0c0eb6115c9d91e69e9aedc60f6ba34f17affef0c56df03f11/dist/index.js => packages/package-c/dist/index.js",
        ]);
      });
    });

    describe("on a cache that is in-sync", () => {
      beforeEach(async () => {
        await main(tmp, cacheInSync, "read", [], {});

        testOutput.sort();
      });

      it("copies cached files into the repo", () => {
        expect(testOutput, "to equal snapshot", [
          "copy: ../caches/in-sync/development/app-a/21e16aae1952b5a83f9ef44ec39a0320e4b9c1689650855b7677f9df2a3f76e0/dist => apps/app-a/dist",
          "copy: ../caches/in-sync/development/app-a/21e16aae1952b5a83f9ef44ec39a0320e4b9c1689650855b7677f9df2a3f76e0/duplicated.txt => apps/app-a/duplicated.txt",
          "copy: ../caches/in-sync/development/app-b/7a3b7f700ea444bef42538fd8073f69f65e1c980f4d03de2d5e7da36f62b2c9e/dist/index.js => apps/app-b/dist/index.js",
          "copy: ../caches/in-sync/development/app-b/7a3b7f700ea444bef42538fd8073f69f65e1c980f4d03de2d5e7da36f62b2c9e/duplicated.txt => apps/app-b/duplicated.txt",
          "copy: ../caches/in-sync/development/package-b/d5c1174411acffbf1aadefc78bad0a6c12020867f878ed7692d6a2f4bcd0233d/dist => packages/package-b/dist",
          "copy: ../caches/in-sync/development/package-b/d5c1174411acffbf1aadefc78bad0a6c12020867f878ed7692d6a2f4bcd0233d/duplicated.txt => packages/package-b/duplicated.txt",
          "copy: ../caches/in-sync/development/package-c/d13a3b760af8df0c0eb6115c9d91e69e9aedc60f6ba34f17affef0c56df03f11/dist/index.js => packages/package-c/dist/index.js",
        ]);
      });
    });
  });

  describe("write", () => {
    describe("on a cache with cascading changes", () => {
      beforeEach(async () => {
        await fs.copy(cacheWithCascadingChange, tmp);
        await main(cwd, tmp, "write", [], {});

        testOutput.sort();
      });

      it("copies uncached files into the cache", () => {
        expect(testOutput, "to equal snapshot", [
          '"Tue, 30 Jun 2020 21:10:00 GMT" => ../tmp/development/package-a/4aeb1c73aa5bb1634e008e56e63f9d8be001be6b02cb86306bef10284e67cfb5/timestamp.txt',
          "link: ../tmp/development/app-a/21e16aae1952b5a83f9ef44ec39a0320e4b9c1689650855b7677f9df2a3f76e0/dist/index.js => ../tmp/blobs/190ccb0d001de2d11b26f0cd1a0162d8ba695e5105f12bf733a369b38615e83d",
          "link: ../tmp/development/app-a/21e16aae1952b5a83f9ef44ec39a0320e4b9c1689650855b7677f9df2a3f76e0/duplicated.txt => ../tmp/blobs/0910d41851f5f209dbc143a30314b6d0f5f915333aabbeb52f1479418294c058",
          "link: ../tmp/development/app-b/7a3b7f700ea444bef42538fd8073f69f65e1c980f4d03de2d5e7da36f62b2c9e/dist/index.js => ../tmp/blobs/5b99d0d1e429de070b548fcee4086a66554769f2facdebd0cdd8ac6c8f592191",
          "link: ../tmp/development/app-b/7a3b7f700ea444bef42538fd8073f69f65e1c980f4d03de2d5e7da36f62b2c9e/duplicated.txt => ../tmp/blobs/0910d41851f5f209dbc143a30314b6d0f5f915333aabbeb52f1479418294c058",
          "link: ../tmp/development/package-b/d5c1174411acffbf1aadefc78bad0a6c12020867f878ed7692d6a2f4bcd0233d/dist/index.js => ../tmp/blobs/a877a788b26c25460abce5d4c86a65456e15c882f803282ff57a1293f38a7b13",
          "link: ../tmp/development/package-b/d5c1174411acffbf1aadefc78bad0a6c12020867f878ed7692d6a2f4bcd0233d/duplicated.txt => ../tmp/blobs/0910d41851f5f209dbc143a30314b6d0f5f915333aabbeb52f1479418294c058",
          "link: ../tmp/development/package-c/d13a3b760af8df0c0eb6115c9d91e69e9aedc60f6ba34f17affef0c56df03f11/dist/index.js => ../tmp/blobs/80e7aa39f0a5e26b7e56a304277a50e4fc79b54f1e46ebe20ed15d5abe5b4220",
          "touch: ../tmp/blobs/0910d41851f5f209dbc143a30314b6d0f5f915333aabbeb52f1479418294c058",
          "touch: ../tmp/blobs/190ccb0d001de2d11b26f0cd1a0162d8ba695e5105f12bf733a369b38615e83d",
          "touch: ../tmp/blobs/5b99d0d1e429de070b548fcee4086a66554769f2facdebd0cdd8ac6c8f592191",
          "touch: ../tmp/blobs/80e7aa39f0a5e26b7e56a304277a50e4fc79b54f1e46ebe20ed15d5abe5b4220",
          "touch: ../tmp/blobs/a877a788b26c25460abce5d4c86a65456e15c882f803282ff57a1293f38a7b13",
        ]);
      });
    });

    describe("on a cache with partial cascading changes", () => {
      beforeEach(async () => {
        await fs.copy(cacheWithPartialCascadingChange, tmp);
        await main(cwd, tmp, "write", [], {});

        testOutput.sort();
      });

      it("copies uncached files into the cache", () => {
        expect(testOutput, "to equal snapshot", [
          '"Tue, 30 Jun 2020 21:10:00 GMT" => ../tmp/development/package-a/4aeb1c73aa5bb1634e008e56e63f9d8be001be6b02cb86306bef10284e67cfb5/timestamp.txt',
          "link: ../tmp/development/app-b/7a3b7f700ea444bef42538fd8073f69f65e1c980f4d03de2d5e7da36f62b2c9e/dist/index.js => ../tmp/blobs/5b99d0d1e429de070b548fcee4086a66554769f2facdebd0cdd8ac6c8f592191",
          "link: ../tmp/development/app-b/7a3b7f700ea444bef42538fd8073f69f65e1c980f4d03de2d5e7da36f62b2c9e/duplicated.txt => ../tmp/blobs/0910d41851f5f209dbc143a30314b6d0f5f915333aabbeb52f1479418294c058",
          "link: ../tmp/development/package-b/d5c1174411acffbf1aadefc78bad0a6c12020867f878ed7692d6a2f4bcd0233d/dist/index.js => ../tmp/blobs/a877a788b26c25460abce5d4c86a65456e15c882f803282ff57a1293f38a7b13",
          "link: ../tmp/development/package-b/d5c1174411acffbf1aadefc78bad0a6c12020867f878ed7692d6a2f4bcd0233d/duplicated.txt => ../tmp/blobs/0910d41851f5f209dbc143a30314b6d0f5f915333aabbeb52f1479418294c058",
          "touch: ../tmp/blobs/0910d41851f5f209dbc143a30314b6d0f5f915333aabbeb52f1479418294c058",
          "touch: ../tmp/blobs/190ccb0d001de2d11b26f0cd1a0162d8ba695e5105f12bf733a369b38615e83d",
          "touch: ../tmp/blobs/5b99d0d1e429de070b548fcee4086a66554769f2facdebd0cdd8ac6c8f592191",
          "touch: ../tmp/blobs/80e7aa39f0a5e26b7e56a304277a50e4fc79b54f1e46ebe20ed15d5abe5b4220",
          "touch: ../tmp/blobs/a877a788b26c25460abce5d4c86a65456e15c882f803282ff57a1293f38a7b13",
          "touch: ../tmp/development/app-a/21e16aae1952b5a83f9ef44ec39a0320e4b9c1689650855b7677f9df2a3f76e0",
          "touch: ../tmp/development/app-a/21e16aae1952b5a83f9ef44ec39a0320e4b9c1689650855b7677f9df2a3f76e0/dist/index.js",
          "touch: ../tmp/development/app-a/21e16aae1952b5a83f9ef44ec39a0320e4b9c1689650855b7677f9df2a3f76e0/duplicated.txt",
          "touch: ../tmp/development/package-c/d13a3b760af8df0c0eb6115c9d91e69e9aedc60f6ba34f17affef0c56df03f11",
          "touch: ../tmp/development/package-c/d13a3b760af8df0c0eb6115c9d91e69e9aedc60f6ba34f17affef0c56df03f11/dist/index.js",
        ]);
      });
    });

    describe("on a cache with a single change", () => {
      beforeEach(async () => {
        await fs.copy(cacheWithSingleChange, tmp);
        await main(cwd, tmp, "write", [], {});

        testOutput.sort();
      });

      it("copies uncached files into the cache", () => {
        expect(testOutput, "to equal snapshot", [
          '"Tue, 30 Jun 2020 21:10:00 GMT" => ../tmp/development/package-a/4aeb1c73aa5bb1634e008e56e63f9d8be001be6b02cb86306bef10284e67cfb5/timestamp.txt',
          "link: ../tmp/development/app-b/7a3b7f700ea444bef42538fd8073f69f65e1c980f4d03de2d5e7da36f62b2c9e/dist/index.js => ../tmp/blobs/5b99d0d1e429de070b548fcee4086a66554769f2facdebd0cdd8ac6c8f592191",
          "link: ../tmp/development/app-b/7a3b7f700ea444bef42538fd8073f69f65e1c980f4d03de2d5e7da36f62b2c9e/duplicated.txt => ../tmp/blobs/0910d41851f5f209dbc143a30314b6d0f5f915333aabbeb52f1479418294c058",
          "touch: ../tmp/blobs/0910d41851f5f209dbc143a30314b6d0f5f915333aabbeb52f1479418294c058",
          "touch: ../tmp/blobs/190ccb0d001de2d11b26f0cd1a0162d8ba695e5105f12bf733a369b38615e83d",
          "touch: ../tmp/blobs/5b99d0d1e429de070b548fcee4086a66554769f2facdebd0cdd8ac6c8f592191",
          "touch: ../tmp/blobs/80e7aa39f0a5e26b7e56a304277a50e4fc79b54f1e46ebe20ed15d5abe5b4220",
          "touch: ../tmp/blobs/a877a788b26c25460abce5d4c86a65456e15c882f803282ff57a1293f38a7b13",
          "touch: ../tmp/development/app-a/21e16aae1952b5a83f9ef44ec39a0320e4b9c1689650855b7677f9df2a3f76e0",
          "touch: ../tmp/development/app-a/21e16aae1952b5a83f9ef44ec39a0320e4b9c1689650855b7677f9df2a3f76e0/dist/index.js",
          "touch: ../tmp/development/app-a/21e16aae1952b5a83f9ef44ec39a0320e4b9c1689650855b7677f9df2a3f76e0/duplicated.txt",
          "touch: ../tmp/development/package-b/d5c1174411acffbf1aadefc78bad0a6c12020867f878ed7692d6a2f4bcd0233d",
          "touch: ../tmp/development/package-b/d5c1174411acffbf1aadefc78bad0a6c12020867f878ed7692d6a2f4bcd0233d/dist/index.js",
          "touch: ../tmp/development/package-b/d5c1174411acffbf1aadefc78bad0a6c12020867f878ed7692d6a2f4bcd0233d/duplicated.txt",
          "touch: ../tmp/development/package-c/d13a3b760af8df0c0eb6115c9d91e69e9aedc60f6ba34f17affef0c56df03f11",
          "touch: ../tmp/development/package-c/d13a3b760af8df0c0eb6115c9d91e69e9aedc60f6ba34f17affef0c56df03f11/dist/index.js",
        ]);
      });
    });

    describe("on a cache that is in-sync", () => {
      beforeEach(async () => {
        await fs.copy(cacheInSync, tmp);
        await main(cwd, tmp, "write", [], {});
      });

      it("copies uncached files into the cache", () => {
        expect(testOutput, "to equal snapshot", [
          "touch: ../tmp/development/package-c/d13a3b760af8df0c0eb6115c9d91e69e9aedc60f6ba34f17affef0c56df03f11",
          "touch: ../tmp/blobs/80e7aa39f0a5e26b7e56a304277a50e4fc79b54f1e46ebe20ed15d5abe5b4220",
          "touch: ../tmp/development/package-c/d13a3b760af8df0c0eb6115c9d91e69e9aedc60f6ba34f17affef0c56df03f11/dist/index.js",
          '"Tue, 30 Jun 2020 21:10:00 GMT" => ../tmp/development/package-a/4aeb1c73aa5bb1634e008e56e63f9d8be001be6b02cb86306bef10284e67cfb5/timestamp.txt',
          "touch: ../tmp/development/package-b/d5c1174411acffbf1aadefc78bad0a6c12020867f878ed7692d6a2f4bcd0233d",
          "touch: ../tmp/blobs/a877a788b26c25460abce5d4c86a65456e15c882f803282ff57a1293f38a7b13",
          "touch: ../tmp/development/package-b/d5c1174411acffbf1aadefc78bad0a6c12020867f878ed7692d6a2f4bcd0233d/dist/index.js",
          "touch: ../tmp/blobs/0910d41851f5f209dbc143a30314b6d0f5f915333aabbeb52f1479418294c058",
          "touch: ../tmp/development/package-b/d5c1174411acffbf1aadefc78bad0a6c12020867f878ed7692d6a2f4bcd0233d/duplicated.txt",
          "touch: ../tmp/development/app-a/21e16aae1952b5a83f9ef44ec39a0320e4b9c1689650855b7677f9df2a3f76e0",
          "touch: ../tmp/blobs/190ccb0d001de2d11b26f0cd1a0162d8ba695e5105f12bf733a369b38615e83d",
          "touch: ../tmp/development/app-a/21e16aae1952b5a83f9ef44ec39a0320e4b9c1689650855b7677f9df2a3f76e0/dist/index.js",
          "touch: ../tmp/development/app-a/21e16aae1952b5a83f9ef44ec39a0320e4b9c1689650855b7677f9df2a3f76e0/duplicated.txt",
          "touch: ../tmp/development/app-b/7a3b7f700ea444bef42538fd8073f69f65e1c980f4d03de2d5e7da36f62b2c9e",
          "touch: ../tmp/blobs/5b99d0d1e429de070b548fcee4086a66554769f2facdebd0cdd8ac6c8f592191",
          "touch: ../tmp/development/app-b/7a3b7f700ea444bef42538fd8073f69f65e1c980f4d03de2d5e7da36f62b2c9e/dist/index.js",
          "touch: ../tmp/development/app-b/7a3b7f700ea444bef42538fd8073f69f65e1c980f4d03de2d5e7da36f62b2c9e/duplicated.txt",
        ]);
      });
    });
  });

  describe("clean", () => {
    const updateTimeStamps = async (time, ...paths) => {
      await fs.utimes(path.join(tmp, ...paths), time, time);
    };

    beforeEach(async () => {
      await fs.copy(cacheInSync, tmp, { preserveTimestamps: true });
      const beforeLimit = new Date("Tue, 20 Jun 2020 21:10:00 GMT");
      const afterLimit = new Date("Tue, 28 Jun 2020 21:10:00 GMT");

      await updateTimeStamps(
        beforeLimit,
        "development",
        "app-a",
        "21e16aae1952b5a83f9ef44ec39a0320e4b9c1689650855b7677f9df2a3f76e0"
      );

      await updateTimeStamps(
        beforeLimit,
        "blobs",
        "190ccb0d001de2d11b26f0cd1a0162d8ba695e5105f12bf733a369b38615e83d"
      );

      await updateTimeStamps(
        beforeLimit,
        "development",
        "package-b",
        "d5c1174411acffbf1aadefc78bad0a6c12020867f878ed7692d6a2f4bcd0233d"
      );

      await updateTimeStamps(
        beforeLimit,
        "blobs",
        "a877a788b26c25460abce5d4c86a65456e15c882f803282ff57a1293f38a7b13"
      );

      await updateTimeStamps(
        afterLimit,
        "development",
        "package-a",
        "4aeb1c73aa5bb1634e008e56e63f9d8be001be6b02cb86306bef10284e67cfb5"
      );

      await main(cwd, tmp, "clean", [], { olderThan: 8 });

      testOutput.sort();
    });

    it("removes old directories", () => {
      expect(testOutput, "to equal snapshot", [
        "Removed ../tmp/blobs/190ccb0d001de2d11b26f0cd1a0162d8ba695e5105f12bf733a369b38615e83d",
        "Removed ../tmp/blobs/a877a788b26c25460abce5d4c86a65456e15c882f803282ff57a1293f38a7b13",
        "Removed ../tmp/development/app-a/21e16aae1952b5a83f9ef44ec39a0320e4b9c1689650855b7677f9df2a3f76e0",
        "Removed ../tmp/development/package-b/d5c1174411acffbf1aadefc78bad0a6c12020867f878ed7692d6a2f4bcd0233d",
      ]);
    });
  });
});
