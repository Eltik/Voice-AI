# Dumb-Project
Convert your own voice into an anime character's. Sort of.

## Background
This project uses AI tools and pure NodeJS to convert your voice into an anime waifu's voice. It's very dumb, but it's fun to mess around with. This project DOES require the use of outside tools such as VoiceMeeter or CASTER if you're on Mac, but it's relatively lightweight.

## Requirements
- NodeJS version 16+
- [Sox](https://www.npmjs.com/package/node-record-lpcm16#debugging)
- Docker
- WhisperAI
- NVIDIA GPU (if you're hosting VoiceVox yourself)
- Python (if you're hosting VoiceVox yourself)

## Installation
Installing is relatively annoying, but worth-it in the end.

### WhisperAI
WhisperAI is recommended as it's fast and accurate. You can run the Docker image below to start up your own WhisperAI server.
Docker image [here](https://hub.docker.com/r/onerahmet/openai-whisper-asr-webservice).
```bash
docker pull onerahmet/openai-whisper-asr-webservice
docker run -d -p 9000:9000 -e ASR_MODEL=base onerahmet/openai-whisper-asr-webservice:latest
```
### Sox
Sox is required to allow the Electron app to record your voice. 
You can install Sox via [this NPM page](https://www.npmjs.com/package/node-record-lpcm16#debugging). It should be pretty self-explanatory.
#### MacOS
It is preferable you use Homebrew to install Sox on MacOS. Homebrew can be used for basically everything.
```bash
brew install sox
```

#### Linux
```bash
sudo apt-get install sox libsox-fmt-all
```

#### Windows
Windows has some binaries [here](https://sourceforge.net/projects/sox/files/latest/download) on SourceForge.

### VoiceVox
If you are hosting VoiceVox yourself, you need a <b>NVIDIA GPU</b> since VoiceVox uses some weird techniques for generating voices. It is super annoying since basically most MacOS users are screwed over lol. Anyways, to host VoiceVox you must use Docker to pull the code and host it. You can download Docker [here](https://hub.docker.com/).
```bash
# Install
docker pull voicevox/voicevox_engine:cpu-latest

# Run
docker run --rm -p '127.0.0.1:50021:50021' voicevox/voicevox_engine:cpu-latest
```
You can now visit `https://localhost:50021/docs` to see the VoiceVox docs.
- Link to the Docker page is [here](https://hub.docker.com/r/voicevox/voicevox_engine).
- Source code for VoiceVox engine is [here](https://github.com/VOICEVOX/voicevox_engine/releases/tag/0.14.2).

## External Libraries
After running `npm start`, you can download either VoiceMeeter if you're on Windows or [CASTER](https://gingeraudio.com/groundcontrol-caster/) if you're on MacOS to redirect desktop audio to your microphone. This will allow you to have the waifu's voice come out rather than your own.

## Modifying the Code
After installing everything, you can now run the project via `npm start` or `npm run start`. If you installed everything correctly, simply pressing `p`, talking into your microphone, and then releasing `p` should result in some stuff being logged in the console and an `output.wav` file being exported. If you want to change these settings, just edit the `.env` file. Everything should be self-explanatory, but note that if you are hosting your VoiceVox API elsewhere, you will need to change the `VOICE_VOX` value in the `.env` config.