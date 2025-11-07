// src/hooks/useAgora.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import AgoraRTC, { 
    IAgoraRTCRemoteUser, 
    IMicrophoneAudioTrack, 
    ICameraVideoTrack, 
    ConnectionState, 
    ConnectionDisconnectedReason, 
    ILocalVideoTrack, 
    UID,
    ILocalTrack
} from 'agora-rtc-sdk-ng';
import { supabase } from '../services/supabaseClient';

const AGORA_APP_ID = '83bcfc40ad33416a94e3d24c63b063c2';
const JOIN_TIMEOUT = 20000; // 20 saniye

export default function useAgora() {
  const [client] = useState(() => AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }));
  
  const localTracksRef = useRef<{
    audio: IMicrophoneAudioTrack | null;
    video: ICameraVideoTrack | null;
    screen: ILocalVideoTrack | ILocalTrack[] | null;
  }>({ audio: null, video: null, screen: null });
  const timeoutRef = useRef<number | null>(null);

  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  
  const [localScreenTrack, setLocalScreenTrack] = useState<ILocalVideoTrack | ILocalTrack[] | null>(null);

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isTogglingScreenShare, setIsTogglingScreenShare] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [channelName, setChannelName] = useState('');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [debugStatus, setDebugStatus] = useState<string[]>([]);
  const [speakingUsers, setSpeakingUsers] = useState<Set<UID>>(new Set());
  
  const addStatus = (msg: string) => setDebugStatus(prev => [...prev, msg]);
  const clearError = useCallback(() => setError(null), []);

  const clearJoinTimeout = () => {
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
    }
  };

  const leave = useCallback(async () => {
    addStatus("[AYRILMA] İşlem başlatıldı.");
    clearJoinTimeout();

    const { audio, video, screen } = localTracksRef.current;

    audio?.stop(); audio?.close();
    video?.stop(); video?.close();
    if (screen) {
        if (Array.isArray(screen)) {
            screen.forEach(track => { track.stop(); track.close(); });
        } else {
            (screen as ILocalVideoTrack).stop();
            (screen as ILocalVideoTrack).close();
        }
    }
    localTracksRef.current = { audio: null, video: null, screen: null };

    if (client.connectionState === 'CONNECTED' || client.connectionState === 'CONNECTING') {
        try {
            await client.unpublish();
            await client.leave();
            addStatus("[AYRILMA] Kanaldan başarıyla ayrıldı.");
        } catch (e: any) {
            console.error("Error during main client leave:", e);
            addStatus(`[HATA] Kanaldan ayrılırken hata: ${e.message}`);
        }
    }

    setLocalAudioTrack(null);
    setLocalVideoTrack(null);
    setLocalScreenTrack(null);
    setIsScreenSharing(false);
    setRemoteUsers([]);
    setIsJoined(false);
    setIsJoining(false);
    setChannelName('');
    setSpeakingUsers(new Set());
    setDebugStatus([]);
    setError(null);
  }, [client]);


  const toggleScreenShare = useCallback(async (start: boolean) => {
    if (!isJoined || (start && isScreenSharing) || (!start && !isScreenSharing)) return;

    setIsTogglingScreenShare(true);
    setError(null);
    const currentVideoTrack = localTracksRef.current.video;
    const currentScreenTrack = localTracksRef.current.screen;

    if (start) {
        addStatus('[EKRAN] Paylaşım başlatılıyor...');
        try {
            if (currentVideoTrack) await client.unpublish(currentVideoTrack);
            
            const screenTracks = await AgoraRTC.createScreenVideoTrack({}, "auto");
            
            if (!screenTracks) {
                throw new Error("Ekran seçimi iptal edildi.");
            }

            const screenVideoTrack = Array.isArray(screenTracks) ? screenTracks[0] : screenTracks;
            screenVideoTrack.on("track-ended", () => {
                toggleScreenShare(false); 
            });
            
            localTracksRef.current.screen = screenTracks;
            setLocalScreenTrack(screenTracks);
            await client.publish(screenTracks);
            setIsScreenSharing(true);
            addStatus('[EKRAN] Paylaşım yayında.');
        } catch (err: any) {
            setError(new Error(`Ekran paylaşımı başlatılamadı: ${err.message}`));
            addStatus(`[HATA] Ekran paylaşımı: ${err.message}`);
            if (currentVideoTrack) await client.publish(currentVideoTrack);
        }
    } else { // Paylaşımı durdur
        addStatus('[EKRAN] Paylaşım durduruluyor...');
        try {
            if (currentScreenTrack) await client.unpublish(currentScreenTrack);
            
            if (Array.isArray(currentScreenTrack)) {
                currentScreenTrack.forEach(track => { track.stop(); track.close(); });
            } else if (currentScreenTrack) {
                (currentScreenTrack as ILocalVideoTrack).stop();
                (currentScreenTrack as ILocalVideoTrack).close();
            }
            localTracksRef.current.screen = null;
            setLocalScreenTrack(null);
            
            if (currentVideoTrack) await client.publish(currentVideoTrack);
            
            setIsScreenSharing(false);
            addStatus('[EKRAN] Paylaşım durduruldu. Kamera yeniden aktif.');
        } catch (err: any) {
            setError(new Error(`Ekran paylaşımı durdurulamadı: ${err.message}`));
            addStatus(`[HATA] Ekran paylaşımını durdurma: ${err.message}`);
        }
    }
    setIsTogglingScreenShare(false);
  }, [isJoined, isScreenSharing, client]);



  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (client.connectionState === 'CONNECTED') {
        // Tarayıcıların çoğu artık özel mesajlara izin vermiyor.
        e.preventDefault(); // Standartlara göre gereklidir.
        e.returnValue = ''; // Chrome için gereklidir.
        
        // Senkronize bir ayrılma işlemi yapmaya çalışın (her zaman çalışmayabilir)
        // Bu, en iyi çaba yaklaşımıdır.
        leave(); 
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    client.enableAudioVolumeIndicator();

    const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      await client.subscribe(user, mediaType);
      if (mediaType === 'audio') user.audioTrack?.play();
      setRemoteUsers(Array.from(client.remoteUsers));
    };
    const handleUserUnpublished = () => setRemoteUsers(Array.from(client.remoteUsers));
    const handleUserJoined = () => setRemoteUsers(Array.from(client.remoteUsers));
    const handleUserLeft = () => setRemoteUsers(Array.from(client.remoteUsers));
    const handleVolumeIndicator = (volumes: { uid: UID, level: number }[]) => {
        setSpeakingUsers(prev => {
            const newSpeakers = new Set<UID>();
            volumes.forEach(volume => {
                if (volume.level > 5) newSpeakers.add(volume.uid);
            });
            return newSpeakers;
        });
    };
    const handleConnectionStateChange = (curState: ConnectionState, revState: ConnectionState, reason?: ConnectionDisconnectedReason) => {
        addStatus(`[BAĞLANTI] Durum değişti: ${revState} -> ${curState}, Neden: ${reason || 'yok'}`);
    };
    
    client.on('user-published', handleUserPublished);
    client.on('user-unpublished', handleUserUnpublished);
    client.on('user-joined', handleUserJoined);
    client.on('user-left', handleUserLeft);
    client.on('volume-indicator', handleVolumeIndicator);
    client.on('connection-state-change', handleConnectionStateChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      client.removeAllListeners();
      if (client.connectionState === 'CONNECTED') {
          leave();
      }
    };
  }, [leave, client]);

  const join = useCallback(async (channel: string, uid: string) => {
    if (isJoining || isJoined) return;

    setIsJoining(true);
    setError(null);
    setChannelName(channel);
    setDebugStatus([]);

    timeoutRef.current = window.setTimeout(() => {
        if (isJoining && !isJoined) {
            const timeoutError = new Error("Bağlantı zaman aşımına uğradı. Ağınızı ve tarayıcı izinlerini kontrol edin.");
            addStatus(`[HATA] ${timeoutError.message}`);
            setError(timeoutError);
            leave();
        }
    }, JOIN_TIMEOUT);

    try {
      addStatus(`[1/5] Token isteniyor...`);
      const { data, error: functionError } = await supabase.functions.invoke('agora-token-generator', { body: { channelName: channel, uid: uid } });
      if (functionError || data.error) throw new Error(functionError?.message || data.error);
      addStatus(`[1/5] Token alındı.`);
      
      addStatus(`[2/5] Kanala katılıyor...`);
      await client.join(AGORA_APP_ID, channel, data.token, uid);
      addStatus(`[3/5] Kanala katıldı.`);
      
      addStatus(`[4/5] Medya cihazları isteniyor...`);
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
        { microphoneId: localStorage.getItem('selectedMicrophoneId') || undefined },
        { cameraId: localStorage.getItem('selectedCameraId') || undefined }
      );
      addStatus(`[4/5] Cihazlara erişildi.`);
      
      localTracksRef.current.audio = audioTrack;
      localTracksRef.current.video = videoTrack;
      
      await videoTrack.setMuted(isVideoMuted);
      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);
      
      addStatus(`[5/5] Medya yayınlanıyor...`);
      await client.publish([audioTrack, videoTrack]);
      addStatus(`[5/5] Katılım tamamlandı!`);
      
      clearJoinTimeout();
      setIsJoined(true);

    } catch (err: any) {
      addStatus(`[HATA] Adım başarısız oldu: ${err.message}`);
      let userFriendlyError = new Error(err.message);
       if (err.code === 'PERMISSION_DENIED' || err.name === 'NotAllowedError') {
          userFriendlyError = new Error("Lütfen mikrofon ve kamera erişimine izin verin.");
      }
      setError(userFriendlyError);
      await leave();
    } finally {
      clearJoinTimeout();
      setIsJoining(false);
    }
  }, [leave, isJoining, isJoined, isVideoMuted, client]);
  
  const muteAudio = useCallback(async (muted: boolean) => {
      if(localTracksRef.current.audio){
        await localTracksRef.current.audio.setMuted(muted);
        setIsAudioMuted(muted);
      }
  }, []);

  const muteVideo = useCallback(async (muted: boolean) => {
      if(localTracksRef.current.video) {
        await localTracksRef.current.video.setMuted(muted);
        setIsVideoMuted(muted);
      }
  }, []);


  return { 
    join, leave, isJoined, isJoining, debugStatus, speakingUsers,
    localAudioTrack, localVideoTrack, remoteUsers,
    channelName, muteAudio, isAudioMuted,
    muteVideo, isVideoMuted, error, clearError,
    toggleScreenShare, isScreenSharing, localScreenTrack, isTogglingScreenShare
  };
}