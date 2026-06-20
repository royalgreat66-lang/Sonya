export async function playGeminiTTS(
  text: string,
  apiKey: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<{ stop: () => void } | null> {
  if (!apiKey || !text) return null;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Aoede' },
              },
            },
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    const inlineData = part?.inlineData;
    const base64Data = inlineData?.data;

    if (!base64Data) {
      throw new Error('No base64 audio data found in response');
    }

    if (onStart) onStart();

    // Decode base64 to binary ArrayBuffer
    const binaryString = window.atob(base64Data);
    const len = binaryString.length;
    const arrayBuffer = new ArrayBuffer(len);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < len; i++) {
      view[i] = binaryString.charCodeAt(i);
    }

    // Convert bytes to Float32 for Web Audio API (Linear PCM 16-bit signed)
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const int16Array = new Int16Array(arrayBuffer);
    const numberOfSamples = int16Array.length;
    const sampleRate = 24000; // Gemini TTS output defaults to 24kHz

    const buffer = audioCtx.createBuffer(1, numberOfSamples, sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < numberOfSamples; i++) {
      channelData[i] = int16Array[i] / 32768.0;
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    
    source.onended = () => {
      if (onEnd) onEnd();
      try {
        audioCtx.close();
      } catch (e) {}
    };

    source.start();

    return {
      stop: () => {
        try {
          source.stop();
        } catch (e) {}
        try {
          audioCtx.close();
        } catch (e) {}
      }
    };
  } catch (err) {
    console.error('Gemini TTS playback failed:', err);
    if (onEnd) onEnd();
    return null;
  }
}
