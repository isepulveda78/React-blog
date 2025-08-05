// Examples of how to add MP3 sounds to your React app
const { React } = window;

// Example 1: Simple button with MP3 sound
const MP3ButtonExample = () => {
  const playMP3 = (soundFile) => {
    const audio = new Audio(soundFile);
    audio.volume = 0.5;
    audio.play().catch(error => {
      console.log('Sound failed to play:', error);
      // Fallback to beep
      const { sounds } = window.useSound();
      sounds.beep();
    });
  };

  return React.createElement(
    'div',
    { className: 'card p-3 mb-3' },
    React.createElement('h5', null, 'Direct MP3 Integration'),
    React.createElement(
      'button',
      {
        className: 'btn btn-primary me-2',
        onClick: () => playMP3('/sounds/button-click.mp3')
      },
      'Click Sound'
    ),
    React.createElement(
      'button',
      {
        className: 'btn btn-success me-2',
        onClick: () => playMP3('/sounds/success.mp3')
      },
      'Success Sound'
    ),
    React.createElement(
      'button',
      {
        className: 'btn btn-danger',
        onClick: () => playMP3('/sounds/error.mp3')
      },
      'Error Sound'
    )
  );
};

// Example 2: Form with sound feedback
const FormWithSounds = () => {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');

  const playSound = (soundFile) => {
    const audio = new Audio(soundFile);
    audio.volume = 0.6;
    audio.play().catch(() => {
      // Fallback to generated sound
      const { sounds } = window.useSound();
      if (soundFile.includes('success')) sounds.beep(600, 300);
      else if (soundFile.includes('error')) sounds.beep(300, 400);
      else sounds.beep();
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && email) {
      playSound('/sounds/success.mp3');
      alert('Form submitted successfully!');
    } else {
      playSound('/sounds/error.mp3');
      alert('Please fill all fields');
    }
  };

  return React.createElement(
    'div',
    { className: 'card p-3 mb-3' },
    React.createElement('h5', null, 'Form with Sound Feedback'),
    React.createElement(
      'form',
      { onSubmit: handleSubmit },
      React.createElement(
        'div',
        { className: 'mb-2' },
        React.createElement('input', {
          type: 'text',
          className: 'form-control',
          placeholder: 'Name',
          value: name,
          onChange: (e) => setName(e.target.value),
          onFocus: () => playSound('/sounds/button-click.mp3')
        })
      ),
      React.createElement(
        'div',
        { className: 'mb-2' },
        React.createElement('input', {
          type: 'email',
          className: 'form-control',
          placeholder: 'Email',
          value: email,
          onChange: (e) => setEmail(e.target.value),
          onFocus: () => playSound('/sounds/button-click.mp3')
        })
      ),
      React.createElement(
        'button',
        { type: 'submit', className: 'btn btn-primary' },
        'Submit with Sound'
      )
    )
  );
};

// Example 3: Audio preloader for better performance
const PreloadedAudioExample = () => {
  const audioCache = React.useRef({});

  React.useEffect(() => {
    // Preload all sounds
    const sounds = [
      '/sounds/button-click.mp3',
      '/sounds/success.mp3',
      '/sounds/error.mp3',
      '/sounds/notification.mp3'
    ];

    sounds.forEach(soundPath => {
      const audio = new Audio(soundPath);
      audio.preload = 'auto';
      audio.volume = 0.5;
      audioCache.current[soundPath] = audio;
    });
  }, []);

  const playPreloadedSound = (soundPath) => {
    const audio = audioCache.current[soundPath];
    if (audio) {
      audio.currentTime = 0; // Reset to beginning
      audio.play().catch(() => {
        console.log('Preloaded sound failed, using backup');
        const { sounds } = window.useSound();
        sounds.beep();
      });
    }
  };

  return React.createElement(
    'div',
    { className: 'card p-3 mb-3' },
    React.createElement('h5', null, 'Preloaded Audio (Better Performance)'),
    React.createElement(
      'div',
      { className: 'd-grid gap-2' },
      React.createElement(
        'button',
        {
          className: 'btn btn-outline-primary',
          onClick: () => playPreloadedSound('/sounds/button-click.mp3')
        },
        'Preloaded Click'
      ),
      React.createElement(
        'button',
        {
          className: 'btn btn-outline-success',
          onClick: () => playPreloadedSound('/sounds/success.mp3')
        },
        'Preloaded Success'
      )
    )
  );
};

// Main component
const MP3IntegrationExamples = () => {
  return React.createElement(
    'div',
    { className: 'container py-5' },
    React.createElement('h1', { className: 'display-5 fw-bold text-primary mb-4' }, 'MP3 Sound Integration'),
    
    React.createElement(
      'div',
      { className: 'alert alert-info mb-4' },
      React.createElement('h6', null, 'How to Add MP3 Files:'),
      React.createElement('ol', { className: 'mb-0' },
        React.createElement('li', null, 'Download MP3 files from freesound.org or similar sites'),
        React.createElement('li', null, 'Place them in the ', React.createElement('code', null, '/public/sounds/'), ' directory'),
        React.createElement('li', null, 'Reference them with paths like ', React.createElement('code', null, '/sounds/filename.mp3')),
        React.createElement('li', null, 'Use the examples below for integration')
      )
    ),

    React.createElement(MP3ButtonExample),
    React.createElement(FormWithSounds),
    React.createElement(PreloadedAudioExample),

    React.createElement(
      'div',
      { className: 'card p-3' },
      React.createElement('h5', null, 'Code Example'),
      React.createElement(
        'pre',
        { className: 'bg-light p-3 rounded mb-0', style: { fontSize: '0.9em' } },
        `// Basic MP3 integration
const playSound = (file) => {
  const audio = new Audio(file);
  audio.volume = 0.5;
  audio.play().catch(error => {
    console.log('Sound failed:', error);
    // Fallback to beep
    window.useSound().sounds.beep();
  });
};

// Usage in button
<button onClick={() => playSound('/sounds/click.mp3')}>
  Click Me
</button>`
      )
    )
  );
};

// Export for global use
window.MP3IntegrationExamples = MP3IntegrationExamples;