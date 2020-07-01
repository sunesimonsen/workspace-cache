const path = require("path");
const sinon = require("sinon");
const fs = require("fs-extra");
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
        await main(cwd, "list", [cacheWithCascadingChange], {
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
          await main(cwd, "list", [cacheWithCascadingChange], {
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
          await main(cwd, "list", [cacheWithPartialCascadingChange], {
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
          await main(cwd, "list", [cacheWithSingleChange], {
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
          await main(cwd, "list", [cacheInSync], {
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
          await main(cwd, "list", [cacheWithCascadingChange], {
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
          await main(cwd, "list", [cacheWithPartialCascadingChange], {
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
          await main(cwd, "list", [cacheWithSingleChange], {
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
          await main(cwd, "list", [cacheInSync], {
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
        await main(cwd, "list", [cacheInSync], {
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
        await main(cwd, "list", [cacheInSync], {
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

    describe("--filter cached --hierarchy shared", () => {
      beforeEach(async () => {
        await main(cwd, "list", [cacheWithPartialCascadingChange], {
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

  describe("read", () => {
    beforeEach(async () => {
      await fs.copy(cwd, tmp);
    });

    describe("on a cache with cascading changes", () => {
      beforeEach(async () => {
        await main(tmp, "read", [cacheWithCascadingChange], {
          concurrency: 1,
        });
      });

      it("copies cached files into the repo", () => {
        expect(console.log, "was not called");
      });
    });

    describe("on a cache with partial cascading changes", () => {
      beforeEach(async () => {
        await main(tmp, "read", [cacheWithPartialCascadingChange], {
          concurrency: 1,
        });
      });

      it("copies cached files into the repo", () => {
        expect(console.log, "to have calls satisfying", () => {
          console.log(
            "../caches/with-partial-cascading-change/development/package-c/bad7f7b5128e8c6510839dca9cbc52fd058b3409da3e340d2d4aa1dac7ed9b9c/dist/index.js => packages/package-c/dist/index.js"
          );
          console.log(
            "../caches/with-partial-cascading-change/development/package-b/7b00fb1e6e1fede9e31cf43713b516cfeef733806875a8cd671df718a2e8a65f/dist => packages/package-b/dist"
          );
          console.log(
            "../caches/with-partial-cascading-change/development/app-b/9b07a7ccce91e4bb68d2f4d624a2ada53a25bcabb02ee8a5ea5becd4853b462f/dist/index.js => apps/app-b/dist/index.js"
          );
        });
      });
    });

    describe("on a cache with a single change", () => {
      beforeEach(async () => {
        await main(tmp, "read", [cacheWithSingleChange], {
          concurrency: 1,
        });
      });

      it("copies cached files into the repo", () => {
        expect(console.log, "to have calls satisfying", () => {
          console.log(
            "../caches/with-single-change/development/package-c/bad7f7b5128e8c6510839dca9cbc52fd058b3409da3e340d2d4aa1dac7ed9b9c/dist/index.js => packages/package-c/dist/index.js"
          );
          console.log(
            "../caches/with-single-change/development/package-b/7b00fb1e6e1fede9e31cf43713b516cfeef733806875a8cd671df718a2e8a65f/dist => packages/package-b/dist"
          );
          console.log(
            "../caches/with-single-change/development/app-a/b4c4a5cce290812ef6d1d721fecfef7f6c8d8bbba21b161f28b6057e50fc1d76/dist => apps/app-a/dist"
          );
        });
      });
    });

    describe("on a cache that is in-sync", () => {
      beforeEach(async () => {
        await main(tmp, "read", [cacheInSync], {
          concurrency: 1,
        });
      });

      it("copies cached files into the repo", () => {
        expect(console.log, "to have calls satisfying", () => {
          console.log(
            "../caches/in-sync/development/package-c/bad7f7b5128e8c6510839dca9cbc52fd058b3409da3e340d2d4aa1dac7ed9b9c/dist/index.js => packages/package-c/dist/index.js"
          );
          console.log(
            "../caches/in-sync/development/package-b/7b00fb1e6e1fede9e31cf43713b516cfeef733806875a8cd671df718a2e8a65f/dist => packages/package-b/dist"
          );
          console.log(
            "../caches/in-sync/development/app-b/9b07a7ccce91e4bb68d2f4d624a2ada53a25bcabb02ee8a5ea5becd4853b462f/dist/index.js => apps/app-b/dist/index.js"
          );
          console.log(
            "../caches/in-sync/development/app-a/b4c4a5cce290812ef6d1d721fecfef7f6c8d8bbba21b161f28b6057e50fc1d76/dist => apps/app-a/dist"
          );
        });
      });
    });
  });

  describe("write", () => {
    describe("on a cache with cascading changes", () => {
      beforeEach(async () => {
        await fs.copy(cacheWithCascadingChange, tmp);
        await main(cwd, "write", [tmp], {
          concurrency: 1,
        });
      });

      it("copies cached files into the repo", () => {
        console.log(
          "packages/package-c/dist/index.js => ../tmp/development/package-c/bad7f7b5128e8c6510839dca9cbc52fd058b3409da3e340d2d4aa1dac7ed9b9c/dist/index.js"
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
        await main(cwd, "write", [tmp], {
          concurrency: 1,
        });
      });

      it("copies cached files into the repo", () => {
        expect(console.log, "to have calls satisfying", () => {
          console.log(
            '"Tue, 30 Jun 2020 21:10:00 GMT" => ../tmp/development/package-a/55b1498eb7de5a2a672eeeb89e72c64a4a37702c187f55b2842c20f90aca6030/timestamp.txt'
          );
          console.log(
            "apps/app-a/dist => ../tmp/development/app-a/b4c4a5cce290812ef6d1d721fecfef7f6c8d8bbba21b161f28b6057e50fc1d76/dist"
          );
        });
      });
    });

    describe("on a cache with a single change", () => {
      beforeEach(async () => {
        await fs.copy(cacheWithSingleChange, tmp);
        await main(cwd, "write", [tmp], { concurrency: 1 });
      });

      it("copies cached files into the repo", () => {
        expect(console.log, "to have calls satisfying", () => {
          console.log(
            "apps/app-b/dist/index.js => ../tmp/development/app-b/9b07a7ccce91e4bb68d2f4d624a2ada53a25bcabb02ee8a5ea5becd4853b462f/dist/index.js"
          );
        });
      });
    });

    describe("on a cache that is in-sync", () => {
      beforeEach(async () => {
        await fs.copy(cacheInSync, tmp);
        await main(cwd, "write", [tmp], { concurrency: 1 });
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
        "218a7cd06af28032e0bf7ad62da76b084b0cfaa26790535b6c9bccba2a89c236"
      );

      await updateTimeStamps(
        beforeLimit,
        "package-b",
        "32e35f4dd16831418f00b3088ce5ee27c3462e271eb82616fdf5072b11e4b87f"
      );

      await updateTimeStamps(
        afterLimit,
        "package-a",
        "55b1498eb7de5a2a672eeeb89e72c64a4a37702c187f55b2842c20f90aca6030"
      );

      await main(cwd, "clean", [tmp], { concurrency: 1, olderThan: 8 });
    });

    it("removes old directories", () => {
      expect(console.log, "to have calls satisfying", () => {
        console.log(
          "Removed ../tmp/development/app-a/218a7cd06af28032e0bf7ad62da76b084b0cfaa26790535b6c9bccba2a89c236"
        );
        console.log(
          "Removed ../tmp/development/package-b/32e35f4dd16831418f00b3088ce5ee27c3462e271eb82616fdf5072b11e4b87f"
        );
      });
    });
  });
});
