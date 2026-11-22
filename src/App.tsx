import { useCallback, useEffect, useState } from 'react';
import { AdminPanel } from './components/AdminPanel';
import { CreativeView } from './components/CreativeView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingSplit } from './components/LandingSplit';
import { ProjectDetailPage } from './components/ProjectDetailPage';
import { TechnicalView } from './components/TechnicalView';
import { PortfolioDataProvider, usePortfolioData } from './context/PortfolioDataContext';
import type { ProjectItem } from './data/portfolio';
import { buildProjectHash, parseProjectIdFromHash } from './lib/projectCaseStudy';
import { parseViewFromLocation, ViewMode, viewToHash } from './lib/splitPhysics';

function AppShell() {
  const { projects } = usePortfolioData();
  const [activeView, setActiveView] = useState<ViewMode>(() =>
    parseViewFromLocation(window.location.hash, window.location.search)
  );
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() =>
    parseProjectIdFromHash(window.location.hash)
  );

  const activeProject =
    activeView === 'tech' && activeProjectId
      ? projects.find((item) => item.id === activeProjectId) ?? null
      : null;

  // Sync body attributes and canonical URL hash
  useEffect(() => {
    document.body.dataset.v = activeView;
    document.body.dataset.project = activeProject ? 'open' : '';

    const nextHash =
      activeView === 'tech' && activeProjectId
        ? buildProjectHash(activeProjectId)
        : viewToHash(activeView);

    if (window.location.hash !== nextHash) {
      const url = nextHash
        ? `${window.location.pathname}${window.location.search}${nextHash}`
        : `${window.location.pathname}${window.location.search}`;
      window.history.replaceState(null, '', url);
    }
  }, [activeView, activeProjectId, activeProject]);

  // Listen to browser hashchange / popstate (back-forward) and Ctrl/Cmd+Shift+A shortcut
  useEffect(() => {
    const syncFromLocation = () => {
      const nextView = parseViewFromLocation(window.location.hash, window.location.search);
      const nextProjectId = parseProjectIdFromHash(window.location.hash);
      setActiveView(nextView);
      setActiveProjectId(nextView === 'tech' ? nextProjectId : null);
    };

    const onKeyDown = (ev: KeyboardEvent) => {
      if ((ev.ctrlKey || ev.metaKey) && ev.shiftKey && ev.key.toLowerCase() === 'a') {
        ev.preventDefault();
        setActiveProjectId(null);
        setActiveView((prev) => (prev === 'admin' ? 'land' : 'admin'));
      }
    };

    window.addEventListener('hashchange', syncFromLocation);
    window.addEventListener('popstate', syncFromLocation);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('hashchange', syncFromLocation);
      window.removeEventListener('popstate', syncFromLocation);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const navigateTo = useCallback((next: ViewMode) => {
    setActiveProjectId(null);
    setActiveView(next);
  }, []);

  const openProjectDetail = useCallback((project: ProjectItem) => {
    const nextHash = buildProjectHash(project.id);
    if (window.location.hash !== nextHash) {
      const url = `${window.location.pathname}${window.location.search}${nextHash}`;
      window.history.pushState(null, '', url);
    }
    setActiveView('tech');
    setActiveProjectId(project.id);
  }, []);

  const closeProjectDetail = useCallback(() => {
    const techHash = viewToHash('tech');
    if (window.location.hash !== techHash) {
      const url = `${window.location.pathname}${window.location.search}${techHash}`;
      window.history.pushState(null, '', url);
    }
    setActiveProjectId(null);
    setActiveView('tech');
  }, []);

  return (
    <>
      <LandingSplit activeView={activeView} onOpenView={navigateTo} />
      <TechnicalView
        activeView={activeView}
        activeProjectId={activeProject ? activeProject.id : null}
        onReturnLanding={() => navigateTo('land')}
        onSwitchCreative={() => navigateTo('cre')}
        onOpenAdmin={() => navigateTo('admin')}
        onOpenProject={openProjectDetail}
      />
      <ProjectDetailPage
        project={activeProject}
        projects={projects}
        isOpen={Boolean(activeProject)}
        onBackToProjects={closeProjectDetail}
        onSelectProject={openProjectDetail}
      />
      <CreativeView
        activeView={activeView}
        onReturnLanding={() => navigateTo('land')}
        onSwitchTechnical={() => navigateTo('tech')}
        onOpenAdmin={() => navigateTo('admin')}
      />
      <AdminPanel activeView={activeView} onNavigateView={navigateTo} />
    </>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <PortfolioDataProvider>
        <AppShell />
      </PortfolioDataProvider>
    </ErrorBoundary>
  );
}

export default App;
