import { motion } from 'framer-motion';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';
import StatusBar from './StatusBar';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-accent/30 transition-colors duration-200">
      {/* Sticky Top Bar */}
      <TopBar />

      <div className="flex flex-1 relative">
        {/* Dynamic Role-Aware Sidebar */}
        <Sidebar />

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0">
          <motion.main
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex-1 p-6 max-w-[1600px] w-full mx-auto"
          >
            <Breadcrumbs />
            {children}
          </motion.main>

          {/* Footer Status Bar */}
          <StatusBar />
        </div>
      </div>
    </div>
  );
}
