import {StrictMode, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const prerenderNode = document.getElementById('prerender-home');
const rootNode = document.getElementById('root')!;
const isAppRoute = window.location.pathname === '/app' || window.location.pathname.startsWith('/app/');

if (prerenderNode && isAppRoute) {
  // Keep the prerendered HTML visible during hydration to improve crawler and UX consistency.
  rootNode.style.opacity = '0';
}

function AppWithPrerenderTransition() {
  useEffect(() => {
    if (!prerenderNode || !isAppRoute) return;

    // Wait one frame so React has painted before we fade out the static shell.
    const frame = window.requestAnimationFrame(() => {
      prerenderNode.style.transition = 'opacity 220ms ease';
      rootNode.style.transition = 'opacity 220ms ease';
      prerenderNode.style.opacity = '0';
      rootNode.style.opacity = '1';

      window.setTimeout(() => {
        prerenderNode.remove();
      }, 260);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  return <App />;
}

if (isAppRoute) {
  createRoot(rootNode).render(
    <StrictMode>
      <AppWithPrerenderTransition />
    </StrictMode>,
  );
} else {
  // Keep public pages fully static for SEO/GEO and avoid unnecessary hydration.
  rootNode.remove();
}
