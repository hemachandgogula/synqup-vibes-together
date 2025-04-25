
import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { FeatureSection } from '@/components/FeatureSection';
import { CallToAction } from '@/components/CallToAction';
import { Footer } from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <FeatureSection />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
