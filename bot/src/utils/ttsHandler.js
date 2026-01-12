const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const path = require('path');
const fs = require('fs');

// Ensure temp directory exists
const tempDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

async function generateTTS(text, voice) {
    const provider = voice.provider || 'msedge'; // Default to msedge

    if (provider === 'elevenlabs') {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) throw new Error('ElevenLabs API Key is missing!');

        const voiceId = voice.id;
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': apiKey
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`ElevenLabs Error: ${JSON.stringify(error)}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Save to temp file
        const fileName = `tts-eleven-${Date.now()}.mp3`;
        const filePath = path.join(tempDir, fileName);
        fs.writeFileSync(filePath, buffer);

        return filePath;

    } else {
        // Fallback or Default: MS Edge TTS
        const tts = new MsEdgeTTS();
        await tts.setMetadata(voice.id, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

        // toFile returns { audioFilePath, metadataFilePath }
        const result = await tts.toFile(tempDir, text);
        return result.audioFilePath;
    }
}

module.exports = { generateTTS };
