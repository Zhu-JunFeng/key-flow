import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Suspense, lazy, useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import ParticleEffect from './components/ParticleEffect';
import { getWallpaperState, randomizeWallpaper } from './lib/wallpaper';
import { handleAuthCallback } from './lib/auth';
import { connectSocket, socket } from './lib/socket';
import { getDeviceId } from './lib/device';
import QuoteBar from './components/QuoteBar';

const Home = lazy(() => import('./pages/Home'));
const Lessons = lazy(() => import('./pages/Lessons'));
const LessonPlay = lazy(() => import('./pages/LessonPlay'));
const Practice = lazy(() => import('./pages/Practice'));
const TypingTest = lazy(() => import('./pages/TypingTest'));
const Multiplayer = lazy(() => import('./pages/Multiplayer'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DailyChallenge = lazy(() => import('./pages/DailyChallenge'));
const Friends = lazy(() => import('./pages/Friends'));
const ReplayPage = lazy(() => import('./pages/ReplayPage'));
const CodeMode = lazy(() => import('./pages/CodeMode'));
const Games = lazy(() => import('./pages/Games'));
const PracticeModes = lazy(() => import('./pages/PracticeModes'));
const Profile = lazy(() => import('./pages/Profile'));

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: 'easeIn' as const } },
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <Suspense fallback={<RouteFallback />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/lessons" element={<Lessons />} />
            <Route path="/lessons/:id" element={<LessonPlay />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/practice/code" element={<CodeMode />} />
            <Route path="/practice/modes" element={<PracticeModes />} />
            <Route path="/test" element={<TypingTest />} />
            <Route path="/multiplayer" element={<Multiplayer />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/daily" element={<DailyChallenge />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/replay" element={<ReplayPage />} />
            <Route path="/replay/:id" element={<ReplayPage />} />
            <Route path="/games" element={<Games />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

function RouteFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div
        className="px-4 py-2 rounded-full text-sm"
        style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          color: 'var(--text-secondary)',
        }}
      >
        Loading...
      </div>
    </div>
  );
}

export default function App() {
  const [wallpaperUrl, setWallpaperUrl] = useState(() => getWallpaperState().url);

  // Handle OAuth callback on app load
  useEffect(() => {
    handleAuthCallback();
  }, []);

  // Listen for manual wallpaper change
  useEffect(() => {
    const handler = () => {
      const state = randomizeWallpaper();
      setWallpaperUrl(state.url);
    };
    window.addEventListener('wallpaper-change', handler);
    return () => window.removeEventListener('wallpaper-change', handler);
  }, []);

  // Connect socket and report online on app startup
  useEffect(() => {
    connectSocket();
    const deviceId = getDeviceId();
    const emitOnline = () => {
      socket.emit('user:online', { deviceId });
    };
    if (socket.connected) {
      emitOnline();
    }
    socket.on('connect', emitOnline);
    return () => {
      socket.off('connect', emitOnline);
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen relative">
        {/* Background wallpaper - HD display */}
        <div
          className="fixed inset-0 z-[-2] bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
          style={{ backgroundImage: `url(${wallpaperUrl})` }}
        />
        <ParticleEffect />
        <Navbar />
        <AnimatedRoutes />

        {/* Motivational quote bar - bottom */}
        <QuoteBar />

        {/* Floating wallpaper change button - bottom right, above quote bar */}
        <button
          onClick={() => window.dispatchEvent(new Event('wallpaper-change'))}
          className="fixed bottom-6 right-6 w-11 h-11 rounded-full flex items-center justify-center z-40 transition-all duration-300 hover:scale-110 active:scale-95"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            color: 'var(--text-secondary)',
          }}
          title="Change Wallpaper"
        >
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21zM8.25 8.625a1.125 1.125 0 100-2.25 1.125 1.125 0 000 2.25z" />
          </svg>
        </button>
      </div>
    </BrowserRouter>
  );
}
