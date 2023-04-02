"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.audioToText = void 0;
const fastify_1 = __importDefault(require("fastify"));
const fs_1 = __importDefault(require("fs"));
const vosk_1 = __importDefault(require("vosk"));
const path_1 = require("path");
const dotenv_1 = __importDefault(require("dotenv"));
const colors_1 = __importDefault(require("colors"));
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
dotenv_1.default.config();
const fastify = (0, fastify_1.default)({
    logger: false
});
fastify.post("/text", async (req, res) => {
    const path = req.body["path"];
    const text = await audioToText(path);
    res.type("application/json").code(200);
    return { text };
});
fastify.listen({ port: Number(process.env.FASTIFY_SERVER) }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(colors_1.default.green(`Fastify server listening on ${address}`));
});
async function audioToText(path, useVosk = false) {
    return new Promise(async (resolve, reject) => {
        if (!fs_1.default.existsSync(path)) {
            throw new Error("File does not exist.");
        }
        if (useVosk) {
            if (!fs_1.default.existsSync((0, path_1.join)(__dirname, "../model"))) {
                throw new Error("Model does not exist. Please download from https://alphacephei.com/vosk/models and extract to the model folder.");
            }
            vosk_1.default.setLogLevel(0); // Disable log spamming
            const model = new vosk_1.default.Model((0, path_1.join)(__dirname, "../model"));
            const sampleRate = 16000;
            const recognizer = new vosk_1.default.Recognizer({ model: model, sampleRate: sampleRate });
            const audio = fs_1.default.readFileSync(path);
            const buffer = Buffer.from(audio);
            recognizer.acceptWaveform(buffer);
            console.log(colors_1.default.yellow("Recognizing..."));
            let transcript = recognizer.finalResult();
            if (!transcript || transcript.length === 0) {
                transcript = recognizer.result();
            }
            if (!transcript || transcript.length === 0) {
                transcript = "No result.";
            }
            console.log(colors_1.default.green("Recognized."));
            resolve(transcript.text ?? { text: "No result." });
        }
        else {
            const form = new form_data_1.default();
            form.append("audio_file", fs_1.default.createReadStream(path), { contentType: "audio/wav" });
            const req = await axios_1.default.post(String(process.env.WHISPER) + "/asr?task=transcribe&language=en&output=json", form, {
                headers: {
                    ...form.getHeaders(),
                    "Accept": "application/json"
                }
            });
            const data = req.data;
            resolve(data.text);
        }
    });
}
exports.audioToText = audioToText;
//# sourceMappingURL=SpeechServer.js.map