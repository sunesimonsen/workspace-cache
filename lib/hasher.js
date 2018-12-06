const crypto = require("crypto");
const { step } = require("@transformation/core");

const hasher = () =>
  step(async ({ take, put, CLOSED }) => {
    const hash = crypto.createHash("sha256");

    while (true) {
      const value = await take();
      if (value === CLOSED) break;

      hash.update(value);
    }

    await put(hash.digest("hex"));
  });

module.exports = hasher;
