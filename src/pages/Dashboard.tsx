
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, Plus, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client'; // Must import from TS client!
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [userRooms, setUserRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchUserRooms();
  }, [user, navigate]);
  
  const fetchUserRooms = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // Get rooms where user is a member, and "rooms(*)" gets the related room
      const { data: memberRooms, error: memberError } = await supabase
        .from('room_members')
        .select('room_id, role, rooms(*)') // rooms(*) for all columns
        .eq('user_id', user.id);
        
      if (memberError) throw memberError;
      
      if (memberRooms) {
        // Avoid undefined: fallback for missing room relation
        const formattedRooms = memberRooms.map((item: any) => ({
          ...(item.rooms || {}), // all room columns
          role: item.role
        }));
        setUserRooms(formattedRooms);
      }
    } catch (error) {
      toast.error('Failed to load your rooms');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const joinRoom = (roomId: string) => {
    navigate(`/room?id=${roomId}`);
  };
  
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Welcome to synQUp</h1>
          <Button 
            variant="destructive" 
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
        
        {/* Your Rooms Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Rooms</h2>
          
          {loading ? (
            <div className="text-center p-12">Loading your rooms...</div>
          ) : userRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userRooms.map((room) => (
                <Card key={room.id} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between mb-2">
                      <h3 className="text-lg font-medium">{room.name}</h3>
                      <span className="text-xs px-2 py-1 bg-synqup-soft-purple text-synqup-dark-purple rounded-full">
                        {room.role || 'Member'}
                      </span>
                    </div>
                    <p className="text-muted-foreground mb-4 text-sm">
                      {room.description || 'No description'}
                    </p>
                    {room.room_code && (
                      <div className="bg-muted p-2 rounded text-xs mb-4">
                        Invite Code: {room.room_code}
                      </div>
                    )}
                    <div className="mt-auto pt-2">
                      <Button 
                        className="w-full bg-synqup-purple hover:bg-synqup-dark-purple"
                        onClick={() => joinRoom(room.id)}
                      >
                        Enter Room
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 bg-muted rounded-lg">
              <p className="text-muted-foreground mb-4">You haven't joined any rooms yet.</p>
            </div>
          )}
        </div>
        
        {/* Create or Join Section */}
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
