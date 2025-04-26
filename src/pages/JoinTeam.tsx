
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const JoinTeam = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Please enter a team code');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to join a team');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      console.log('Joining team with code:', code.trim());
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_code', code.trim())
        .single();

      if (roomError) {
        console.error('Room error:', roomError);
        throw new Error('Invalid team code');
      }

      console.log('Found room:', room);

      // Check if user is already a member
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('room_members')
        .select('id')
        .eq('room_id', room.id)
        .eq('user_id', user.id)
        .single();
        
      if (existingMember) {
        toast.info("You're already a member of this team");
        navigate(`/room?id=${room.id}`);
        return;
      }

      // Add user as a member
      const { error: memberError } = await supabase
        .from('room_members')
        .insert([
          {
            room_id: room.id,
            user_id: user.id,
            role: 'member',
          },
        ]);

      if (memberError) {
        console.error('Member error:', memberError);
        throw memberError;
      }

      toast.success('Successfully joined the team!');
      navigate(`/room?id=${room.id}`);
    } catch (error: any) {
      console.error('Error joining team:', error);
      toast.error(error.message || 'Invalid team code or error joining team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
        </div>
        
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-6">Join a Team</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="code">Team Code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter team code"
                required
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-synqup-purple hover:bg-synqup-dark-purple"
                disabled={loading}
              >
                {loading ? 'Joining...' : 'Join Team'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default JoinTeam;
