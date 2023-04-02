/**
 * @description Handles all the core functions. Recording, translating, and sending to the VoiceVox server.
 */
export default class Core {
    private recSession;
    private voiceVox;
    private useVosk;
    private fastifyServer;
    private whisperServer;
    constructor(options?: Options);
    /**
     * @description Starts recording.s
     * @param path Path to save the file. Ex. test.wav
     */
    startRecording(path: string): void;
    stopRecording(): void;
    /**
     * @description Streams audio to the microphone
     * @param path Path to the audio file
     */
    playAudio(path: string): Promise<void>;
    /**
     * @description Uses Vosk to convert audio to text.
     * @param path Path to the audio file. Ex. test.wav
     * @param useVosk Whether to use Vosk or not. Vosk is relatively accurate AND is local, but it's much slower. It's better to use WhisperAI instead.
     * @returns Promise<string>
     */
    audioToText(path: string, useVosk?: boolean): Promise<string>;
    toJapanese(text: string): Promise<string>;
    /**
     * @description Sends audio to the VoiceVox server.
     * @param speech Japanese text
     * @param speaker Speaker ID
     * @returns
     */
    getAudioData(speech: string, speaker: number): Promise<AudioData.Response>;
    /**
     * @description Converts the audio query to a WAV file.
     * @param speaker Speaker ID
     * @param audioQuery Audio query taken from the getAudioData function
     * @returns
     */
    vox(speaker: number, audioQuery: AudioData.Response, path: string): Promise<any>;
}
export interface Options {
    voiceVox?: string;
    whisperServer?: string;
    useVosk?: boolean;
    fastifyServer?: string;
}
declare module AudioData {
    interface Mora {
        text: string;
        consonant: string;
        consonant_length?: number;
        vowel: string;
        vowel_length: number;
        pitch: number;
    }
    interface PauseMora {
        text: string;
        consonant?: any;
        consonant_length?: any;
        vowel: string;
        vowel_length: number;
        pitch: number;
    }
    interface AccentPhrase {
        moras: Mora[];
        accent: number;
        pause_mora: PauseMora;
        is_interrogative: boolean;
    }
    interface Response {
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
export {};
