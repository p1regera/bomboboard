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
  { name: 'BOMBOCLAT', emoji: '💣', file: 'bomboclat.mp3' },
  { name: 'ANIME MOAN', emoji: '😳', file: 'anime_moan.mp3' },
  { name: 'AMONG US IMPOSTER', emoji: '👽', file: 'among_us_imposter.mp3' },
  { name: 'DISCORD CALL', emoji: '📞', file: 'discord_call.mp3' },
  { name: 'FAHHHH', emoji: '😤', file: 'fahhhh.mp3' },
  { name: 'FORTNITE DOWN', emoji: '🎮', file: 'fortnite_down.mp3' },
  { name: 'SMOKE DETECTOR', emoji: '🚨', file: 'smoke_detector.mp3' },
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

const sanitizeFileName = (name = '') => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
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
  const activeSoundRef = useRef(null);
  const fileCacheRef = useRef(new Map());

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

  const stopAllSounds = useCallback(() => {
    players.forEach((howl) => {
      if (howl.playing()) {
        howl.stop();
      }
    });
    activeSoundRef.current = null;
  }, [players]);

  const handlePlay = useCallback(
    (sound) => {
      const howl = players.get(sound.name);
      if (!howl) {
        return;
      }

      stopAllSounds();
      howl.play();
      activeSoundRef.current = sound.name;
      howl.once('end', () => {
        if (activeSoundRef.current === sound.name) {
          activeSoundRef.current = null;
        }
      });

      triggerRipple(sound.name);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
    },
    [players, stopAllSounds, triggerRipple]
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

      const fetchShareFile = async () => {
        if (
          typeof File === 'undefined' ||
          !relativeUrl ||
          fileCacheRef.current.has(shareUrl)
        ) {
          return fileCacheRef.current.get(shareUrl);
        }

        const response = await fetch(shareUrl);
        if (!response.ok) {
          throw new Error('Failed to download sound');
        }
        const blob = await response.blob();
        const extensionMatch = shareUrl.match(/\.([a-z0-9]+)(?:\?|#)?$/i);
        const extension = extensionMatch ? extensionMatch[1] : 'mp3';
        const file = new File([blob], `${sanitizeFileName(sound.name) || 'sound'}.${extension}`, {
          type: blob.type || 'audio/mpeg',
          lastModified: Date.now(),
        });
        fileCacheRef.current.set(shareUrl, file);
        return file;
      };

      if (nav?.share) {
        if (nav.canShare) {
          try {
            const shareFile = await fetchShareFile();
            if (shareFile && nav.canShare({ files: [shareFile] })) {
              await nav.share({
                files: [shareFile],
                title: `${sound.name} - Bomboboard`,
                text: 'Drop this straight into iMessage 📲',
              });
              showToast('Opening share sheet…');
              return;
            }
          } catch (error) {
            console.error('File share failed', error);
          }
        }

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
          'radial-gradient(circle at 15% 20%, rgba(148,163,255,0.35), transparent 60%), radial-gradient(circle at 80% 0%, rgba(64,224,208,0.25), transparent 55%), linear-gradient(135deg, #050914 0%, #0d1527 45%, #17203b 100%)',
      }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(120deg, rgba(64,224,208,0.12) 1px, transparent 1px), linear-gradient(300deg, rgba(167,139,250,0.16) 1px, transparent 1px)',
          backgroundSize: '220px 220px',
        }}
        animate={{ backgroundPosition: ['0px 0px', '180px 110px'] }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05060f]/60 via-transparent to-transparent" />

      <section className="relative z-10 w-full">
        <div className="relative min-h-screen">
          <div className="mx-auto w-full max-w-[90vw] px-[5%] text-white/90 md:max-w-[80vw] md:px-[10%]">
            <div className="pt-12 pb-8 text-center md:pt-16 md:pb-12">
              <h1
                className="mb-[60px] text-5xl font-extralight uppercase tracking-[0.35em] text-white drop-shadow-[0_15px_45px_rgba(10,12,25,0.6)] md:text-7xl"
                style={{
                  textShadow:
                    '0 0 25px rgba(167,139,250,0.65), 0 0 55px rgba(64,224,208,0.35)',
                }}
              >
                BOMBOBOARD
              </h1>

              <p
                className="text-xs uppercase tracking-[0.7em] text-[#c6b5ff]"
                style={{ textShadow: '0 0 18px rgba(198,181,255,0.45)' }}
              >
                tap to play
              </p>
            </div>

            <div className="mx-auto grid max-w-2xl grid-cols-3 gap-[2vw] md:gap-[3vw]">
              {SOUND_LIBRARY.map((sound) => (
                <motion.div
                  key={sound.name}
                  className="group relative aspect-square w-full overflow-hidden rounded-[1.7rem] border border-white/15 bg-gradient-to-br from-white/12 via-white/6 to-transparent/5 p-5 shadow-[0_25px_60px_rgba(5,6,15,0.45)] backdrop-blur-2xl"
                  style={{
                    minHeight: 'clamp(120px, 24vw, 150px)',
                    maxHeight: '150px',
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
                          'radial-gradient(circle at 30% 20%, rgba(167,139,250,0.25), transparent 60%)',
                      }}
                    />
                  </div>

                  <AnimatePresence>
                    {ripple?.name === sound.name && (
                      <motion.span
                        key={ripple.id}
                        className="pointer-events-none absolute inset-0 rounded-[1.7rem]"
                        style={{
                          background:
                            'radial-gradient(circle, rgba(64,224,208,0.4) 0%, transparent 60%)',
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
                    className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl text-center text-white/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b362ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f1e]"
                    aria-label={`Play ${sound.name}`}
                  >
                    <div className="text-4xl text-white drop-shadow-[0_0_28px_rgba(82,197,255,0.55)] md:text-5xl">
                      {sound.emoji}
                    </div>
                    <div className="text-[0.65rem] uppercase tracking-[0.4em] text-white/75 md:text-sm">
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
                    className="absolute top-4 right-4 z-20 rounded-full bg-white/10 p-1 text-white/70 transition hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
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