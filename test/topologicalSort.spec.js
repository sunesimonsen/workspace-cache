const { program, emitAll, forEach } = require("@transformation/core");
const sortTopological = require("../lib/sortTopological");
const expect = require("unexpected");

describe("sortTopological", () => {
  it("sorts packages in topological order", async () => {
    const f = { name: "f", hierarchy: "shared", localDependencies: [] };
    const e = { name: "e", hierarchy: "shared", localDependencies: [f] };
    const d = { name: "d", hierarchy: "shared", localDependencies: [e] };
    const c = { name: "c", hierarchy: "shared", localDependencies: [] };
    const b = { name: "b", hierarchy: "shared", localDependencies: [c, f] };
    const a = { name: "a", hierarchy: "root", localDependencies: [b, c, d] };
    const packages = [a, b, c, d, e, f];

    const result = [];

    await program(
      emitAll(packages),
      sortTopological(),
      forEach((v) => result.push(v))
    );

    expect(result, "to satisfy", [f, c, e, b, d, a]);
  });
});
