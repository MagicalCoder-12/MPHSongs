type WhisperTranscriber = (
  audio: Float32Array,
  options: {
    language: string;
    task: 'transcribe';
    return_timestamps: false;
  }
) => Promise<{ text?: string }>;

let transcriberPromise: Promise<WhisperTranscriber> | null = null;

const loadTranscriber = async () => {
  if (!transcriberPromise) {
    transcriberPromise = import('@huggingface/transformers').then(async ({ env, pipeline }) => {
      env.allowLocalModels = false;
      const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny');
      return transcriber as unknown as WhisperTranscriber;
    });
  }

  return transcriberPromise;
};

const resampleAudio = (audioBuffer: AudioBuffer, targetSampleRate: number) => {
  const sourceData = audioBuffer.getChannelData(0);
  const sampleRatio = audioBuffer.sampleRate / targetSampleRate;
  const targetLength = Math.round(sourceData.length / sampleRatio);
  const targetData = new Float32Array(targetLength);

  for (let targetIndex = 0; targetIndex < targetLength; targetIndex += 1) {
    const sourceIndex = targetIndex * sampleRatio;
    const lowerIndex = Math.floor(sourceIndex);
    const upperIndex = Math.min(lowerIndex + 1, sourceData.length - 1);
    const interpolation = sourceIndex - lowerIndex;
    targetData[targetIndex] = sourceData[lowerIndex] * (1 - interpolation) + sourceData[upperIndex] * interpolation;
  }

  return targetData;
};

const decodeAudio = async (audioBlob: Blob) => {
  const audioContext = new AudioContext();
  try {
    const audioBuffer = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());
    return resampleAudio(audioBuffer, 16000);
  } finally {
    await audioContext.close();
  }
};

export async function transcribeAudio(audioBlob: Blob, language: 'en' | 'te') {
  const audio = await decodeAudio(audioBlob);
  const transcriber = await loadTranscriber();
  const result = await transcriber(audio, {
    language,
    task: 'transcribe',
    return_timestamps: false,
  });

  return result.text?.trim() ?? '';
}
