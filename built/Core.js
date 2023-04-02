"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_record_lpcm16_1 = __importDefault(require("node-record-lpcm16"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const node_google_translate_skidz_1 = __importDefault(require("node-google-translate-skidz"));
const util_1 = __importDefault(require("util"));
const stream_1 = __importDefault(require("stream"));
const sound_play_1 = __importDefault(require("sound-play"));
const form_data_1 = __importDefault(require("form-data"));
/**
 * @description Handles all the core functions. Recording, translating, and sending to the VoiceVox server.
 */
class Core {
    constructor(options) {
        dotenv_1.default.config();
        this.voiceVox = process.env.VOICE_VOX || "http://127.0.0.1:50021";
        this.useVosk = (process.env.USE_VOSK ? process.env.USE_VOSK.toLowerCase() === "true" : false) || false;
        this.fastifyServer = process.env.FASTIFY_SERVER || "3003";
        this.whisperServer = process.env.WHISPER || "http://localhost:9000";
        if (options) {
            if (options.voiceVox) {
                this.voiceVox = options.voiceVox;
            }
            if (options.useVosk) {
                this.useVosk = options.useVosk;
            }
            if (options.whisperServer) {
                this.whisperServer = options.whisperServer;
            }
            if (options.fastifyServer) {
                this.fastifyServer = options.fastifyServer;
            }
        }
    }
    /**
     * @description Starts recording.s
     * @param path Path to save the file. Ex. test.wav
     */
    startRecording(path) {
        this.recSession = node_record_lpcm16_1.default.record({
            sampleRateHertz: 48000,
        });
        const file = fs_1.default.createWriteStream(path, { encoding: "binary" });
        this.recSession.stream().pipe(file);
    }
    stopRecording() {
        if (this.recSession) {
            this.recSession.stop();
        }
    }
    /**
     * @description Streams audio to the microphone
     * @param path Path to the audio file
     */
    async playAudio(path) {
        sound_play_1.default.play(path);
    }
    /**
     * @description Uses Vosk to convert audio to text.
     * @param path Path to the audio file. Ex. test.wav
     * @param useVosk Whether to use Vosk or not. Vosk is relatively accurate AND is local, but it's much slower. It's better to use WhisperAI instead.
     * @returns Promise<string>
     */
    async audioToText(path, useVosk = this.useVosk) {
        if (useVosk) {
            // Send request to fastify server
            const { data } = await axios_1.default.post(`http://localhost:${this.fastifyServer}/text`, {
                path: path
            }).catch((err) => {
                console.log(err);
                return null;
            });
            console.log(data);
            return data.text;
        }
        else {
            const form = new form_data_1.default();
            form.append("audio_file", fs_1.default.createReadStream(path), { contentType: "audio/wav" });
            const { data } = await axios_1.default.post(this.whisperServer + "/asr?task=transcribe&language=en&output=json", form, {
                headers: {
                    ...form.getHeaders(),
                    "Accept": "application/json"
                }
            });
            console.log({ text: data.text });
            return data.text;
        }
    }
    async toJapanese(text) {
        return new Promise((resolve, reject) => {
            (0, node_google_translate_skidz_1.default)({
                text: text,
                source: "en",
                target: "ja"
            }, function (result) {
                resolve(result.translation);
            });
        });
    }
    /**
     * @description Sends audio to the VoiceVox server.
     * @param speech Japanese text
     * @param speaker Speaker ID
     * @returns
     */
    async getAudioData(speech, speaker) {
        const { data } = await axios_1.default.post(`${this.voiceVox}/audio_query?text=${encodeURIComponent(speech)}&speaker=${speaker}`, {}, {
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST"
        });
        return data;
    }
    /**
     * @description Converts the audio query to a WAV file.
     * @param speaker Speaker ID
     * @param audioQuery Audio query taken from the getAudioData function
     * @returns
     */
    async vox(speaker, audioQuery, path) {
        const { data } = await axios_1.default.post(`${this.voiceVox}/synthesis?speaker=${speaker}`, audioQuery, {
            headers: {
                "Accept": "audio/wav",
                "Content-Type": "application/json",
            },
            responseType: "stream",
        });
        const streamPipeline = util_1.default.promisify(stream_1.default.pipeline);
        return new Promise((resolve, reject) => {
            streamPipeline(data, fs_1.default.createWriteStream(path)).then(() => {
                resolve(path);
            });
        });
    }
}
exports.default = Core;
//# sourceMappingURL=Core.js.map