const { React } = window;

const SpanishAlphabet = () => {
  const [isPlaying, setIsPlaying] = React.useState(null);
  const [isPlayingAll, setIsPlayingAll] = React.useState(false);
  const audioRefs = React.useRef({});
  const playAllTimeoutRef = React.useRef(null);

  // Spanish alphabet with pronunciations
  const spanishLetters = [
    { letter: 'A', name: 'a', pronunciation: 'ah' },
    { letter: 'B', name: 'be', pronunciation: 'beh' },
    { letter: 'C', name: 'ce', pronunciation: 'seh' },
    { letter: 'D', name: 'de', pronunciation: 'deh' },
    { letter: 'E', name: 'e', pronunciation: 'eh' },
    { letter: 'F', name: 'efe', pronunciation: 'eh-feh' },
    { letter: 'G', name: 'ge', pronunciation: 'heh' },
    { letter: 'H', name: 'hache', pronunciation: 'ah-cheh' },
    { letter: 'I', name: 'i', pronunciation: 'ee' },
    { letter: 'J', name: 'jota', pronunciation: 'hoh-tah' },
    { letter: 'K', name: 'ka', pronunciation: 'kah' },
    { letter: 'L', name: 'ele', pronunciation: 'eh-leh' },
    { letter: 'M', name: 'eme', pronunciation: 'eh-meh' },
    { letter: 'N', name: 'ene', pronunciation: 'eh-neh' },
    { letter: 'Ñ', name: 'eñe', pronunciation: 'eh-nyeh' },
    { letter: 'O', name: 'o', pronunciation: 'oh' },
    { letter: 'P', name: 'pe', pronunciation: 'peh' },
    { letter: 'Q', name: 'cu', pronunciation: 'koo' },
    { letter: 'R', name: 'erre', pronunciation: 'eh-rreh' },
    { letter: 'S', name: 'ese', pronunciation: 'eh-seh' },
    { letter: 'T', name: 'te', pronunciation: 'teh' },
    { letter: 'U', name: 'u', pronunciation: 'oo' },
    { letter: 'V', name: 've', pronunciation: 'beh' },
    { letter: 'W', name: 'doble ve', pronunciation: 'doh-bleh beh' },
    { letter: 'X', name: 'equis', pronunciation: 'eh-kees' },
    { letter: 'Y', name: 'ye', pronunciation: 'yeh' },
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
            React.createElement('li', null, 'MP3 files should be placed in ', React.createElement('code', null, '/public/sounds/spanish/')),
            React.createElement('li', null, 'Falls back to text-to-speech if MP3 files are not available'),
            React.createElement('li', null, 'Use "Play All Letters" to hear the entire alphabet or "Stop" to interrupt')
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
                'h6',
                { className: 'text-muted mb-1' },
                letterObj.name
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

    React.createElement(
      'div',
      { className: 'mt-5' },
      React.createElement(
        'div',
        { className: 'card' },
        React.createElement(
          'div',
          { className: 'card-body' },
          React.createElement('h5', { className: 'card-title' }, 'Adding MP3 Sound Files'),
          React.createElement(
            'div',
            { className: 'alert alert-warning' },
            React.createElement('strong', null, 'To use real Spanish pronunciations:'),
            React.createElement('ol', { className: 'mt-2 mb-0' },
              React.createElement('li', null, 'Create folder: ', React.createElement('code', null, '/public/sounds/spanish/')),
              React.createElement('li', null, 'Add MP3 files named: a.mp3, b.mp3, c.mp3, etc.'),
              React.createElement('li', null, 'Include special letters: ñ.mp3'),
              React.createElement('li', null, 'Files should be native Spanish pronunciations'),
              React.createElement('li', null, 'Current fallback: Text-to-speech in Spanish')
            )
          ),
          React.createElement(
            'div',
            { className: 'mt-3' },
            React.createElement('h6', null, 'Recommended Sources for Spanish Audio:'),
            React.createElement('ul', null,
              React.createElement('li', null, React.createElement('a', { href: 'https://forvo.com', target: '_blank' }, 'Forvo.com'), ' - Native speaker pronunciations'),
              React.createElement('li', null, React.createElement('a', { href: 'https://www.spanishdict.com', target: '_blank' }, 'SpanishDict.com'), ' - Spanish learning resources'),
              React.createElement('li', null, 'Record native speakers pronouncing each letter'),
              React.createElement('li', null, 'Use Google Translate\'s audio feature to download pronunciations')
            )
          )
        )
      )
    )
  );
};

// Export to window for global access
window.SpanishAlphabet = SpanishAlphabet;