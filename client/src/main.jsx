// Use global React and ReactDOM from CDN
const { StrictMode } = React;
const { createRoot } = ReactDOM;

const container = document.getElementById('root');
const root = createRoot(container);

// Wait for App component to be available
const initApp = () => {
  const App = window.App;
  
  if (App) {
    console.log('App component found, initializing...');
    root.render(
      React.createElement(StrictMode, null,
        React.createElement(App)
      )
    );
  } else {
    console.log('App component not found, retrying...');
    // Try again after a short delay
    setTimeout(initApp, 50);
  }
};

// Start the initialization
initApp();