const { React } = window;

const MP3Guide = () => {
  const [step, setStep] = React.useState(1);
  const [testResults, setTestResults] = React.useState({});

  const testMP3File = (filename) => {
    const audio = new Audio(`/sounds/${filename}`);
    audio.play()
      .then(() => {
        setTestResults(prev => ({ ...prev, [filename]: 'success' }));
      })
      .catch(error => {
        setTestResults(prev => ({ ...prev, [filename]: 'failed' }));
        console.log(`MP3 test failed for ${filename}:`, error);
      });
  };

  const steps = [
    {
      title: "Download Sound Files",
      content: React.createElement(
        'div',
        null,
        React.createElement('h6', null, 'Recommended Free Sources:'),
        React.createElement('ul', null,
          React.createElement('li', null, 
            React.createElement('a', { href: 'https://freesound.org', target: '_blank', className: 'text-primary' }, 'Freesound.org'),
            ' - Search for "UI button click", "success", "error"'
          ),
          React.createElement('li', null,
            React.createElement('a', { href: 'https://mixkit.co/free-sound-effects/game/', target: '_blank', className: 'text-primary' }, 'Mixkit.co'),
            ' - UI and game sound effects'
          ),
          React.createElement('li', null,
            React.createElement('a', { href: 'https://www.zapsplat.com', target: '_blank', className: 'text-primary' }, 'Zapsplat.com'),
            ' - Professional sounds (free account required)'
          )
        ),
        React.createElement(
          'div',
          { className: 'alert alert-info mt-3' },
          React.createElement('strong', null, 'File Guidelines:'),
          React.createElement('ul', { className: 'mb-0 mt-2' },
            React.createElement('li', null, 'Duration: 100-500ms for UI sounds'),
            React.createElement('li', null, 'Format: MP3, WAV, or OGG'),
            React.createElement('li', null, 'Size: Keep under 50KB each'),
            React.createElement('li', null, 'Volume: Normalize to prevent loud sounds')
          )
        )
      )
    },
    {
      title: "Place Files in /public/sounds/",
      content: React.createElement(
        'div',
        null,
        React.createElement('p', null, 'You need to replace these placeholder files with real audio:'),
        React.createElement('ul', null,
          React.createElement('li', null, React.createElement('code', null, '/public/sounds/button-click.mp3')),
          React.createElement('li', null, React.createElement('code', null, '/public/sounds/success.mp3')),
          React.createElement('li', null, React.createElement('code', null, '/public/sounds/error.mp3')),
          React.createElement('li', null, React.createElement('code', null, '/public/sounds/notification.mp3'))
        ),
        React.createElement(
          'div',
          { className: 'alert alert-warning mt-3' },
          React.createElement('strong', null, 'Important: '),
          'The current files are text placeholders, not audio files. You must replace them with actual MP3 files downloaded from the sources above.'
        )
      )
    },
    {
      title: "Test Your Audio Files",
      content: React.createElement(
        'div',
        null,
        React.createElement('p', null, 'Click these buttons to test if your MP3 files are working:'),
        React.createElement(
          'div',
          { className: 'd-grid gap-2' },
          ['button-click.mp3', 'success.mp3', 'error.mp3', 'notification.mp3'].map(filename =>
            React.createElement(
              'button',
              {
                key: filename,
                className: `btn ${testResults[filename] === 'success' ? 'btn-success' : 
                                testResults[filename] === 'failed' ? 'btn-danger' : 'btn-outline-primary'}`,
                onClick: () => testMP3File(filename)
              },
              `Test ${filename} `,
              testResults[filename] === 'success' && '✓',
              testResults[filename] === 'failed' && '✗'
            )
          )
        ),
        React.createElement(
          'div',
          { className: 'mt-3' },
          React.createElement('small', { className: 'text-muted' },
            'If tests fail, the files are still placeholders or have incorrect format.'
          )
        )
      )
    },
    {
      title: "Use in Your Components",
      content: React.createElement(
        'div',
        null,
        React.createElement('p', null, 'Once files are working, use them in your React components:'),
        React.createElement(
          'pre',
          { className: 'bg-light p-3 rounded' },
          `// Simple usage
const playSound = (file) => {
  const audio = new Audio(\`/sounds/\${file}\`);
  audio.volume = 0.5;
  audio.play();
};

// In a button
<button onClick={() => playSound('button-click.mp3')}>
  Click Me
</button>

// With error handling
const playSound = (file) => {
  const audio = new Audio(\`/sounds/\${file}\`);
  audio.play().catch(error => {
    console.log('Sound failed:', error);
    // Fallback to beep
    window.useSound().sounds.beep();
  });
};`
        )
      )
    }
  ];

  return React.createElement(
    'div',
    { className: 'container py-5' },
    React.createElement('h1', { className: 'display-5 fw-bold text-primary mb-4' }, 'MP3 Integration Guide'),
    
    React.createElement(
      'div',
      { className: 'row' },
      React.createElement(
        'div',
        { className: 'col-md-3' },
        React.createElement(
          'div',
          { className: 'nav flex-column nav-pills' },
          steps.map((s, index) =>
            React.createElement(
              'button',
              {
                key: index,
                className: `nav-link ${step === index + 1 ? 'active' : ''}`,
                onClick: () => setStep(index + 1)
              },
              `${index + 1}. ${s.title}`
            )
          )
        )
      ),
      React.createElement(
        'div',
        { className: 'col-md-9' },
        React.createElement(
          'div',
          { className: 'card' },
          React.createElement(
            'div',
            { className: 'card-body' },
            React.createElement('h5', { className: 'card-title' }, steps[step - 1].title),
            steps[step - 1].content
          )
        )
      )
    ),

    React.createElement(
      'div',
      { className: 'mt-4 d-flex justify-content-between' },
      React.createElement(
        'button',
        {
          className: 'btn btn-outline-secondary',
          disabled: step === 1,
          onClick: () => setStep(step - 1)
        },
        'Previous'
      ),
      React.createElement(
        'button',
        {
          className: 'btn btn-primary',
          disabled: step === steps.length,
          onClick: () => setStep(step + 1)
        },
        'Next'
      )
    )
  );
};

window.MP3Guide = MP3Guide;