import { useCallback, useEffect, useState } from 'react';
import { CreativeView } from './components/CreativeView';
import { LandingSplit } from './components/LandingSplit';
import { TechnicalView } from './components/TechnicalView';
import { parseViewFromLocation, ViewMode, viewToHash } from './lib/splitPhysics';

export function App() {
  const [activeView, setActiveView] = useState<ViewMode>(() =>
    parseViewFromLocation(window.location.hash, window.location.search)
  );

  // Sync body[data-v] attribute and URL hash for CSS transitions & deep-linking
  useEffect(() => {
    document.body.dataset.v = activeView;
    const nextHash = viewToHash(activeView);
    if (window.location.hash !== nextHash) {
      const url = nextHash
        ? `${window.location.pathname}${window.location.search}${nextHash}`
        : `${window.location.pathname}${window.location.search}`;
      window.history.replaceState(null, '', url);
    }
  }, [activeView]);

  // Listen to browser hashchange / back-forward
  useEffect(() => {
    const onHashChange = () => {
      setActiveView(parseViewFromLocation(window.location.hash, window.location.search));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigateTo = useCallback((next: ViewMode) => {
    setActiveView(next);
  }, []);

  return (
    <>
      <LandingSplit activeView={activeView} onOpenView={navigateTo} />
      <TechnicalView
        activeView={activeView}
        onReturnLanding={() => navigateTo('land')}
        onSwitchCreative={() => navigateTo('cre')}
      />
      <CreativeView
        activeView={activeView}
        onReturnLanding={() => navigateTo('land')}
        onSwitchTechnical={() => navigateTo('tech')}
      />
    </>
  );
}

export default App;
