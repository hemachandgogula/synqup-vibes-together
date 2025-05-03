
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowLeft } from 'lucide-react';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>

        <h1 className="text-4xl font-bold mb-8">About SynqUp</h1>
        
        <div className="prose prose-lg max-w-none">
          <p>
            SynqUp was founded with a simple mission: to bring people together through shared media experiences. 
            In today's digital world, we often consume content alone despite being more connected than ever before.
          </p>
          
          <p>
            Our platform allows friends, families, and communities to watch videos together in perfect sync,
            no matter where they are in the world. Add in real-time chat, and you've got the next best thing 
            to actually being in the same room.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Our Team</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-gray-200 mx-auto mb-4"></div>
              <h3 className="font-semibold">Jane Smith</h3>
              <p className="text-sm text-gray-500">Founder & CEO</p>
            </div>
            
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-gray-200 mx-auto mb-4"></div>
              <h3 className="font-semibold">John Doe</h3>
              <p className="text-sm text-gray-500">CTO</p>
            </div>
            
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-gray-200 mx-auto mb-4"></div>
              <h3 className="font-semibold">Alex Johnson</h3>
              <p className="text-sm text-gray-500">Head of Product</p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;
