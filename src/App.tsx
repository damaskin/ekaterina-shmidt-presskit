import { useRef } from 'react';
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
  const scrollRef = useRef<HTMLElement>(null);
  const [activeIndex, goToSlide] = useScrollSpy(scrollRef);

  return (
    <BookingProvider>
      <NavDots activeIndex={activeIndex} onNavigate={goToSlide} />
      <main ref={scrollRef} className="presskit-scroll">
        <SlideCover />
        <SlideAbout />
        <SlideStyles />
        <SlideExperience />
        <SlideReleases />
        <SlideRider />
      </main>
      <BookingModal />
    </BookingProvider>
  );
}
