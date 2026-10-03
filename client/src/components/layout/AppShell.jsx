import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import Footer from './Footer';

export default function AppShell({ title, subtitle, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!sidebarOpen) return;
    function closeOnEscape(event) {
      if (event.key === 'Escape') setSidebarOpen(false);
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [sidebarOpen]);

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-100 dark:bg-gray-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col bg-slate-50 dark:bg-gray-900">
        <TopBar title={title} subtitle={subtitle} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          {/* min-h-full + flex-col fait tenir le footer collé en bas quand le contenu
              est court (au lieu de flotter juste après) ; dès que le contenu dépasse la
              hauteur visible, ce conteneur grandit avec lui et le footer redevient
              simplement la dernière chose qu'on atteint en défilant jusqu'au bas. */}
          <div className="flex min-h-full flex-col px-4 py-5 sm:px-6 sm:py-7 xl:px-8">
            <div className="mx-auto w-full max-w-[1600px] flex-1">{children}</div>
            <div className="mx-auto w-full max-w-[1600px]">
              <Footer />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
