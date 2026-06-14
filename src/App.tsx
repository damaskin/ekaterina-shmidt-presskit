import { useEffect } from 'react';
import { isTelegramWebApp, useTelegramWebApp } from './hooks/useTelegramWebApp';
import ActiveSplashCursor from './components/ActiveSplashCursor';
import AudioPlayer from './components/AudioPlayer';
import BookingModal from './components/BookingModal';
import LanguageSwitcher from './components/LanguageSwitcher';
import TelegramMainButton from './components/TelegramMainButton';
import NavDots from './components/NavDots';
import { BookingProvider } from './context/BookingContext';
import { LocaleProvider } from './context/LocaleContext';
import { useScrollSpy } from './hooks/useScrollSpy';
import SlideAbout from './slides/SlideAbout';
import SlideCover from './slides/SlideCover';
import SlideExperience from './slides/SlideExperience';
import SlideReleases from './slides/SlideReleases';
import SlideRider from './slides/SlideRider';
import SlideStyles from './slides/SlideStyles';

export default function App() {
  const [activeIndex, goToSlide] = useScrollSpy();
  useTelegramWebApp();

  // Префетч страницы гайда заранее (на idle): переход с пресс-кита открывает
  // её из кэша почти мгновенно вместо полной загрузки документа.
  useEffect(() => {
    const href = `${import.meta.env.BASE_URL}guide/`;
    const prefetch = () => {
      if (document.querySelector('link[data-prefetch="guide"]')) return;
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'document';
      link.href = href;
      link.dataset.prefetch = 'guide';
      document.head.appendChild(link);
    };
    const ric = (window as unknown as {
      requestIdleCallback?: (cb: () => void) => number;
    }).requestIdleCallback;
    const cic = (window as unknown as {
      cancelIdleCallback?: (id: number) => void;
    }).cancelIdleCallback;
    const id = ric ? ric(prefetch) : window.setTimeout(prefetch, 1500);
    return () => {
      if (ric && cic) cic(id);
      else clearTimeout(id);
    };
  }, []);

  return (
    <LocaleProvider>
    <BookingProvider>
      <TelegramMainButton />
      <AudioPlayer />
      {!isTelegramWebApp() && <LanguageSwitcher />}
      <ActiveSplashCursor activeIndex={activeIndex} />
      <NavDots activeIndex={activeIndex} onNavigate={goToSlide} />
      <SlideCover />
      <SlideAbout />
      <SlideStyles />
      <SlideExperience />
      <SlideReleases />
      <SlideRider />
      <BookingModal />
    </BookingProvider>
    </LocaleProvider>
  );
}
