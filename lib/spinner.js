const { step } = require("@transformation/core");
const supportsColor = require("supports-color");

const killLine = "\u001b[2K\u001b[1G";
class Spinner {
  constructor({ characters, rate }) {
    this.characters = characters;
    this.rate = rate;
  }

  start() {
    this.index = 0;

    this.interval = setInterval(() => {
      this.print(this.characters[this.index++ % this.characters.length]);
    }, this.rate);
  }

  startIn(timeout) {
    this.timeout = setTimeout(() => {
      this.start();
    }, timeout);
  }

  stop() {
    clearTimeout(this.timeout);
    clearInterval(this.interval);
  }
}

class DotsSpinner extends Spinner {
  constructor(label) {
    super({
      characters: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
      rate: 100,
    });
    this.label = label;
    this.hasOutput = false;
  }

  print(c) {
    process.stdout.write(killLine + c + " " + this.label);
    this.hasOutput = true;
  }

  stop() {
    super.stop();

    if (this.hasOutput) {
      process.stdout.write(killLine);
      this.hasOutput = false;
    }
  }
}

class SimpleSpinner extends Spinner {
  constructor(label) {
    super({
      characters: ["."],
      rate: 1000,
    });
    this.label = label;
    this.hasOutput = false;
  }

  print(c) {
    process.stdout.write(c);

    if (this.index % 30 === 0) {
      process.stdout.write("\n");
    }
  }

  start() {
    process.stdout.write(this.label + "\n");
    this.hasOutput = true;
    super.start();
  }

  stop() {
    super.stop();

    if (this.hasOutput) {
      process.stdout.write("\n");
      this.hasOutput = false;
    }
  }
}

const spinner = (label, timeout = 1000) =>
  step(async ({ take, put, CLOSED }) => {
    const spinner =
      !process.env.CI && supportsColor.stdout
        ? new DotsSpinner(label)
        : new SimpleSpinner(label);

    while (true) {
      spinner.startIn(timeout);
      const value = await take();
      spinner.stop();

      if (value === CLOSED) break;

      await put(value);
    }
  });

module.exports = spinner;
