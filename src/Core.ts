import record from "node-record-lpcm16";
import fs from "fs";
import dotenv from "dotenv";
import axios from "axios";
import translate from "node-google-translate-skidz";
import util from "util";
import stream from "stream";
import sound from "sound-play";
import FormData from "form-data";

/**
 * @description Handles all the core functions. Recording, translating, and sending to the VoiceVox server.
 */
export default class Core {
    private recSession;
    private voiceVox:string;
    private useVosk:boolean;
    private fastifyServer:string;
    private whisperServer:string;

    constructor(options?:Options) {
        dotenv.config();

        this.voiceVox = process.env.VOICE_VOX || "http://127.0.0.1:50021"
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
    public startRecording(path:string) {
        this.recSession = record.record({
            sampleRateHertz: 48000,
        });
        const file = fs.createWriteStream(path, { encoding: "binary" });
        this.recSession.stream().pipe(file);
    }

    public stopRecording() {
        if (this.recSession) {
            this.recSession.stop();
        }
    }

    /**
     * @description Streams audio to the microphone
     * @param path Path to the audio file
     */
    public async playAudio(path:string) {
        sound.play(path);
    }

    /**
     * @description Uses Vosk to convert audio to text.
     * @param path Path to the audio file. Ex. test.wav
     * @param useVosk Whether to use Vosk or not. Vosk is relatively accurate AND is local, but it's much slower. It's better to use WhisperAI instead.
     * @returns Promise<string>
     */

    public async audioToText(path:string, useVosk:boolean = this.useVosk): Promise<string> {
        if (useVosk) {
            // Send request to fastify server
            const { data } = await axios.post(`http://localhost:${this.fastifyServer}/text`, {
                path: path
            }).catch((err) => {
                console.log(err);
                return null;
            });
            console.log(data);
            return data.text;
        } else {
            const form = new FormData();
            form.append("audio_file", fs.createReadStream(path), { contentType: "audio/wav" });
    
            const { data } = await axios.post(this.whisperServer + "/asr?task=transcribe&language=en&output=json", form, {
                headers: {
                    ...form.getHeaders(),
                    "Accept": "application/json"
                }
            })
            console.log({ text: data.text });
            return data.text;
        }
    }
    

    public async toJapanese(text:string): Promise<string> {
        return new Promise((resolve, reject) => {
            translate({
                text: text,
                source: "en",
                target: "ja"
            }, function(result) {
                resolve(result.translation);
            })
        })
    }

    /**
     * @description Sends audio to the VoiceVox server.
     * @param speech Japanese text
     * @param speaker Speaker ID
     * @returns 
     */
    public async getAudioData(speech:string, speaker:number): Promise<AudioData.Response> {
        const { data } = await axios.post(`${this.voiceVox}/audio_query?text=${encodeURIComponent(speech)}&speaker=${speaker}`, {}, {
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
    public async vox(speaker:number, audioQuery:AudioData.Response, path:string): Promise<any> {
        const { data } = await axios.post(`${this.voiceVox}/synthesis?speaker=${speaker}`, audioQuery, {
            headers: {
                "Accept": "audio/wav",
                "Content-Type": "application/json",
            },
            responseType: "stream",
        });

        const streamPipeline = util.promisify(stream.pipeline);
        return new Promise((resolve, reject) => {
            streamPipeline(data, fs.createWriteStream(path)).then(() => {
                resolve(path);
            });
        })
    }
}

export interface Options {
    voiceVox?: string;
    whisperServer?: string;
    useVosk?: boolean;
    fastifyServer?: string;
}

declare module AudioData {
    export interface Mora {
        text: string;
        consonant: string;
        consonant_length?: number;
        vowel: string;
        vowel_length: number;
        pitch: number;
    }

    export interface PauseMora {
        text: string;
        consonant?: any;
        consonant_length?: any;
        vowel: string;
        vowel_length: number;
        pitch: number;
    }

    export interface AccentPhrase {
        moras: Mora[];
        accent: number;
        pause_mora: PauseMora;
        is_interrogative: boolean;
    }

    export interface Response {
        accent_phrases: AccentPhrase[];
        speedScale: number;
        pitchScale: number;
        intonationScale: number;
        volumeScale: number;
        prePhonemeLength: number;
        postPhonemeLength: number;
        outputSamplingRate: number;
        outputStereo: boolean;
        kana: string;
    }
}