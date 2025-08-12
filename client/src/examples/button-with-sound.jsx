// Example: Adding sound to existing buttons
const { React } = window;
const { toast } = window;

// Method 1: Using the useSound hook directly
const ExampleButton1 = () => {
  const { sounds } = window.useSound();

  return React.createElement(
    'button',
    {
      className: 'btn btn-primary',
      onClick: () => {
        sounds.buttonClick(); // Play sound
        console.log('Button clicked!');
      }
    },
    'Click with Sound'
  );
};

// Method 2: Adding sound to your existing buttons
const ExampleRegistrationForm = () => {
  const { sounds } = window.useSound();

  const handleSubmit = (e) => {
    e.preventDefault();
    sounds.success(); // Play success sound
    toast({
      title: "Success",
      description: "Registration successful!",
      variant: "default"
    });
  };

  const handleCancel = () => {
    sounds.error(); // Play error/cancel sound
    console.log('Registration cancelled');
  };

  return React.createElement(
    'form',
    { onSubmit: handleSubmit },
    React.createElement('input', { type: 'text', placeholder: 'Name', required: true }),
    React.createElement('br'),
    React.createElement('br'),
    React.createElement(
      'button',
      {
        type: 'submit',
        className: 'btn btn-success me-2'
      },
      'Register'
    ),
    React.createElement(
      'button',
      {
        type: 'button',
        className: 'btn btn-secondary',
        onClick: handleCancel
      },
      'Cancel'
    )
  );
};

// Method 3: Enhanced click handler with multiple sound options
const ExampleGameButton = () => {
  const { sounds, playSound } = window.useSound();

  const handleGameAction = (actionType) => {
    switch (actionType) {
      case 'win':
        sounds.success();
        break;
      case 'lose':
        sounds.error();
        break;
      case 'click':
        sounds.beep(600, 150); // Custom beep
        break;
      default:
        sounds.buttonClick();
    }
    console.log(`Game action: ${actionType}`);
  };

  return React.createElement(
    'div',
    { className: 'd-grid gap-2' },
    React.createElement(
      'button',
      {
        className: 'btn btn-outline-primary',
        onClick: () => handleGameAction('click')
      },
      'Game Click'
    ),
    React.createElement(
      'button',
      {
        className: 'btn btn-outline-success',
        onClick: () => handleGameAction('win')
      },
      'Win Sound'
    ),
    React.createElement(
      'button',
      {
        className: 'btn btn-outline-danger',
        onClick: () => handleGameAction('lose')
      },
      'Lose Sound'
    )
  );
};

// Export examples
window.ExampleButton1 = ExampleButton1;
window.ExampleRegistrationForm = ExampleRegistrationForm;
window.ExampleGameButton = ExampleGameButton;