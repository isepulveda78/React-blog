import React, { useState, useRef } from 'react';

const SpanishAlphabet = () => {
  const [isPlaying, setIsPlaying] = React.useState(null);
  const [isPlayingAll, setIsPlayingAll] = React.useState(false);
  const audioRefs = React.useRef({});
  const playAllTimeoutRef = React.useRef(null);

  // Spanish alphabet with pronunciations
  const spanishLetters = [
    { letter: 'A', name: 'a', pronunciation: 'ah' },
    { letter: 'B', name: 'b e', pronunciation: 'bay' },
    { letter: 'C', name: 'ce', pronunciation: 'say' },
     { letter: 'Ch', name: 'ch', pronunciation: 'chay' },
    { letter: 'D', name: 'de', pronunciation: 'day' },
    { letter: 'E', name: 'e', pronunciation: 'eh' },
    { letter: 'F', name: 'efe', pronunciation: 'eh-feh' },
    { letter: 'G', name: 'he', pronunciation: 'hay' },
    { letter: 'H', name: 'hache', pronunciation: 'ah-chay' },
    { letter: 'I', name: 'i', pronunciation: 'ee' },
    { letter: 'J', name: 'jota', pronunciation: 'ho-tah' },
    { letter: 'K', name: 'ka', pronunciation: 'kah' },
    { letter: 'L', name: 'ele', pronunciation: 'eh-lay' },
    { letter: 'Ll', name: 'e ye', pronunciation: 'ay-yay' },
    { letter: 'M', name: 'eme', pronunciation: 'eh-meh' },
    { letter: 'N', name: 'ene', pronunciation: 'eh-neh' },
    { letter: 'Ñ', name: 'eñe', pronunciation: 'eh-nyeh' },
    { letter: 'O', name: 'o', pronunciation: 'oh' },
    { letter: 'P', name: 'pe', pronunciation: 'peh' },
    { letter: 'Q', name: 'ku', pronunciation: 'koo' },
    { letter: 'R', name: 'erre', pronunciation: 'ay-rrray' },
    { letter: 'RR', name: 'errre', pronunciation: 'ay-rrray' },
    { letter: 'S', name: 'ese', pronunciation: 'ay-say' },
    { letter: 'T', name: 'te', pronunciation: 'tay' },
    { letter: 'U', name: 'u', pronunciation: 'oo' },
    { letter: 'V', name: 'uve', pronunciation: 'oo-vay' },
    { letter: 'W', name: 'uve doble', pronunciation: 'oo-vay do-blay' },
    { letter: 'X', name: 'equis', pronunciation: 'eh-kees' },
    { letter: 'Y', name: 'i griega', pronunciation: 'ee-gree-eh-gah' },
    { letter: 'Z', name: 'zeta', pronunciation: 'seh-tah' }
  ];

  const playLetter = (letter, letterName) => {
    // Don't play individual letters if we're in the middle of stopping all
    if (!isPlayingAll) {
      setIsPlaying(letter);
    }
    
    try {
      // First try to play MP3 file
      const soundPath = `/sounds/spanish/${letter.toLowerCase()}.mp3`;
      let audio = audioRefs.current[letter];
      
      if (!audio) {
        audio = new Audio(soundPath);
        audio.preload = 'auto';
        audioRefs.current[letter] = audio;
      }

      audio.currentTime = 0;
      audio.volume = 0.7;
      
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Success - MP3 played
          })
          .catch(() => {
            // Fallback to speech synthesis
            playWithSpeechSynthesis(letterName);
          })
          .finally(() => {
            if (!isPlayingAll) {
              setTimeout(() => setIsPlaying(null), 800);
            }
          });
      }
    } catch (error) {
      // Fallback to speech synthesis
      playWithSpeechSynthesis(letterName);
      if (!isPlayingAll) {
        setTimeout(() => setIsPlaying(null), 800);
      }
    }
  };

  const playWithSpeechSynthesis = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES'; // Spanish
      utterance.rate = 0.8;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const playAllLetters = () => {
    if (isPlayingAll) {
      return; // Don't start if already playing
    }

    setIsPlayingAll(true);
    let index = 0;
    let shouldContinue = true;
    
    const playNext = () => {
      // Check if we should continue and haven't reached the end
      if (index < spanishLetters.length && shouldContinue) {
        const currentLetter = spanishLetters[index];
        playLetter(currentLetter.letter, currentLetter.name);
        index++;
        playAllTimeoutRef.current = setTimeout(playNext, 1200); // Wait 1.2 seconds between letters
      } else {
        setIsPlayingAll(false);
        shouldContinue = false;
      }
    };

    // Store the shouldContinue flag in the ref so stopAllLetters can access it
    playAllTimeoutRef.current = { shouldContinue: () => shouldContinue, setShouldContinue: (val) => { shouldContinue = val; } };
    
    playNext();
  };

  const stopAllLetters = () => {
    setIsPlayingAll(false);
    setIsPlaying(null);
    
    // Clear any pending timeout
    if (playAllTimeoutRef.current) {
      if (typeof playAllTimeoutRef.current === 'number') {
        clearTimeout(playAllTimeoutRef.current);
      } else if (playAllTimeoutRef.current.setShouldContinue) {
        playAllTimeoutRef.current.setShouldContinue(false);
      }
      playAllTimeoutRef.current = null;
    }
    
    // Stop any currently playing audio
    Object.values(audioRefs.current).forEach(audio => {
      if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    
    // Stop speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  return React.createElement(
    'div',
    { className: 'container py-5' },
    React.createElement('h1', { className: 'display-5 fw-bold text-primary mb-4' }, 'Alfabeto Español - Spanish Alphabet'),
    
    React.createElement(
      'div',
      { className: 'row mb-4' },
      React.createElement(
        'div',
        { className: 'col-12' },
        React.createElement(
          'div',
          { className: 'alert alert-info' },
          React.createElement('h6', null, 'How to Use:'),
          React.createElement('ul', { className: 'mb-2' },
            React.createElement('li', null, 'Click any letter to hear its pronunciation'),
            React.createElement('li', null, 'Use "Play All Letters" to hear the entire alphabet or "Stop" to interrupt'),
            React.createElement('li', null, 'Play in Google Chrome or Microsoft Edge for best results')
          ),
          React.createElement(
            'div',
            { className: 'd-flex gap-2 align-items-center' },
            React.createElement(
              'button',
              {
                className: 'btn btn-success',
                onClick: playAllLetters,
                disabled: isPlayingAll
              },
              'Play All Letters'
            ),
            React.createElement(
              'button',
              {
                className: 'btn btn-danger',
                onClick: stopAllLetters,
                disabled: !isPlayingAll
              },
              'Stop'
            ),
            isPlayingAll && React.createElement(
              'div',
              { 
                className: 'spinner-border spinner-border-sm text-primary',
                style: { marginLeft: '8px' }
              }
            )
          )
        )
      )
    ),

    React.createElement(
      'div',
      { className: 'row' },
      spanishLetters.map(letterObj =>
        React.createElement(
          'div',
          { key: letterObj.letter, className: 'col-lg-3 col-md-4 col-sm-6 mb-3' },
          React.createElement(
            'div',
            { 
              className: `card h-100 text-center ${isPlaying === letterObj.letter ? 'border-primary bg-light' : ''}`,
              style: { cursor: 'pointer', transition: 'all 0.3s ease' }
            },
            React.createElement(
              'div',
              { 
                className: 'card-body d-flex flex-column justify-content-center',
                onClick: () => playLetter(letterObj.letter, letterObj.name)
              },
              React.createElement(
                'h2',
                { 
                  className: `display-4 fw-bold mb-2 ${isPlaying === letterObj.letter ? 'text-primary' : 'text-dark'}` 
                },
                letterObj.letter
              ),
              React.createElement(
                'small',
                { className: 'text-secondary' },
                `(${letterObj.pronunciation})`
              ),
              isPlaying === letterObj.letter && React.createElement(
                'div',
                { className: 'mt-2' },
                React.createElement(
                  'div',
                  { className: 'spinner-border spinner-border-sm text-primary' }
                )
              )
            )
          )
        )
      )
    ),
  );
};

// Export to window for global access
export default SpanishAlphabet;