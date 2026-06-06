import { isTelegramWebApp, useTelegramWebApp } from './hooks/useTelegramWebApp';
import './telegram-webapp.css';
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
