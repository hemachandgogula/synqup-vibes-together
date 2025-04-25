
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const JoinTeam = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Please enter a team code');
      return;
    }

    setLoading(true);
    try {
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_code', code.trim())
        .single();

      if (roomError) throw roomError;

      const { error: memberError } = await supabase
        .from('room_members')
        .insert([
          {
            room_id: room.id,
            user_id: user.id,
          },
        ]);

      if (memberError) throw memberError;

      toast.success('Successfully joined the team!');
      navigate(`/room?id=${room.id}`);
    } catch (error) {
      console.error('Error joining team:', error);
      toast.error('Invalid team code or you\'re already a member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-md mx-auto">
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
