
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ArrowLeft } from 'lucide-react';

const API = () => {
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

        <h1 className="text-4xl font-bold mb-8">API Documentation</h1>
        
        <div className="prose prose-lg max-w-none">
          <p>
            SynqUp provides a robust API that allows developers to integrate our synchronized 
            media experience into their own applications.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Getting Started</h2>
          <p>
            To use the SynqUp API, you'll need to sign up for an API key through your account dashboard.
            Once you have your key, you can start making requests to our endpoints.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Endpoints</h2>
          
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <h3 className="font-semibold">GET /api/rooms</h3>
            <p>Returns a list of all rooms accessible to the authenticated user.</p>
          </div>
          
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <h3 className="font-semibold">POST /api/rooms</h3>
            <p>Creates a new room.</p>
          </div>
          
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <h3 className="font-semibold">GET /api/rooms/:id</h3>
            <p>Returns details for a specific room.</p>
          </div>
          
          <Button className="bg-synqup-purple hover:bg-synqup-dark-purple mt-4">Request API Access</Button>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default API;
