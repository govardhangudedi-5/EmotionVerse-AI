/**
 * Audio Encoding Utilities for Browser Media Streams
 * Converts compressed browser audio recordings (WebM/Opus, OGG) into standard
 * 16-bit Mono PCM WAV Blobs compatible with backend libsndfile, scipy, and wave.
 */

export async function convertBlobToWav(
  audioBlob: Blob,
  targetSampleRate: number = 16000
): Promise<Blob> {
  // If already a wav file with standard RIFF header, check if conversion needed
  if (audioBlob.type === "audio/wav" && audioBlob.size > 100) {
    return audioBlob;
  }

  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) {
      return audioBlob;
    }

    const audioCtx = new AudioContextClass();
    try {
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      return audioBufferToWavBlob(audioBuffer, targetSampleRate);
    } finally {
      audioCtx.close().catch(() => {});
    }
  } catch (err) {
    console.warn("Failed to convert audio in browser to PCM WAV, sending raw blob:", err);
    return audioBlob;
  }
}

export function audioBufferToWavBlob(
  audioBuffer: AudioBuffer,
  targetSampleRate: number = 16000
): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const srcLength = audioBuffer.length;
  const srcSampleRate = audioBuffer.sampleRate;

  // Downmix to mono float32
  let monoData: Float32Array;
  if (numChannels === 1) {
    monoData = audioBuffer.getChannelData(0);
  } else {
    monoData = new Float32Array(srcLength);
    const ch0 = audioBuffer.getChannelData(0);
    const ch1 = audioBuffer.getChannelData(1);
    for (let i = 0; i < srcLength; i++) {
      monoData[i] = (ch0[i] + ch1[i]) / 2;
    }
  }

  // Resample to targetSampleRate (typically 16000Hz) if needed
  let resampledData: Float32Array;
  if (srcSampleRate === targetSampleRate) {
    resampledData = monoData;
  } else {
    const ratio = srcSampleRate / targetSampleRate;
    const newLength = Math.round(srcLength / ratio);
    resampledData = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const srcIndex = i * ratio;
      const indexFloor = Math.floor(srcIndex);
      const frac = srcIndex - indexFloor;
      const s0 = monoData[indexFloor] || 0;
      const s1 = monoData[Math.min(indexFloor + 1, srcLength - 1)] || 0;
      resampledData[i] = s0 + frac * (s1 - s0); // linear interpolation
    }
  }

  const numSamples = resampledData.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // Helper to write ASCII strings
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF identifier
  writeString(0, "RIFF");
  // File length - 8
  view.setUint32(4, 36 + numSamples * 2, true);
  // RIFF type
  writeString(8, "WAVE");

  // Format chunk identifier
  writeString(12, "fmt ");
  // Format chunk length (16 for PCM)
  view.setUint32(16, 16, true);
  // Sample format (1 = PCM)
  view.setUint16(20, 1, true);
  // Channel count (1 = Mono)
  view.setUint16(22, 1, true);
  // Sample rate
  view.setUint32(24, targetSampleRate, true);
  // Byte rate (SampleRate * 1 channel * 2 bytes)
  view.setUint32(28, targetSampleRate * 2, true);
  // Block align (1 channel * 2 bytes)
  view.setUint16(32, 2, true);
  // Bits per sample
  view.setUint16(34, 16, true);

  // Data chunk identifier
  writeString(36, "data");
  // Data chunk length
  view.setUint32(40, numSamples * 2, true);

  // Write 16-bit signed PCM samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, resampledData[i]));
    const intSample = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}
