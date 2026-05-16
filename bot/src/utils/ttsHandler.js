const path = require('path');
const fs = require('fs');

// Ensure temp directory exists
const tempDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Edge TTS API base URL (Docker service name)
const EDGE_TTS_URL = process.env.EDGE_TTS_URL || 'http://edge-tts:5050';

async function generateTTS(text, voice) {
    const provider = voice.provider || 'edge-tts'; // Default to edge-tts

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
        // Edge TTS via openai-edge-tts (self-hosted, free)
        const edgeTtsVoice = voice.id || 'id-ID-ArdiNeural';
        
        try {
            const response = await fetch(`${EDGE_TTS_URL}/v1/audio/speech`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'tts-1',
                    input: text,
                    voice: edgeTtsVoice,
                    response_format: 'mp3',
                    speed: voice.speed || 1.0
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Edge TTS API Error (${response.status}): ${errorText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const fileName = `tts-edge-${Date.now()}.mp3`;
            const filePath = path.join(tempDir, fileName);
            fs.writeFileSync(filePath, buffer);

            return filePath;
        } catch (error) {
            throw new Error(`Edge TTS Error: ${error.message}`);
        }
    }
}

module.exports = { generateTTS };
