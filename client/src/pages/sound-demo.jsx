const { React, useState } = window;

const SoundDemo = () => {
  const { sounds, playSound } = window.useSound();
  const [volume, setVolume] = useState(0.5);

  const testSounds = [
    { name: 'Button Click', action: () => sounds.buttonClick() },
    { name: 'Success', action: () => sounds.success() },
    { name: 'Error', action: () => sounds.error() },
    { name: 'Notification', action: () => sounds.notification() },
    { name: 'Low Beep', action: () => sounds.beep(400, 300) },
    { name: 'High Beep', action: () => sounds.beep(1200, 200) },
    { name: 'Long Beep', action: () => sounds.beep(800, 500) }
  ];

  return React.createElement(
    'div',
    { className: 'container py-5' },
    React.createElement('h1', { className: 'display-4 fw-bold text-primary mb-4' }, 'Sound Effects Demo'),
    
    React.createElement(
      'div',
      { className: 'mb-4' },
      React.createElement('h3', { className: 'h5 mb-3' }, 'Volume Control'),
      React.createElement('input', {
        type: 'range',
        className: 'form-range',
        min: '0',
        max: '1',
        step: '0.1',
        value: volume,
        onChange: (e) => setVolume(parseFloat(e.target.value))
      }),
      React.createElement('small', { className: 'text-muted' }, `Volume: ${Math.round(volume * 100)}%`)
    ),

    React.createElement(
      'div',
      { className: 'row' },
      React.createElement(
        'div',
        { className: 'col-md-6' },
        React.createElement('h3', { className: 'h5 mb-3' }, 'Built-in Sound Effects'),
        React.createElement(
          'div',
          { className: 'd-grid gap-2' },
          ...testSounds.map((sound, index) =>
            React.createElement(
              'button',
              {
                key: index,
                className: 'btn btn-outline-primary',
                onClick: sound.action
              },
              sound.name
            )
          )
        )
      ),
      
      React.createElement(
        'div',
        { className: 'col-md-6' },
        React.createElement('h3', { className: 'h5 mb-3' }, 'SoundButton Component Examples'),
        React.createElement(
          'div',
          { className: 'd-grid gap-2' },
          React.createElement(
            window.SoundButton,
            {
              className: 'btn-success',
              soundType: 'success',
              onClick: () => alert('Success action!')
            },
            'Success Button'
          ),
          React.createElement(
            window.SoundButton,
            {
              className: 'btn-danger',
              soundType: 'error',
              onClick: () => alert('Error action!')
            },
            'Error Button'
          ),
          React.createElement(
            window.SoundButton,
            {
              className: 'btn-info',
              soundType: 'custom',
              soundOptions: { frequency: 600, duration: 300 },
              onClick: () => alert('Custom beep!')
            },
            'Custom Beep'
          )
        )
      )
    ),

    React.createElement(
      'div',
      { className: 'mt-5' },
      React.createElement('h3', { className: 'h5 mb-3' }, 'How to Use Sounds in Your App'),
      React.createElement(
        'div',
        { className: 'alert alert-info' },
        React.createElement('strong', null, 'Three ways to add sounds:'),
        React.createElement('ol', { className: 'mt-2 mb-0' },
          React.createElement('li', null, 'Use the ', React.createElement('code', null, 'useSound'), ' hook directly'),
          React.createElement('li', null, 'Use the ', React.createElement('code', null, 'SoundButton'), ' component'),
          React.createElement('li', null, 'Add sound files to ', React.createElement('code', null, '/public/sounds/'), ' folder')
        )
      )
    ),

    React.createElement(
      'div',
      { className: 'mt-4' },
      React.createElement(
        'div',
        { className: 'card' },
        React.createElement(
          'div',
          { className: 'card-body' },
          React.createElement('h5', { className: 'card-title' }, 'MP3 Integration Guide'),
          React.createElement(
            'div',
            { className: 'alert alert-warning' },
            React.createElement('strong', null, 'Current Status: '),
            'Using Web Audio API beeps as fallback. To add real MP3 sounds:'
          ),
          React.createElement(
            'ol',
            null,
            React.createElement('li', null, React.createElement('strong', null, 'Download MP3 files'), ' from:'),
            React.createElement('ul', null,
              React.createElement('li', null, React.createElement('a', { href: 'https://freesound.org', target: '_blank' }, 'freesound.org'), ' (search "button click")'),
              React.createElement('li', null, React.createElement('a', { href: 'https://mixkit.co', target: '_blank' }, 'mixkit.co'), ' (free UI sounds)'),
              React.createElement('li', null, React.createElement('a', { href: 'https://zapsplat.com', target: '_blank' }, 'zapsplat.com'), ' (free tier available)')
            ),
            React.createElement('li', null, React.createElement('strong', null, 'Replace placeholder files'), ' in ', React.createElement('code', null, '/public/sounds/')),
            React.createElement('li', null, React.createElement('strong', null, 'File names needed:'), ' button-click.mp3, success.mp3, error.mp3'),
            React.createElement('li', null, React.createElement('strong', null, 'Keep files small'), ' (under 50KB each)')
          )
        )
      )
    ),

    React.createElement(
      'div',
      { className: 'mt-4' },
      React.createElement(
        'div',
        { className: 'card' },
        React.createElement(
          'div',
          { className: 'card-body' },
          React.createElement('h5', { className: 'card-title' }, 'Code Examples'),
          React.createElement(
            'pre',
            { className: 'bg-light p-3 rounded' },
            `// Method 1: Direct MP3 playback
const playMP3 = (file) => {
  const audio = new Audio(file);
  audio.volume = 0.5;
  audio.play().catch(() => {
    // Fallback to beep if MP3 fails
    window.useSound().sounds.beep();
  });
};

<button onClick={() => playMP3('/sounds/click.mp3')}>
  MP3 Button
</button>

// Method 2: Using the hook with MP3 files
const { sounds } = window.useSound();
sounds.buttonClick(); // Tries MP3, falls back to beep`
          )
        )
      )
    ),

    // Add MP3 integration examples
    React.createElement(window.MP3IntegrationExamples || 'div')
  );
};

// Export to window for global access
window.SoundDemo = SoundDemo;