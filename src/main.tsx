import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const prerenderNode = document.getElementById('prerender-home');
if (prerenderNode) {
  // Remove static prerender content once the React app is ready to mount.
  prerenderNode.remove();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
