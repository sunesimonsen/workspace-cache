const path = require("path");
const sinon = require("sinon");
const fs = require("fs-extra");
const mockIO = require("mock-stdio");
const expect = require("unexpected")
  .clone()
  .use(require("unexpected-sinon"));

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
    clock = sinon.useFakeTimers({
      toFake: ["Date"],
      now: new Date("Tue, 30 Jun 2020 21:10:00 GMT"),
    });
    sinon.stub(console, "log");
  });

  afterEach(async () => {
    clock.restore();
    console.log.restore();
    if (await fs.pathExists(tmp)) {
      await fs.remove(tmp);
    }
  });

  describe("list", () => {
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
            console.log("package-b");
            console.log("app-b");
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
            console.log("package-a");
            console.log("app-a");
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
          console.log("package-b");
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
  });

  describe("read", () => {
    beforeEach(async () => {
      await fs.copy(cwd, tmp);
    });

    describe("on a cache with cascading changes", () => {
      beforeEach(async () => {
        await main(tmp, cacheWithCascadingChange, "read", [], {
          concurrency: 1,
        });
      });

      it("copies cached files into the repo", () => {
        expect(console.log, "was not called");
      });
    });

    describe("on a cache with partial cascading changes", () => {
      beforeEach(async () => {
        await main(tmp, cacheWithPartialCascadingChange, "read", [], {
          concurrency: 1,
        });
      });

      it("copies cached files into the repo", () => {
        expect(console.log, "to have calls satisfying", () => {
          console.log(
            "../caches/with-partial-cascading-change/development/package-c/d13a3b760af8df0c0eb6115c9d91e69e9aedc60f6ba34f17affef0c56df03f11/dist/index.js => packages/package-c/dist/index.js"
          );
          console.log(
            "../caches/with-partial-cascading-change/development/package-b/2c29829c5b81e8e9f786c77315cd073f7e8c51cb6bed7756123d4681982e2937/dist => packages/package-b/dist"
          );
          console.log(
            "../caches/with-partial-cascading-change/development/app-b/4505dc9761270c4133da56c04572d22650001cb722a99ed0862ad56c2e9465ee/dist/index.js => apps/app-b/dist/index.js"
          );
        });
      });
    });

    describe("on a cache with a single change", () => {
      beforeEach(async () => {
        await main(tmp, cacheWithSingleChange, "read", [], {
          concurrency: 1,
        });
      });

      it("copies cached files into the repo", () => {
        expect(console.log, "to have calls satisfying", () => {
          console.log(
            "../caches/with-single-change/development/package-c/d13a3b760af8df0c0eb6115c9d91e69e9aedc60f6ba34f17affef0c56df03f11/dist/index.js => packages/package-c/dist/index.js"
          );
          console.log(
            "../caches/with-single-change/development/package-b/2c29829c5b81e8e9f786c77315cd073f7e8c51cb6bed7756123d4681982e2937/dist => packages/package-b/dist"
          );
          console.log(
            "../caches/with-single-change/development/app-a/e1a5eadec3480af8072f7e13dfad12f0c246eb8e5ea48229058840dacf285d81/dist => apps/app-a/dist"
          );
        });
      });
    });

    describe("on a cache that is in-sync", () => {
      beforeEach(async () => {
        await main(tmp, cacheInSync, "read", [], {
          concurrency: 1,
        });
      });

      it("copies cached files into the repo", () => {
        expect(console.log, "to have calls satisfying", () => {
          console.log(
            "../caches/in-sync/development/package-c/d13a3b760af8df0c0eb6115c9d91e69e9aedc60f6ba34f17affef0c56df03f11/dist/index.js => packages/package-c/dist/index.js"
          );
          console.log(
            "../caches/in-sync/development/package-b/2c29829c5b81e8e9f786c77315cd073f7e8c51cb6bed7756123d4681982e2937/dist => packages/package-b/dist"
          );
          console.log(
            "../caches/in-sync/development/app-b/4505dc9761270c4133da56c04572d22650001cb722a99ed0862ad56c2e9465ee/dist/index.js => apps/app-b/dist/index.js"
          );
          console.log(
            "../caches/in-sync/development/app-a/e1a5eadec3480af8072f7e13dfad12f0c246eb8e5ea48229058840dacf285d81/dist => apps/app-a/dist"
          );
        });
      });
    });
  });

  describe("write", () => {
    describe("on a cache with cascading changes", () => {
      beforeEach(async () => {
        await fs.copy(cacheWithCascadingChange, tmp);
        await main(cwd, tmp, "write", [], {
          concurrency: 1,
        });
      });

      it("copies cached files into the repo", () => {
        console.log(
          "packages/package-c/dist/index.js => ../tmp/development/package-c//dist/index.js"
        );
        console.log(
          "packages/package-b/dist => ../tmp/development/package-b/7b00fb1e6e1fede9e31cf43713b516cfeef733806875a8cd671df718a2e8a65f/dist"
        );
        console.log(
          '"Tue, 30 Jun 2020 21:10:00 GMT" => ../tmp/development/package-a/55b1498eb7de5a2a672eeeb89e72c64a4a37702c187f55b2842c20f90aca6030/timestamp.txt'
        );
        console.log(
          "apps/app-b/dist/index.js => ../tmp/development/app-b/9b07a7ccce91e4bb68d2f4d624a2ada53a25bcabb02ee8a5ea5becd4853b462f/dist/index.js"
        );
        console.log(
          "apps/app-a/dist => ../tmp/development/app-a/b4c4a5cce290812ef6d1d721fecfef7f6c8d8bbba21b161f28b6057e50fc1d76/dist"
        );
      });
    });

    describe("on a cache with partial cascading changes", () => {
      beforeEach(async () => {
        await fs.copy(cacheWithPartialCascadingChange, tmp);
        await main(cwd, tmp, "write", [], {
          concurrency: 1,
        });
      });

      it("copies cached files into the repo", () => {
        expect(console.log, "to have calls satisfying", () => {
          console.log(
            '"Tue, 30 Jun 2020 21:10:00 GMT" => ../tmp/development/package-a/4aeb1c73aa5bb1634e008e56e63f9d8be001be6b02cb86306bef10284e67cfb5/timestamp.txt'
          );
          console.log(
            "apps/app-a/dist => ../tmp/development/app-a/e1a5eadec3480af8072f7e13dfad12f0c246eb8e5ea48229058840dacf285d81/dist"
          );
        });
      });
    });

    describe("on a cache with a single change", () => {
      beforeEach(async () => {
        await fs.copy(cacheWithSingleChange, tmp);
        await main(cwd, tmp, "write", [], { concurrency: 1 });
      });

      it("copies cached files into the repo", () => {
        expect(console.log, "to have calls satisfying", () => {
          console.log(
            "apps/app-b/dist/index.js => ../tmp/development/app-b/4505dc9761270c4133da56c04572d22650001cb722a99ed0862ad56c2e9465ee/dist/index.js"
          );
        });
      });
    });

    describe("on a cache that is in-sync", () => {
      beforeEach(async () => {
        await fs.copy(cacheInSync, tmp);
        await main(cwd, tmp, "write", [], { concurrency: 1 });
      });

      it("copies cached files into the repo", () => {
        expect(console.log, "was not called");
      });
    });
  });

  describe("clean", () => {
    const updateTimeStamps = async (time, ...paths) => {
      await fs.utimes(path.join(tmp, "development", ...paths), time, time);
    };

    beforeEach(async () => {
      await fs.copy(cacheInSync, tmp, { preserveTimestamps: true });
      const beforeLimit = new Date("Tue, 20 Jun 2020 21:10:00 GMT");
      const afterLimit = new Date("Tue, 28 Jun 2020 21:10:00 GMT");

      await updateTimeStamps(
        beforeLimit,
        "app-a",
        "e1a5eadec3480af8072f7e13dfad12f0c246eb8e5ea48229058840dacf285d81"
      );

      await updateTimeStamps(
        beforeLimit,
        "package-b",
        "2c29829c5b81e8e9f786c77315cd073f7e8c51cb6bed7756123d4681982e2937"
      );

      await updateTimeStamps(
        afterLimit,
        "package-a",
        "4aeb1c73aa5bb1634e008e56e63f9d8be001be6b02cb86306bef10284e67cfb5"
      );

      await main(cwd, tmp, "clean", [], { concurrency: 1, olderThan: 8 });
    });

    it("removes old directories", () => {
      expect(console.log, "to have calls satisfying", () => {
        console.log(
          "Removed ../tmp/development/app-a/e1a5eadec3480af8072f7e13dfad12f0c246eb8e5ea48229058840dacf285d81"
        );
        console.log(
          "Removed ../tmp/development/package-b/2c29829c5b81e8e9f786c77315cd073f7e8c51cb6bed7756123d4681982e2937"
        );
      });
    });
  });
});
