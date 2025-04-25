
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Welcome to synQUp</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center text-center space-y-4">
              <Users className="h-12 w-12 text-synqup-purple" />
              <h2 className="text-2xl font-semibold">Join a Team</h2>
              <p className="text-muted-foreground">
                Join an existing team using an invitation code
              </p>
              <Button 
                className="bg-synqup-purple hover:bg-synqup-dark-purple w-full"
                onClick={() => navigate('/join-team')}
              >
                <Users className="mr-2 h-4 w-4" />
                Join Team
              </Button>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center text-center space-y-4">
              <Plus className="h-12 w-12 text-synqup-purple" />
              <h2 className="text-2xl font-semibold">Create a Team</h2>
              <p className="text-muted-foreground">
                Create a new team and invite others to join
              </p>
              <Button 
                className="bg-synqup-purple hover:bg-synqup-dark-purple w-full"
                onClick={() => navigate('/create-team')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
