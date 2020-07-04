const { step } = require("@transformation/core");

const spinner = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

const heartbeat = (heartbeatValue, rate = 500) =>
  step(async ({ take, put, CLOSED }) => {
    let spinnerIndex = 0;
    let writtenHeartbeat = false;
    let timer;
    const startTimeout = () => {
      timer = setTimeout(() => {
        process.stdout.write(
          "\u001b[2K\u001b[1G" +
            spinner[spinnerIndex % spinner.length] +
            " " +
            heartbeatValue
        );
        spinnerIndex++;
        writtenHeartbeat = true;
        clearTimeout(timer);
        startTimeout();
      }, rate);
    };

    startTimeout();

    while (true) {
      const value = await take();
      if (value === CLOSED) break;
      if (writtenHeartbeat) {
        process.stdout.write("\u001b[2K\u001b[1G");
      }
      writtenHeartbeat = false;
      await put(value);
    }

    clearTimeout(timer);
  });

module.exports = heartbeat;
