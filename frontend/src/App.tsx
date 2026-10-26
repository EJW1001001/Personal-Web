import { useState, useEffect } from 'react';
import Header from './layouts/Header';
import About from './features/about/About';
import Footer from './layouts/Footer';
import { BACKEND_HTTP_URL } from './config/backend';
import './layouts/App.css';

interface BackendStatus {
  message: string;
  status: string;
  timestamp: string;
}

function App() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${BACKEND_HTTP_URL}/api/status`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`Backend responded with ${res.status}`);
        return res.json();
      })
      .then(data => setBackendStatus(data))
      .catch(err => {
        if (err.name === 'AbortError') return;
        console.error('Backend connection error:', err);
        setBackendStatus(null);
      });

    return () => controller.abort();
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Header />
      <main>
        {backendStatus && (
          <div className="max-w-none mx-auto px-12 md:px-24 pt-40 mb-12">
            <div className="glass p-3 px-6 inline-flex items-center gap-3 border-l-4 border-accent-color">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-color opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-color"></span>
              </span>
              <span className="mono text-xs text-text-secondary uppercase tracking-widest font-bold">Systems_Link: {backendStatus.message}</span>
            </div>
          </div>
        )}

        <About />
      </main>
      <Footer />
    </div>
  );
}

export default App;
