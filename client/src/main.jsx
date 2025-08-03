const { StrictMode } = React;
const { createRoot } = ReactDOM;

// Import App component
const App = () => {
  return React.createElement('div', { className: 'container-fluid' }, 
    React.createElement('h1', { className: 'text-center my-4' }, 'BlogCraft - Modern Blog Platform'),
    React.createElement('div', { className: 'row' },
      React.createElement('div', { className: 'col-12 text-center' },
        React.createElement('p', { className: 'lead' }, 'Welcome to our modern blog platform built with JavaScript and Bootstrap!'),
        React.createElement('button', { 
          className: 'btn btn-primary me-2', 
          onClick: () => alert('Login feature coming soon!') 
        }, 'Login'),
        React.createElement('button', { 
          className: 'btn btn-outline-secondary', 
          onClick: () => alert('Browse posts feature coming soon!') 
        }, 'Browse Posts')
      )
    )
  );
};

createRoot(document.getElementById('root')).render(
  React.createElement(StrictMode, null,
    React.createElement(App)
  )
);