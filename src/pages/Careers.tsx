
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowLeft } from 'lucide-react';

const Careers = () => {
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

        <h1 className="text-4xl font-bold mb-8">Careers</h1>
        
        <div className="prose prose-lg max-w-none mb-12">
          <p>
            Join our growing team and help shape the future of social media watching. At SynqUp, 
            we're building the next generation of synchronized entertainment experiences.
          </p>
          
          <p>
            We offer competitive salaries, comprehensive benefits, flexible remote work options, 
            and a collaborative, innovative culture.
          </p>
        </div>
        
        <h2 className="text-2xl font-bold mb-6">Open Positions</h2>
        
        <div className="space-y-6">
          <div className="border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-2">Senior Frontend Developer</h3>
            <div className="flex gap-4 mb-4">
              <span className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">Full-time</span>
              <span className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">Remote</span>
            </div>
            <p className="text-gray-600 mb-4">
              We're looking for an experienced frontend developer with strong React skills to join our team.
              Help us build intuitive, responsive user interfaces that delight our customers.
            </p>
            <Button>Apply Now</Button>
          </div>
          
          <div className="border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-2">Backend Engineer</h3>
            <div className="flex gap-4 mb-4">
              <span className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">Full-time</span>
              <span className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">Remote</span>
            </div>
            <p className="text-gray-600 mb-4">
              Join our backend team to design and implement robust, scalable APIs and services 
              that power our synchronized media platform.
            </p>
            <Button>Apply Now</Button>
          </div>
          
          <div className="border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-2">Product Manager</h3>
            <div className="flex gap-4 mb-4">
              <span className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">Full-time</span>
              <span className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">Remote</span>
            </div>
            <p className="text-gray-600 mb-4">
              Drive the product roadmap and strategy for SynqUp's synchronized media platform. 
              Work closely with engineering, design, and marketing teams to deliver exceptional user experiences.
            </p>
            <Button>Apply Now</Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Careers;
