
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ArrowLeft } from 'lucide-react';

const HelpCenter = () => {
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

        <h1 className="text-4xl font-bold mb-8">Help Center</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
            <ul className="space-y-4">
              <li>
                <h3 className="font-medium">How do I create a room?</h3>
                <p className="text-gray-600">Navigate to your dashboard and click on "Create Team" to set up a new room.</p>
              </li>
              <li>
                <h3 className="font-medium">How do I invite others?</h3>
                <p className="text-gray-600">Share your room code with others so they can join using the "Join Team" option.</p>
              </li>
              <li>
                <h3 className="font-medium">What media can we watch?</h3>
                <p className="text-gray-600">Currently, SynqUp supports YouTube videos. More integrations are coming soon!</p>
              </li>
            </ul>
          </div>
          
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Contact Support</h2>
            <p className="mb-4">Need additional help? Our support team is ready to assist you.</p>
            <Button>Contact Us</Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default HelpCenter;
