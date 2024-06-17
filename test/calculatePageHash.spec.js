const calculatePackageHash = require("../lib/calculatePackageHash");
const expect = require("unexpected");

describe("calculatePackageHash", () => {
  describe("on a regular dependency tree", () => {
    const d = {
      name: "d",
      filesHash: "d",
      localDependencies: [],
    };
    const c = {
      name: "c",
      filesHash: "c",
      localDependencies: [d],
    };
    const b = {
      name: "b",
      filesHash: "b",
      localDependencies: [c, d],
    };
    const a = {
      name: "a",
      filesHash: "a",
      localDependencies: [b, d],
    };

    it("returns the combined hash of the dependencies", () => {
      const hash = calculatePackageHash(a);
      expect(
        hash,
        "to equal",
        "a17dda3f5b5eeb90988400a380f763a87050baba91e3ddedeb6fa747e2ea500b"
      );
    });
  });

  describe("on a circular dependency tree", () => {
    const d = {
      name: "d",
      filesHash: "d",
      localDependencies: [],
    };
    const c = {
      name: "c",
      filesHash: "c",
      localDependencies: [d],
    };
    const b = {
      name: "b",
      filesHash: "b",
      localDependencies: [c, d],
    };
    const a = {
      name: "a",
      filesHash: "a",
      localDependencies: [b, d],
    };

    c.localDependencies.push(a);

    it("throw a circular dependencies error", () => {
      expect(
        () => calculatePackageHash(a),
        "to throw",
        "Circular dependencies: a -> b -> c -> a"
      );
    });
  });
});
