/**
 * @description Starts the electron app.
 */

const Instance = require("./built/Instance").default;
const instance = new Instance();
instance.start();