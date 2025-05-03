
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ArrowLeft } from 'lucide-react';

const Guides = () => {
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

        <h1 className="text-4xl font-bold mb-8">Guides</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="border rounded-lg overflow-hidden">
            <div className="h-40 bg-gray-200"></div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">Getting Started</h3>
              <p className="text-gray-600 mb-4">Learn the basics of using SynqUp for synchronized media watching.</p>
              <Button variant="outline" className="w-full">Read Guide</Button>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <div className="h-40 bg-gray-200"></div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">Advanced Features</h3>
              <p className="text-gray-600 mb-4">Discover all the powerful features available in SynqUp.</p>
              <Button variant="outline" className="w-full">Read Guide</Button>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <div className="h-40 bg-gray-200"></div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">Troubleshooting</h3>
              <p className="text-gray-600 mb-4">Common issues and how to resolve them.</p>
              <Button variant="outline" className="w-full">Read Guide</Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Guides;
