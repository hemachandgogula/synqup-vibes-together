
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ArrowLeft, Check } from 'lucide-react';

const Pricing = () => {
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

        <h1 className="text-4xl font-bold mb-8 text-center">Pricing Plans</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Free Plan</h2>
            <div className="text-3xl font-bold mb-4">$0<span className="text-sm text-gray-500">/month</span></div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" /> Basic room creation</li>
              <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" /> Up to 3 participants</li>
              <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" /> YouTube integration</li>
            </ul>
            <Button className="w-full bg-synqup-purple hover:bg-synqup-dark-purple">Get Started</Button>
          </div>
          
          <div className="border rounded-lg p-6 shadow-sm border-synqup-purple">
            <div className="absolute -mt-10 bg-synqup-purple text-white px-3 py-1 rounded-full text-sm font-medium">Popular</div>
            <h2 className="text-xl font-semibold mb-2">Pro Plan</h2>
            <div className="text-3xl font-bold mb-4">$9.99<span className="text-sm text-gray-500">/month</span></div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" /> Unlimited room creation</li>
              <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" /> Up to 10 participants</li>
              <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" /> Premium media integrations</li>
              <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" /> HD quality</li>
            </ul>
            <Button className="w-full bg-synqup-purple hover:bg-synqup-dark-purple">Subscribe Now</Button>
          </div>
          
          <div className="border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Business Plan</h2>
            <div className="text-3xl font-bold mb-4">$29.99<span className="text-sm text-gray-500">/month</span></div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" /> Unlimited everything</li>
              <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" /> Up to 50 participants</li>
              <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" /> Analytics and insights</li>
              <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" /> Custom branding</li>
              <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" /> Priority support</li>
            </ul>
            <Button className="w-full bg-synqup-purple hover:bg-synqup-dark-purple">Contact Sales</Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Pricing;
