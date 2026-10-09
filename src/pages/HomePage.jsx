import React from 'react';
import AnnouncementBar from '../components/AnnouncementBar';
import Header from '../components/Header';
import HeroSlider from '../components/HeroSlider';
import CategoryStrip from '../components/CategoryStrip';
import TrustFeatures from '../components/TrustFeatures';
import FrontCategoryTabs from '../components/FrontCategoryTabs';
import HotSellingSection from '../components/HotSellingSection';
import NewArrivalsSection from '../components/NewArrivalsSection';
import FlashSaleSection from '../components/FlashSaleSection';
import TrendingPicksSection from '../components/TrendingPicksSection';
import CatalogSection from '../components/CatalogSection';
import SearchHero from '../components/SearchHero';
import WatchAndShopReels from '../components/WatchAndShopReels';
import Testimonials from '../components/Testimonials';
import Footer from '../components/Footer';

export default function HomePage() {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main>
        <HeroSlider />
        <CategoryStrip />
        <TrustFeatures />
        <FrontCategoryTabs />
        <HotSellingSection />
        <NewArrivalsSection />
        <FlashSaleSection />
        <TrendingPicksSection />
        <CatalogSection />
        <SearchHero />
        <WatchAndShopReels />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}
