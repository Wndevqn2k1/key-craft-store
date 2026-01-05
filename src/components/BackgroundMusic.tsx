import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Music, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useToast } from '@/hooks/use-toast';

export function BackgroundMusic() {
  const { data: settings } = useSiteSettings();
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hasAttemptedAutoplay = useRef(false);

  // Extract audio URL from YouTube, SoundCloud, Mixcloud, or direct link
  const getAudioUrl = (url: string | null | undefined): string | null => {
    if (!url || url.trim() === '') return null;

    try {
      // If it's a direct audio file
      if (url.match(/\.(mp3|wav|ogg|m4a)$/i)) {
        return url;
      }

      // If it's a SoundCloud link
      if (url.includes('soundcloud.com')) {
        // Encode the full URL for SoundCloud embed
        const encodedUrl = encodeURIComponent(url);
        return `https://w.soundcloud.com/player/?url=${encodedUrl}&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=false`;
      }

      // If it's a Mixcloud link
      if (url.includes('mixcloud.com')) {
        // Encode the full URL for Mixcloud embed
        const encodedUrl = encodeURIComponent(url);
        return `https://www.mixcloud.com/widget/iframe/?hide_cover=1&autoplay=1&feed=${encodedUrl}`;
      }

      // If it's a YouTube link, extract video ID
      const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
      if (youtubeMatch) {
        const videoId = youtubeMatch[1].split('&')[0]; // Remove query params
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=0&showinfo=0&loop=1&playlist=${videoId}&enablejsapi=1`;
      }

      return url;
    } catch (error) {
      console.error('Error parsing music URL:', error);
      return null;
    }
  };

  const musicUrl = getAudioUrl(settings?.music_url);
  const isEmbed = musicUrl?.includes('youtube.com/embed') || musicUrl?.includes('soundcloud.com/player') || musicUrl?.includes('mixcloud.com/widget') || false;

  // Debug logging
  useEffect(() => {
    console.log('🎵 BackgroundMusic Debug:', {
      rawMusicUrl: settings?.music_url,
      processedMusicUrl: musicUrl,
      isEmbed,
      isPlaying,
    });
  }, [settings?.music_url, musicUrl, isEmbed, isPlaying]);

  // Toggle play/pause
  const togglePlay = async () => {
    try {
      if (isEmbed) {
        // Toggle embed iframe (YouTube/SoundCloud)
        setIsPlaying(!isPlaying);
        localStorage.setItem('backgroundMusicEnabled', (!isPlaying).toString());
      } else if (audioRef.current && musicUrl) {
        // Toggle audio element
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
          localStorage.setItem('backgroundMusicEnabled', 'false');
        } else {
          setIsLoading(true);
          try {
            await audioRef.current.play();
            setIsPlaying(true);
            localStorage.setItem('backgroundMusicEnabled', 'true');
            toast({
              title: 'Đã bật nhạc nền',
              description: 'Nhạc đang phát',
            });
          } catch (error) {
            console.error('Error playing audio:', error);
            toast({
              title: 'Không thể phát nhạc',
              description: 'Trình duyệt chặn autoplay. Vui lòng cho phép âm thanh.',
              variant: 'destructive',
            });
          } finally {
            setIsLoading(false);
          }
        }
      }
    } catch (error) {
      console.error('Toggle play error:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể phát nhạc',
        variant: 'destructive',
      });
    }
  };

  // Detect user interaction to enable autoplay
  useEffect(() => {
    const handleInteraction = () => {
      if (!userInteracted && !hasAttemptedAutoplay.current && musicUrl) {
        console.log('🎵 User interacted! Starting autoplay...');
        setUserInteracted(true);
        hasAttemptedAutoplay.current = true;
        
        // MUST call play() synchronously in the event handler
        if (isEmbed) {
          // For embeds, just set isPlaying to load iframe with autoplay param
          setIsPlaying(true);
          localStorage.setItem('backgroundMusicEnabled', 'true');
          console.log('🎵 Embed autoplay started!');
        } else if (audioRef.current) {
          // Call play() IMMEDIATELY - browser will wait for audio to be ready
          console.log('🎵 Calling audio.play()...');
          audioRef.current.play()
            .then(() => {
              setIsPlaying(true);
              localStorage.setItem('backgroundMusicEnabled', 'true');
              console.log('🎵 Audio autoplay SUCCESS!');
            })
            .catch((error) => {
              console.error('🎵 Autoplay prevented:', error.message);
              hasAttemptedAutoplay.current = false;
            });
        }
      }
    };

    // Remove passive option to ensure it's treated as user gesture
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [userInteracted, musicUrl, isEmbed]);

  // If no music URL configured, don't show the button
  if (!musicUrl) return null;

  return (
    <>
      {/* Audio Player (for direct audio files) */}
      {!isEmbed && musicUrl && (
        <audio
          ref={audioRef}
          src={musicUrl}
          loop
          preload="auto"
          onCanPlay={() => setIsLoading(false)}
          onLoadStart={() => setIsLoading(true)}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Embed iframe (always rendered for autoplay permission) */}
      {isEmbed && (
        <iframe
          ref={iframeRef}
          src={isPlaying ? (musicUrl || '') : 'about:blank'}
          allow="autoplay; encrypted-media; clipboard-write; picture-in-picture"
          style={{ display: 'none' }}
          title="Background Music"
        />
      )}

      {/* Floating Music Button */}
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.5 }}
          className="fixed bottom-6 right-6 z-40"
        >
          <Button
            onClick={togglePlay}
            disabled={isLoading}
            size="icon"
            className={`
              w-14 h-14 rounded-full shadow-2xl
              ${isPlaying 
                ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground glow-primary' 
                : 'bg-card border-2 border-border text-muted-foreground hover:text-foreground'
              }
              transition-all duration-300 hover:scale-110 active:scale-95
              ${showHint ? 'animate-pulse ring-4 ring-primary/50' : ''}
            `}
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isPlaying ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <Music className="w-6 h-6" />
              </motion.div>
            ) : (
              <VolumeX className="w-6 h-6" />
            )}
          </Button>

          {/* Hint/Tooltip */}
          <AnimatePresence>
            {showHint && (
              <motion.div
                initial={{ opacity: 0, x: 10, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.9 }}
                className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap"
              >
                <div className="bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-xl text-sm font-medium border-2 border-primary-foreground/20">
                  🎵 Click để bật nhạc nền!
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Regular Tooltip on hover */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            whileHover={{ opacity: 1, x: 0 }}
            className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap pointer-events-none"
          >
            <div className="bg-popover text-popover-foreground px-3 py-2 rounded-lg shadow-lg text-sm border border-border">
              {isPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
