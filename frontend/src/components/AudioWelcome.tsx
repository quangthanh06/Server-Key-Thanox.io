import { useState, useEffect, useRef, useCallback } from 'react';
import './AudioWelcome.css';

interface AudioWelcomeProps {
  enabled?: boolean;
  voiceText?: string;
  musicUrl?: string;
  musicEnabled?: boolean;
}

const DEFAULT_WELCOME_TEXT = 
  'Chào mừng các con vợ đã đến với THANOX STORE. Khách mới vào app vui lòng làm theo 2 bước bên trên để nhận mã key proxy xịn sò. Cách cài đặt và video hướng dẫn chi tiết ở ngay bên dưới nhé. Sau đây mời các con vợ cùng thưởng thức âm nhạc!';

const DEFAULT_MUSIC_URL = 
  'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3';

export function AudioWelcome({
  enabled = true,
  voiceText,
  musicUrl,
  musicEnabled = true,
}: AudioWelcomeProps) {
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const textToSpeak = (voiceText || '').trim() || DEFAULT_WELCOME_TEXT;
  const audioSource = (musicUrl || '').trim() || DEFAULT_MUSIC_URL;

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio(audioSource);
    audio.loop = true;
    audio.volume = 0.45;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioSource]);

  // Handle playing music
  const startMusic = useCallback(() => {
    if (!musicEnabled || !audioRef.current) return;
    audioRef.current.play().then(() => {
      setIsPlayingMusic(true);
    }).catch(() => {});
  }, [musicEnabled]);

  // Handle Speech Synthesis
  const startSpeech = useCallback(() => {
    if (!('speechSynthesis' in window)) {
      startMusic();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    // Pick best Vietnamese voice if available
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(v => v.lang.includes('vi'));
    if (viVoice) utterance.voice = viVoice;

    utterance.onstart = () => {
      setIsPlayingVoice(true);
    };

    utterance.onend = () => {
      setIsPlayingVoice(false);
      // Seamlessly transition to background music as requested!
      startMusic();
    };

    utterance.onerror = () => {
      setIsPlayingVoice(false);
      startMusic();
    };

    window.speechSynthesis.speak(utterance);
  }, [textToSpeak, startMusic]);

  // Trigger audio start on user gesture
  const handleStartAudio = () => {
    setHasStarted(true);
    setIsBannerDismissed(true);
    if (enabled) {
      startSpeech();
    } else if (musicEnabled) {
      startMusic();
    }
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingMusic(true);
      }).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    audioRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const replayVoice = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    }
    startSpeech();
  };

  // Auto-listen for first touch/click anywhere to activate audio smoothly
  useEffect(() => {
    if (hasStarted) return;
    const onFirstUserGesture = () => {
      if (!hasStarted) {
        handleStartAudio();
      }
      window.removeEventListener('click', onFirstUserGesture);
      window.removeEventListener('touchstart', onFirstUserGesture);
    };

    window.addEventListener('click', onFirstUserGesture, { once: true });
    window.addEventListener('touchstart', onFirstUserGesture, { once: true });

    return () => {
      window.removeEventListener('click', onFirstUserGesture);
      window.removeEventListener('touchstart', onFirstUserGesture);
    };
  }, [hasStarted]);

  return (
    <>
      {/* Welcome Audio Banner (Shown until user activates or dismisses) */}
      {!isBannerDismissed && !hasStarted && (
        <div className="pk-audio-welcome-banner">
          <div className="pk-audio-banner-content">
            <span className="pk-audio-wave-icon">🎙️</span>
            <div className="pk-audio-banner-text">
              <strong>THANOX BOT:</strong> Bấm để nghe giọng hướng dẫn & chill nhạc!
            </div>
          </div>
          <div className="pk-audio-banner-actions">
            <button className="pk-audio-play-btn" onClick={handleStartAudio} type="button">
              🔊 BẬT ÂM THANH
            </button>
            <button 
              className="pk-audio-close-btn" 
              onClick={() => setIsBannerDismissed(true)} 
              type="button"
              title="Đóng"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Floating Mini Music / Voice Control Widget */}
      {hasStarted && (
        <div className="pk-mini-audio-widget">
          <div className="pk-mini-left" onClick={toggleMusic}>
            {isPlayingVoice ? (
              <span className="pk-voice-indicator">
                🗣️ Đang đọc hướng dẫn...
              </span>
            ) : isPlayingMusic ? (
              <div className="pk-equalizer">
                <span className="eq-bar bar-1"></span>
                <span className="eq-bar bar-2"></span>
                <span className="eq-bar bar-3"></span>
                <span className="eq-bar bar-4"></span>
                <span className="pk-music-label">Chill Music 🎵</span>
              </div>
            ) : (
              <span className="pk-music-paused">
                ⏸ Tạm dừng nhạc
              </span>
            )}
          </div>

          <div className="pk-mini-controls">
            <button 
              className="pk-mini-btn" 
              onClick={replayVoice} 
              title="Nghe lại giọng nói"
              type="button"
            >
              🔄
            </button>
            <button 
              className="pk-mini-btn" 
              onClick={toggleMusic} 
              title={isPlayingMusic ? 'Tạm dừng' : 'Phát tiếp'}
              type="button"
            >
              {isPlayingMusic ? '⏸' : '▶'}
            </button>
            <button 
              className="pk-mini-btn" 
              onClick={toggleMute} 
              title={isMuted ? 'Bật tiếng' : 'Tắt tiếng'}
              type="button"
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
