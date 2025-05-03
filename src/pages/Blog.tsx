
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowLeft } from 'lucide-react';

const Blog = () => {
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

        <h1 className="text-4xl font-bold mb-8">Blog</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border rounded-lg overflow-hidden">
            <div className="h-48 bg-gray-200"></div>
            <div className="p-6">
              <span className="text-sm text-gray-500">May 1, 2025</span>
              <h2 className="text-xl font-semibold my-2">Introducing SynqUp 2.0</h2>
              <p className="text-gray-600 mb-4">
                We're excited to announce the launch of SynqUp 2.0, featuring enhanced media synchronization 
                and support for more platforms.
              </p>
              <Button variant="outline">Read More</Button>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <div className="h-48 bg-gray-200"></div>
            <div className="p-6">
              <span className="text-sm text-gray-500">April 15, 2025</span>
              <h2 className="text-xl font-semibold my-2">The Future of Social Watching</h2>
              <p className="text-gray-600 mb-4">
                How synchronized media consumption is changing the way we experience entertainment together.
              </p>
              <Button variant="outline">Read More</Button>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <div className="h-48 bg-gray-200"></div>
            <div className="p-6">
              <span className="text-sm text-gray-500">April 1, 2025</span>
              <h2 className="text-xl font-semibold my-2">5 Tips for Hosting a Virtual Watch Party</h2>
              <p className="text-gray-600 mb-4">
                Make your next virtual watch party a success with these helpful tips and tricks.
              </p>
              <Button variant="outline">Read More</Button>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <div className="h-48 bg-gray-200"></div>
            <div className="p-6">
              <span className="text-sm text-gray-500">March 20, 2025</span>
              <h2 className="text-xl font-semibold my-2">Customer Story: How SynqUp Brought Friends Together</h2>
              <p className="text-gray-600 mb-4">
                Read about how a group of friends spread across the globe uses SynqUp to stay connected.
              </p>
              <Button variant="outline">Read More</Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Blog;
