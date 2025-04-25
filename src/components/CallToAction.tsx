
import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

export function CallToAction() {
  return (
    <section className="py-20">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center rounded-3xl bg-gradient-to-br from-synqup-purple to-synqup-dark-purple px-6 py-16 text-center shadow-lg">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
            Ready to SynQup?
          </h2>
          <p className="max-w-[42rem] text-white/90 md:text-xl mb-8">
            Join thousands of users already sharing their favorite movies and music with loved ones.
          </p>
          <Button asChild size="lg" variant="outline" className="bg-white text-synqup-purple hover:bg-white/90 h-12 px-8">
            <Link to="/signup">Get Started for Free</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
