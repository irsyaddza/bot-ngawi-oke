const fs = require('fs');
const path = require('path');

// Temp directory for audio files
const tempDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * Transcribe audio using ElevenLabs Scribe API
 * @param {Buffer} audioBuffer - PCM audio buffer
 * @param {string} languageCode - Language code (default: 'id' for Indonesian)
 * @returns {Promise<string>} - Transcribed text
 */
async function transcribeAudio(audioBuffer, languageCode = 'id') {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
        throw new Error('ELEVENLABS_API_KEY is not set in .env');
    }

    // Save buffer to temp file (ElevenLabs needs a file)
    const tempFile = path.join(tempDir, `stt-${Date.now()}.wav`);

    // Create WAV header for PCM data
    const wavBuffer = createWavBuffer(audioBuffer);
    fs.writeFileSync(tempFile, wavBuffer);

    try {
        // Create form data
        const formData = new FormData();
        const fileBlob = new Blob([fs.readFileSync(tempFile)], { type: 'audio/wav' });
        formData.append('file', fileBlob, 'audio.wav');
        formData.append('model_id', 'scribe_v1');
        formData.append('language_code', languageCode);

        const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`ElevenLabs STT Error: ${JSON.stringify(error)}`);
        }

        const result = await response.json();
        return result.text || '';

    } finally {
        // Cleanup temp file
        fs.unlink(tempFile, () => { });
    }
}

/**
 * Create WAV buffer from PCM data
 * @param {Buffer} pcmBuffer - Raw PCM audio data
 * @param {number} sampleRate - Sample rate (default: 48000 for Discord)
 * @param {number} channels - Number of channels (default: 2 for stereo)
 * @param {number} bitsPerSample - Bits per sample (default: 16)
 * @returns {Buffer} - WAV file buffer
 */
function createWavBuffer(pcmBuffer, sampleRate = 48000, channels = 2, bitsPerSample = 16) {
    const byteRate = sampleRate * channels * (bitsPerSample / 8);
    const blockAlign = channels * (bitsPerSample / 8);
    const dataSize = pcmBuffer.length;
    const headerSize = 44;
    const fileSize = headerSize + dataSize - 8;

    const header = Buffer.alloc(headerSize);

    // RIFF header
    header.write('RIFF', 0);
    header.writeUInt32LE(fileSize, 4);
    header.write('WAVE', 8);

    // fmt chunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);

    // data chunk
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    return Buffer.concat([header, pcmBuffer]);
}

module.exports = {
    transcribeAudio,
    createWavBuffer
};
