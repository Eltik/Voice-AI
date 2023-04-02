import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "path";
import Core, { Options } from "./Core";
import colors from "colors";
import dotenv from "dotenv";

export default class Instance {
    private options:Options;
    private core:Core;

    constructor(options?:Options) {
        dotenv.config();
        if (options) {
            this.options = options;
        } else {
            this.options = {};
        }
        this.core = new Core(this.options);
    }

    public async start() {
        let mainWindow: BrowserWindow;

        app.whenReady().then(() => {
            app.on("activate", function () {
                if (BrowserWindow.getAllWindows().length === 0) createWindow()
            })
        });

        app.on("ready", () => {
            console.log(colors.green("Started Electron App."));
        });

        app.on("window-all-closed", function () {
            if (process.platform !== 'darwin') app.quit()
        })

        ipcMain.on("start-record", async(event, title) => {
            const webContents = event.sender;
            const win = BrowserWindow.fromWebContents(webContents)
            win.setTitle(title)

            console.log(colors.green("Started recording..."));
            await this.core.startRecording(join(__dirname, "../input.wav"));
        })

        ipcMain.on("stop-record", async(event, title) => {
            const webContents = event.sender;
            const win = BrowserWindow.fromWebContents(webContents)
            win.setTitle(title)

            await this.core.stopRecording();
            console.log(colors.red("Stopped recording."));

            const text = await this.core.audioToText(join(__dirname, "../input.wav"));
            console.log(colors.yellow("Transcribed the audio file."));
            win.setTitle("Transcribed audio...");

            const japanese = await this.core.toJapanese(text);
            console.log(colors.yellow("Translated the text to Japanese."));
            win.setTitle("Translated text...");

            const audioData = await this.core.getAudioData(japanese, 1);
            console.log(colors.yellow("Received audio response."));
            win.setTitle("Received audio response...");

            await this.core.vox(1, audioData, join(__dirname, "../output.wav"));
            console.log(colors.green("Received audio file."));
            win.setTitle("Received audio file...");

            await this.core.playAudio(join(__dirname, "../output.wav"));

            setTimeout(() => {
                win.setTitle("Dumb Project");
            }, 1000);
        })

        function createWindow() {
            mainWindow = new BrowserWindow({
                webPreferences: {
                    preload: join(__dirname, './preload.js')
                }
            })
            mainWindow.loadFile(join(__dirname, "./index.html"));
        }
    }
}