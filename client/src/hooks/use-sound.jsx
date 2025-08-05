const { useState, useCallback, useRef } = window.React;

const useSound = () => {
  const audioRefs = useRef({});

  // Preload audio files
  const preloadSound = useCallback((soundName, soundPath) => {
    if (!audioRefs.current[soundName]) {
      const audio = new Audio(soundPath);
      audio.preload = 'auto';
      audioRefs.current[soundName] = audio;
    }
  }, []);

  // Play a sound
  const playSound = useCallback((soundName, soundPath, options = {}) => {
    try {
      let audio = audioRefs.current[soundName];
      
      if (!audio) {
        audio = new Audio(soundPath);
        audioRefs.current[soundName] = audio;
      }

      // Reset audio to beginning
      audio.currentTime = 0;
      
      // Apply options
      if (options.volume !== undefined) {
        audio.volume = Math.max(0, Math.min(1, options.volume));
      }
      
      if (options.playbackRate !== undefined) {
        audio.playbackRate = options.playbackRate;
      }

      // Play the sound
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Sound play failed:', error);
          // Ignore autoplay policy errors
        });
      }
    } catch (error) {
      console.log('Sound error:', error);
    }
  }, []);

  // Common sound effects
  const sounds = {
    buttonClick: () => playSound('click', '/sounds/button-click.mp3', { volume: 0.5 }),
    success: () => playSound('success', '/sounds/success.mp3', { volume: 0.6 }),
    error: () => playSound('error', '/sounds/error.mp3', { volume: 0.4 }),
    notification: () => playSound('notification', '/sounds/notification.mp3', { volume: 0.5 }),
    // Web Audio API beep (no file needed)
    beep: (frequency = 800, duration = 200) => {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
      } catch (error) {
        console.log('Beep failed:', error);
      }
    }
  };

  return { playSound, preloadSound, sounds };
};

// Export to window for global access
window.useSound = useSound;

// HOC for adding sound to any button
const withSound = (Component, soundEffect = 'buttonClick') => {
  return function SoundButton(props) {
    const { sounds } = useSound();
    
    const handleClick = (e) => {
      sounds[soundEffect]?.();
      if (props.onClick) {
        props.onClick(e);
      }
    };

    return React.createElement(Component, {
      ...props,
      onClick: handleClick
    });
  };
};

// Export withSound to window as well
window.withSound = withSound;