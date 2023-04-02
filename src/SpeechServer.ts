import Fastify from "fastify";
import fs from "fs";
import vosk from "vosk";
import { join } from "path";
import dotenv from "dotenv";
import colors from "colors";
import axios from "axios";
import FormData from "form-data";

dotenv.config();

const fastify = Fastify({
    logger: false
});

fastify.post("/text", async(req, res) => {
    const path = req.body["path"];
    const text = await audioToText(path);
    res.type("application/json").code(200);
    return { text };
})

fastify.listen({ port: Number(process.env.FASTIFY_SERVER) }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(colors.green(`Fastify server listening on ${address}`));
});

export async function audioToText(path:string, useVosk:boolean = false): Promise<string> {
    return new Promise(async(resolve, reject) => {
        if (!fs.existsSync(path)) {
            throw new Error("File does not exist.");
        }
        if (useVosk) {
            if (!fs.existsSync(join(__dirname, "../model"))) {
                throw new Error("Model does not exist. Please download from https://alphacephei.com/vosk/models and extract to the model folder.");
            }
    
            vosk.setLogLevel(0); // Disable log spamming
            const model = new vosk.Model(join(__dirname, "../model"));
            const sampleRate = 16000;
    
            const recognizer = new vosk.Recognizer({ model: model, sampleRate: sampleRate });
            
            const audio = fs.readFileSync(path);
            const buffer = Buffer.from(audio);
    
            recognizer.acceptWaveform(buffer);
            console.log(colors.yellow("Recognizing..."));
            let transcript = recognizer.finalResult();
            if (!transcript || transcript.length === 0) {
                transcript = recognizer.result();
            }
            if (!transcript || transcript.length === 0) {
                transcript = "No result.";
            }
            console.log(colors.green("Recognized."));
            resolve(transcript.text ?? { text: "No result." });
        } else {
            const form = new FormData();
            form.append("audio_file", fs.createReadStream(path), { contentType: "audio/wav" });

            const req = await axios.post(String(process.env.WHISPER) + "/asr?task=transcribe&language=en&output=json", form, {
                headers: {
                    ...form.getHeaders(),
                    "Accept": "application/json"
                }
            })
            const data = req.data;
            resolve(data.text);
        }
    })
}