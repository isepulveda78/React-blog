// Audio Generator Utility
// Creates audio data URLs for simple sound effects

export const generateBeepDataURL = (frequency = 800, duration = 200, volume = 0.3) => {
  // Create AudioContext
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const sampleRate = audioContext.sampleRate;
  const numSamples = Math.floor(sampleRate * duration / 1000);
  
  // Create AudioBuffer
  const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const channelData = audioBuffer.getChannelData(0);
  
  // Generate sine wave
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const fadeOut = Math.max(0, 1 - (t / (duration / 1000)) * 2); // Fade out in second half
    channelData[i] = Math.sin(2 * Math.PI * frequency * t) * volume * fadeOut;
  }
  
  // Convert to WAV data URL (simplified)
  // Note: This is a basic implementation - for production use a proper WAV encoder
  return audioBuffer;
};

// Generate different sound types
export const soundPresets = {
  buttonClick: { frequency: 800, duration: 150, volume: 0.3 },
  success: { frequency: 600, duration: 300, volume: 0.4 },
  error: { frequency: 300, duration: 400, volume: 0.3 },
  notification: { frequency: 1000, duration: 200, volume: 0.3 }
};

// Enhanced useSound hook with better audio generation
window.useSoundEnhanced = () => {
  const audioRefs = React.useRef({});

  const playGeneratedSound = React.useCallback((preset) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const { frequency, duration, volume } = soundPresets[preset] || soundPresets.buttonClick;
      
      // Create oscillator and gain nodes
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configure oscillator
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';
      
      // Configure envelope (fade out)
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      
      // Play sound
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
      
      return true;
    } catch (error) {
      console.log('Generated sound failed:', error);
      return false;
    }
  }, []);

  const playMP3Sound = React.useCallback((soundPath, options = {}) => {
    try {
      let audio = audioRefs.current[soundPath];
      
      if (!audio) {
        audio = new Audio(soundPath);
        audio.preload = 'auto';
        audioRefs.current[soundPath] = audio;
      }

      // Reset and configure
      audio.currentTime = 0;
      if (options.volume !== undefined) {
        audio.volume = Math.max(0, Math.min(1, options.volume));
      }
      
      // Play with error handling
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        return playPromise.catch(error => {
          console.log('MP3 sound failed, using generated sound:', error);
          return false;
        });
      }
      return Promise.resolve(true);
    } catch (error) {
      console.log('MP3 sound error:', error);
      return Promise.resolve(false);
    }
  }, []);

  // Enhanced sounds object with fallback
  const sounds = {
    buttonClick: async () => {
      const mp3Success = await playMP3Sound('/sounds/button-click.mp3', { volume: 0.5 });
      if (!mp3Success) playGeneratedSound('buttonClick');
    },
    success: async () => {
      const mp3Success = await playMP3Sound('/sounds/success.mp3', { volume: 0.6 });
      if (!mp3Success) playGeneratedSound('success');
    },
    error: async () => {
      const mp3Success = await playMP3Sound('/sounds/error.mp3', { volume: 0.4 });
      if (!mp3Success) playGeneratedSound('error');
    },
    notification: async () => {
      const mp3Success = await playMP3Sound('/sounds/notification.mp3', { volume: 0.5 });
      if (!mp3Success) playGeneratedSound('notification');
    },
    beep: (frequency = 800, duration = 200) => playGeneratedSound('buttonClick')
  };

  return { sounds, playMP3Sound, playGeneratedSound };
};