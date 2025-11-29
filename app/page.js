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
  { name: 'Bomboclat', emoji: '💣', url: '/sounds/bomboclat.mp3' },
  { name: 'Bruh', emoji: '😐', url: '/sounds/bruh.mp3' },
  { name: 'Vine Boom', emoji: '💥', url: '/sounds/vine-boom.mp3' },
  { name: 'Oh No', emoji: '😱', url: '/sounds/oh-no.mp3' },
  { name: 'Wow', emoji: '😮' },
  { name: 'Sad', emoji: '😢' },
];

export default function Home() {
  const [toast, setToast] = useState(null);
  const [ripple, setRipple] = useState(null);
  const toastTimer = useRef(null);

  const players = useMemo(() => {
    const registry = new Map();
    SOUND_LIBRARY.forEach((sound) => {
      if (!sound.url) {
        return;
      }
      registry.set(
        sound.name,
        new Howl({
          src: [sound.url],
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
    toastTimer.current = setTimeout(() => setToast(null), 1400);
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
    async (sound) => {
      const howl = players.get(sound.name);
      if (howl) {
        howl.stop();
        howl.play();
      }

      triggerRipple(sound.name);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }

      if (typeof window !== 'undefined') {
        const shareUrl = sound.url
          ? `${window.location.origin}${sound.url}`
          : window.location.href;
        try {
          await navigator?.clipboard?.writeText(shareUrl);
          showToast('Copied!');
        } catch {
          showToast('Link ready');
        }
      }
    },
    [players, showToast, triggerRipple]
  );

  return (
    <main
      className={`${inter.className} relative min-h-screen overflow-hidden text-white`}
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

      <motion.section
        className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 py-16 text-center"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <motion.h1
          className="text-[clamp(5rem,13vw,8rem)] font-extralight uppercase tracking-[0.5em]"
          style={{
            textShadow:
              '0 0 30px rgba(179,98,255,0.8), 0 0 60px rgba(0,148,255,0.4)',
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          BOMBOBOARD
        </motion.h1>

        <motion.p
          className="mt-4 uppercase tracking-[0.7em] text-sm text-[#b362ff]"
          style={{ textShadow: '0 0 20px rgba(179,98,255,0.4)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          tap to play
        </motion.p>

        <motion.div
          className="mt-16 grid w-full grid-cols-3 gap-8"
          style={{
            maxWidth: 'min(100%, 540px)',
            gridTemplateColumns: 'repeat(3, minmax(120px, 1fr))',
          }}
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0, y: 24 },
            show: {
              opacity: 1,
              y: 0,
              transition: { staggerChildren: 0.1, delayChildren: 0.2 },
            },
          }}
        >
          {SOUND_LIBRARY.map((sound, index) => (
            <motion.button
              key={sound.name}
              type="button"
              className="group relative flex aspect-square flex-col items-center justify-center rounded-3xl border text-center focus:outline-none"
              style={{
                padding: 'clamp(1.5rem, 4vw, 2.6rem)',
                borderColor: 'rgba(179, 98, 255, 0.35)',
                background: 'rgba(20,20,40,0.6)',
                boxShadow: '0 0 25px rgba(0,0,0,0.55)',
                backdropFilter: 'blur(10px)',
                overflow: 'hidden',
              }}
              variants={{
                hidden: { opacity: 0, y: 40 },
                show: { opacity: 1, y: 0 },
              }}
              animate={{ y: [0, -6, 0] }}
              transition={{
                delay: index * 0.05,
                duration: 6,
                repeat: Infinity,
                repeatType: 'mirror',
                ease: 'easeInOut',
              }}
              whileHover={{
                scale: 1.04,
                boxShadow: '0 0 40px rgba(179,98,255,0.4)',
                borderColor: 'rgba(179, 98, 255, 0.9)',
              }}
              whileTap={{
                scale: 0.98,
                boxShadow: '0 0 50px rgba(0,212,255,0.5)',
              }}
              onClick={() => handlePlay(sound)}
              aria-label={`Play ${sound.name}`}
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(circle at top, rgba(179,98,255,0.25), transparent 65%)',
                  }}
                />
              </div>
              <AnimatePresence>
                {ripple?.name === sound.name && (
                  <motion.span
                    key={ripple.id}
                    className="pointer-events-none absolute inset-0 rounded-3xl"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(0,212,255,0.4) 0%, transparent 60%)',
                    }}
                    initial={{ opacity: 0.9, scale: 0.2 }}
                    animate={{ opacity: 0, scale: 1.1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                  />
                )}
              </AnimatePresence>

              <span className="relative z-10 flex h-full w-full flex-1 items-center justify-center text-[4rem] text-white drop-shadow-[0_0_25px_rgba(0,212,255,0.6)]">
                {sound.emoji}
              </span>
              <span className="relative z-10 mt-4 text-sm font-medium uppercase tracking-[0.35em] text-white/85">
                {sound.name}
              </span>
            </motion.button>
          ))}
        </motion.div>
      </motion.section>

      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            className="fixed left-1/2 top-8 -translate-x-1/2 rounded-full border px-6 py-3 text-xs uppercase tracking-[0.5em] text-white backdrop-blur-md"
            style={{
              borderColor: 'rgba(179,98,255,0.5)',
              background: 'rgba(10,10,30,0.85)',
              boxShadow: '0 0 30px rgba(0,212,255,0.45)',
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}