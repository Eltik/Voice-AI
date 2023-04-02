"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = require("path");
const Core_1 = __importDefault(require("./Core"));
const colors_1 = __importDefault(require("colors"));
const dotenv_1 = __importDefault(require("dotenv"));
class Instance {
    constructor(options) {
        dotenv_1.default.config();
        if (options) {
            this.options = options;
        }
        else {
            this.options = {};
        }
        this.core = new Core_1.default(this.options);
    }
    async start() {
        let mainWindow;
        electron_1.app.whenReady().then(() => {
            electron_1.app.on("activate", function () {
                if (electron_1.BrowserWindow.getAllWindows().length === 0)
                    createWindow();
            });
        });
        electron_1.app.on("ready", () => {
            console.log(colors_1.default.green("Started Electron App."));
        });
        electron_1.app.on("window-all-closed", function () {
            if (process.platform !== 'darwin')
                electron_1.app.quit();
        });
        electron_1.ipcMain.on("start-record", async (event, title) => {
            const webContents = event.sender;
            const win = electron_1.BrowserWindow.fromWebContents(webContents);
            win.setTitle(title);
            console.log(colors_1.default.green("Started recording..."));
            await this.core.startRecording((0, path_1.join)(__dirname, "../input.wav"));
        });
        electron_1.ipcMain.on("stop-record", async (event, title) => {
            const webContents = event.sender;
            const win = electron_1.BrowserWindow.fromWebContents(webContents);
            win.setTitle(title);
            await this.core.stopRecording();
            console.log(colors_1.default.red("Stopped recording."));
            const text = await this.core.audioToText((0, path_1.join)(__dirname, "../input.wav"));
            console.log(colors_1.default.yellow("Transcribed the audio file."));
            win.setTitle("Transcribed audio...");
            const japanese = await this.core.toJapanese(text);
            console.log(colors_1.default.yellow("Translated the text to Japanese."));
            win.setTitle("Translated text...");
            const audioData = await this.core.getAudioData(japanese, 1);
            console.log(colors_1.default.yellow("Received audio response."));
            win.setTitle("Received audio response...");
            await this.core.vox(1, audioData, (0, path_1.join)(__dirname, "../output.wav"));
            console.log(colors_1.default.green("Received audio file."));
            win.setTitle("Received audio file...");
            await this.core.playAudio((0, path_1.join)(__dirname, "../output.wav"));
            setTimeout(() => {
                win.setTitle("Dumb Project");
            }, 1000);
        });
        function createWindow() {
            mainWindow = new electron_1.BrowserWindow({
                webPreferences: {
                    preload: (0, path_1.join)(__dirname, './preload.js')
                }
            });
            mainWindow.loadFile((0, path_1.join)(__dirname, "./index.html"));
        }
    }
}
exports.default = Instance;
//# sourceMappingURL=Instance.js.map