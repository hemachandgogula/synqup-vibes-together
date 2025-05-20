
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const RoomMembers = ({ roomId, currentUserId, isOwner }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
    
    // Set up real-time subscription for members
    const channel = supabase
      .channel(`room-members-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_members',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('Room members change:', payload);
          fetchMembers();
        }
      )
      .subscribe((status) => {
        console.log('Room members channel status:', status);
      });
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      console.log('Fetching room members for room:', roomId);
      const { data, error } = await supabase
        .from('room_members')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          profiles:user_id (username, avatar_url)
        `)
        .eq('room_id', roomId)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error fetching room members:', error);
        toast.error('Could not load room members');
        return;
      }

      console.log('Room members:', data);
      setMembers(data);
    } catch (error) {
      console.error('Error in fetchMembers:', error);
      toast.error('An error occurred loading members');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId, userId) => {
    if (!isOwner || userId === currentUserId) return;
    
    try {
      console.log('Removing member with ID:', memberId);
      const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('id', memberId);
        
      if (error) {
        console.error('Error removing member:', error);
        toast.error('Could not remove member');
        return;
      }
      
      toast.success('Member removed from room');
      setMembers(members.filter(m => m.id !== memberId));
    } catch (error) {
      console.error('Error in handleRemoveMember:', error);
      toast.error('An error occurred');
    }
  };

  return (
    <Card className="p-4 mb-4">
      <h2 className="text-xl font-semibold mb-4">Room Members</h2>
      
      {loading ? (
        <p>Loading members...</p>
      ) : (
        <div className="space-y-2">
          {members.length === 0 ? (
            <p className="text-muted-foreground">No members have joined yet.</p>
          ) : (
            members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
                    {(member.profiles?.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{member.profiles?.username || 'Unknown user'}</p>
                    <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                  </div>
                </div>
                {isOwner && member.user_id !== currentUserId && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRemoveMember(member.id, member.user_id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <UserX className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  );
};

export default RoomMembers;
