const { React } = window;

const SoundButton = ({ 
  children, 
  soundType = 'buttonClick', 
  soundOptions = {}, 
  className = '', 
  onClick, 
  ...props 
}) => {
  const { sounds, playSound } = window.useSound();

  const handleClick = (e) => {
    // Play sound effect
    if (soundType === 'custom' && soundOptions.path) {
      playSound('custom', soundOptions.path, soundOptions);
    } else if (sounds[soundType]) {
      sounds[soundType]();
    } else {
      // Default beep sound
      sounds.beep();
    }

    // Call original onClick
    if (onClick) {
      onClick(e);
    }
  };

  return React.createElement(
    'button',
    {
      ...props,
      className: `btn ${className}`,
      onClick: handleClick
    },
    children
  );
};

// Export to window for global access
window.SoundButton = SoundButton;