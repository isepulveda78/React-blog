// Use global React and ReactDOM from CDN
const { StrictMode } = React;
const { createRoot } = ReactDOM;

// Import App component
const App = window.App;

const container = document.getElementById('root');
const root = createRoot(container);

if (App) {
  root.render(
    React.createElement(StrictMode, null,
      React.createElement(App)
    )
  );
} else {
  console.error('App component not found');
  document.getElementById('root').innerHTML = '<div class="alert alert-danger">Loading error. Please refresh the page.</div>';
}