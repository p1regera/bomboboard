'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Howl } from 'howler';
import { AnimatePresence, motion } from 'framer-motion';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['100', '400', '500', '600'],
  display: 'swap',
});

const SOUND_LIBRARY = [
  { name: 'Bomboclat', emoji: '💣', file: 'bomboclat.mp3' },
  { name: 'Bruh', emoji: '😐', file: 'bruh.mp3' },
  { name: 'Vine Boom', emoji: '💥', file: 'vine-boom.mp3' },
  { name: 'Oh No', emoji: '😱', file: 'oh-no.mp3' },
  { name: 'Wow', emoji: '😮' },
  { name: 'Sad', emoji: '😢' },
];

const resolveSoundUrl = (sound) => {
  if (sound.url) {
    return sound.url;
  }
  if (sound.file) {
    return `/sounds/${sound.file}`;
  }
  return null;
};

const ShareIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12.5 3.5H16.5V7.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 12L16.5 3.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16.5 12.5V16.5H3.5V3.5H7.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function Home() {
  const [toast, setToast] = useState(null);
  const [ripple, setRipple] = useState(null);
  const toastTimer = useRef(null);

  const players = useMemo(() => {
    const registry = new Map();
    SOUND_LIBRARY.forEach((sound) => {
      const src = resolveSoundUrl(sound);
      if (!src) {
        return;
      }
      registry.set(
        sound.name,
        new Howl({
          src: [src],
          html5: true,
        })
      );
    });
    return registry;
  }, []);

  useEffect(() => {
    return () => {
      players.forEach((howl) => howl.unload());
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, [players]);

  const showToast = useCallback((message) => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }, []);

  const triggerRipple = useCallback((name) => {
    setRipple({ name, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!ripple) return;
    const timer = setTimeout(() => setRipple(null), 450);
    return () => clearTimeout(timer);
  }, [ripple]);

  const handlePlay = useCallback(
    (sound) => {
      const howl = players.get(sound.name);
      if (howl) {
        howl.stop();
        howl.play();
      }

      triggerRipple(sound.name);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
    },
    [players, triggerRipple]
  );

  const shareSound = useCallback(
    async (sound) => {
      if (typeof window === 'undefined') {
        return;
      }

      const nav = typeof navigator === 'undefined' ? null : navigator;
      const relativeUrl = resolveSoundUrl(sound);
      const shareUrl = relativeUrl
        ? relativeUrl.startsWith('http')
          ? relativeUrl
          : `${window.location.origin}${relativeUrl}`
        : window.location.href;

      if (nav?.share) {
        try {
          await nav.share({
            title: `${sound.name} - Bomboboard`,
            text: `Check out this sound: ${sound.name}`,
            url: shareUrl,
          });
          return;
        } catch (error) {
          if (error?.name === 'AbortError') {
            return;
          }
        }
      }

      if (nav?.clipboard?.writeText) {
        try {
          await nav.clipboard.writeText(shareUrl);
          showToast('Link copied!');
          return;
        } catch {
          // ignore and fall through to toast
        }
      }

      showToast('Link ready');
    },
    [showToast]
  );

  return (
    <main
      className={`${inter.className} relative flex min-h-screen flex-col overflow-hidden p-6 text-white md:p-12`}
      style={{
        backgroundImage:
          'radial-gradient(circle at 20% -10%, rgba(179,98,255,0.35), transparent 35%), radial-gradient(circle at 80% 0%, rgba(0,148,255,0.3), transparent 40%), linear-gradient(135deg, #0a0a1a 0%, #02020c 50%, #000000 100%)',
      }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(120deg, rgba(0,212,255,0.2) 1px, transparent 1px), linear-gradient(300deg, rgba(179,98,255,0.2) 1px, transparent 1px)',
          backgroundSize: '240px 240px',
        }}
        animate={{ backgroundPosition: ['0px 0px', '200px 120px'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

      <section className="relative z-10 w-full">
        <div className="relative min-h-screen">
          <div className="mx-auto w-full max-w-[90vw] px-[5%] md:max-w-[80vw] md:px-[10%]">
            <div className="pt-12 pb-8 text-center md:pt-16 md:pb-12">
              <h1
                className="mb-[60px] text-5xl font-extralight uppercase tracking-[0.35em] text-white md:text-7xl"
                style={{
                  textShadow:
                    '0 0 30px rgba(179,98,255,0.8), 0 0 60px rgba(0,148,255,0.4)',
                }}
              >
                BOMBOBOARD
              </h1>

              <p
                className="text-xs uppercase tracking-[0.7em] text-[#b362ff]"
                style={{ textShadow: '0 0 20px rgba(179,98,255,0.4)' }}
              >
                tap to play
              </p>
            </div>

            <div className="grid grid-cols-3 gap-[2vw] md:gap-[3vw] max-w-2xl mx-auto">
              {SOUND_LIBRARY.map((sound) => (
                <motion.div
                  key={sound.name}
                  className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                  style={{
                    minHeight: 'clamp(120px, 25vw, 140px)',
                    maxHeight: '140px',
                  }}
                  whileHover={{
                    scale: 1.02,
                    borderColor: 'rgba(179, 98, 255, 0.9)',
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1, ease: 'easeOut' }}
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100">
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          'radial-gradient(circle at top, rgba(179,98,255,0.2), transparent 65%)',
                      }}
                    />
                  </div>

                  <AnimatePresence>
                    {ripple?.name === sound.name && (
                      <motion.span
                        key={ripple.id}
                        className="pointer-events-none absolute inset-0 rounded-2xl"
                        style={{
                          background:
                            'radial-gradient(circle, rgba(0,212,255,0.35) 0%, transparent 60%)',
                        }}
                        initial={{ opacity: 0.8, scale: 0.2 }}
                        animate={{ opacity: 0, scale: 1.05 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                      />
                    )}
                  </AnimatePresence>

                  <button
                    type="button"
                    onClick={() => handlePlay(sound)}
                    className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b362ff] focus-visible:ring-offset-2 focus-visible:ring-offset-black/20"
                    aria-label={`Play ${sound.name}`}
                  >
                    <div className="text-4xl text-white drop-shadow-[0_0_25px_rgba(0,212,255,0.55)] md:text-5xl">
                      {sound.emoji}
                    </div>
                    <div className="text-[0.65rem] uppercase tracking-[0.35em] text-white/80 md:text-sm">
                      {sound.name}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      shareSound(sound);
                    }}
                    className="absolute top-4 right-4 z-20 rounded-full bg-white/10 p-1 text-white/60 transition hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                    aria-label={`Share ${sound.name}`}
                  >
                    <ShareIcon size={16} />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            className="fixed top-4 right-4 z-50 rounded-full px-4 py-2 text-sm font-medium text-white shadow-xl backdrop-blur"
            style={{ background: 'rgba(179, 98, 255, 0.9)' }}
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}