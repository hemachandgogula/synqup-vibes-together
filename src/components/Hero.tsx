
import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

export function Hero() {
  return (
    <div className="relative overflow-hidden bg-background py-20 md:py-32">
      {/* Background gradient elements */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-synqup-soft-purple/30 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-synqup-soft-blue/30 blur-3xl" />
      
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <div 
            className="animate-float inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-synqup-purple to-synqup-dark-purple shadow-lg"
          >
            <Play className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight animate-fade-in">
            <span className="text-gradient">Share Media Moments,</span> Together
          </h1>
          <p className="max-w-[42rem] text-muted-foreground sm:text-xl animate-fade-in">
            Watch movies, listen to music, and share experiences in perfect sync, 
            no matter where you are. Connect with friends and loved ones through shared media.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-in">
            <Button asChild size="lg" className="bg-synqup-purple hover:bg-synqup-dark-purple text-white h-12 px-6">
              <Link to="/signup">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-6">
              <Link to="/features">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
