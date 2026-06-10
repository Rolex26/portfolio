import { lazy, Suspense } from 'react';
import HeroSection from './components/HeroSection';
import CustomCursor from './components/CustomCursor';
import FeaturedProjects from './components/FeaturedProjects';
import DemoOne from './components/demo';

// Lazy-load text-based below-the-fold components (not DemoOne — Three.js needs eager init)
const Qualifications = lazy(() => import('./components/Qualifications'));
const Experiences = lazy(() => import('./components/Experiences'));
const Testimonials = lazy(() => import('./components/Testimonials'));
const Footer = lazy(() => import('./components/Footer'));

function App() {
  return (
    <div className="bg-black text-white selection:bg-white selection:text-black">
      <CustomCursor />
      <HeroSection />
      <FeaturedProjects />
      <DemoOne />
      <Suspense fallback={<div className="bg-black w-full min-h-screen" />}>
        <Qualifications />
        <Experiences />
        <Testimonials />
        <Footer />
      </Suspense>
    </div>
  );
}

export default App;
