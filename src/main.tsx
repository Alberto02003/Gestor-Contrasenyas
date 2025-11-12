import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  HashRouter,
  Routes,
  Route,
} from "react-router-dom";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import { HomePage } from '@/pages/HomePage'
import { Toaster } from 'sonner';

// Detect if running in Electron
const isElectron = () => {
  return !!(window as any).electron?.isElectron;
};

// Apply compact layout class if in Electron
if (isElectron()) {
  document.documentElement.classList.add('compact-layout');
}

// Use HashRouter for Electron compatibility with file:// protocol
// HashRouter works with both file:// (Electron production) and http:// (dev server)
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} errorElement={<RouteErrorBoundary />} />
          <Route path="*" element={<RouteErrorBoundary />} />
        </Routes>
      </HashRouter>
      <Toaster richColors closeButton />
    </ErrorBoundary>
  </StrictMode>,
)