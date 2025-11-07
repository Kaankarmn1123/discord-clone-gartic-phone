import { useState, useEffect, useCallback, useRef } from 'react';

export interface MediaDevices {
  audioInput: MediaDeviceInfo[];
  videoInput: MediaDeviceInfo[];
  audioOutput: MediaDeviceInfo[];
}

export default function useMediaDevices() {
  const [devices, setDevices] = useState<MediaDevices>({
    audioInput: [],
    videoInput: [],
    audioOutput: [],
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const getDevices = useCallback(async () => {
    try {
      // Request permission first
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      const deviceInfos = await navigator.mediaDevices.enumerateDevices();
      const audioInput = deviceInfos.filter(d => d.kind === 'audioinput');
      const videoInput = deviceInfos.filter(d => d.kind === 'videoinput');
      const audioOutput = deviceInfos.filter(d => d.kind === 'audiooutput');
      setDevices({ audioInput, videoInput, audioOutput });
    } catch (err) {
      console.error("Error enumerating devices:", err);
      // Set empty arrays if permission is denied
       setDevices({ audioInput: [], videoInput: [], audioOutput: [] });
    }
  }, []);

  useEffect(() => {
    getDevices();
    navigator.mediaDevices.addEventListener('devicechange', getDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getDevices);
      stopMicTest(); // Cleanup on unmount
    };
  }, [getDevices]);
  
  const startMicTest = useCallback(async (deviceId: string, onVolumeChange: (volume: number) => void) => {
    stopMicTest(); // Stop any existing test

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: { deviceId: { exact: deviceId } } 
        });
        streamRef.current = stream;

        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        sourceRef.current = source;
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            
            let sum = 0;
            for(let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const avg = sum / bufferLength;
            onVolumeChange(avg); // Pass average volume to callback
            requestAnimationFrame(draw);
        };
        draw();
    } catch (err) {
        console.error("Error starting mic test:", err);
    }
  }, []);

  const stopMicTest = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  return { devices, getDevices, startMicTest, stopMicTest };
}
