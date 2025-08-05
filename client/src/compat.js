// Compatibility layer for CDN-based components
// This allows the current app to work with both development (CDN) and build modes

// For development, components are loaded from window objects
// For production builds, we need to provide these as proper imports

// Make React available globally for components that expect it
if (typeof window !== 'undefined') {
  window.React = React;
  window.useState = React.useState;
  window.useEffect = React.useEffect;
  window.useRef = React.useRef;
  window.useCallback = React.useCallback;
}

// Export commonly used React hooks for ES6 imports
export const useState = React.useState;
export const useEffect = React.useEffect;
export const useRef = React.useRef;
export const useCallback = React.useCallback;
export const createContext = React.createContext;
export const useContext = React.useContext;

export default React;