import ActiveSplashCursor from './components/ActiveSplashCursor';
import BookingModal from './components/BookingModal';
import NavDots from './components/NavDots';
import { BookingProvider } from './context/BookingContext';
import { useScrollSpy } from './hooks/useScrollSpy';
import SlideAbout from './slides/SlideAbout';
import SlideCover from './slides/SlideCover';
import SlideExperience from './slides/SlideExperience';
import SlideReleases from './slides/SlideReleases';
import SlideRider from './slides/SlideRider';
import SlideStyles from './slides/SlideStyles';

export default function App() {
  const [activeIndex, goToSlide] = useScrollSpy();

  return (
    <BookingProvider>
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
  );
}
