
import React from 'react';
import { Music, Video, Users, MessageCircle } from 'lucide-react';

const features = [
  {
    icon: <Video className="h-8 w-8 text-synqup-purple" />,
    title: "Synchronized Video",
    description: "Watch movies and videos together with frame-perfect synchronization, just like being in the same room."
  },
  {
    icon: <Music className="h-8 w-8 text-synqup-accent-blue" />,
    title: "Music Sharing",
    description: "Listen to your favorite songs simultaneously and create shared playlists with friends and loved ones."
  },
  {
    icon: <Users className="h-8 w-8 text-synqup-accent-orange" />,
    title: "Group Sessions",
    description: "Create private rooms for intimate dates or larger watch parties with all your friends."
  },
  {
    icon: <MessageCircle className="h-8 w-8 text-synqup-dark-purple" />,
    title: "Real-time Chat",
    description: "Text, voice, and video chat while enjoying content together without interrupting the experience."
  }
];

export function FeatureSection() {
  return (
    <section className="py-20 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-gradient">
            Experience Media, Together
          </h2>
          <p className="max-w-[85%] md:max-w-[60%] text-muted-foreground sm:text-lg">
            SynQup brings people together through shared experiences, no matter where they are in the world.
          </p>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {features.map((feature, i) => (
            <div 
              key={i} 
              className="flex flex-col items-start gap-4 rounded-xl p-6 bg-background shadow-sm border border-border hover:shadow-md transition-shadow"
            >
              <div className="rounded-lg p-2 bg-muted">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
