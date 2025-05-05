
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RoomMember {
  id: string;
  user_id: string;
  joined_at: string;
  role: string;
  username?: string;
}

interface RoomMembersProps {
  roomId: string;
  currentUserId: string;
  isOwner: boolean;
}

const RoomMembers = ({ roomId, currentUserId, isOwner }: RoomMembersProps) => {
  const [members, setMembers] = useState<RoomMember[]>([]);
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
        () => {
          fetchMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('room_members')
        .select(`
          *,
          profiles:user_id (username)
        `)
        .eq('room_id', roomId);

      if (error) {
        console.error('Error fetching members:', error);
        return;
      }

      // Format the members with username
      const formattedMembers = data.map((member: any) => ({
        ...member,
        username: member.profiles?.username || 'Unknown user'
      }));

      setMembers(formattedMembers);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (memberId: string, userId: string) => {
    if (!isOwner || userId === currentUserId) return;
    
    try {
      const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('id', memberId);

      if (error) {
        console.error('Error removing member:', error);
        toast.error('Failed to remove member');
        return;
      }

      toast.success('Member removed successfully');
      fetchMembers();
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading members...</div>;
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Room Members ({members.length})</h3>
      <div className="space-y-2">
        {members.length === 0 ? (
          <div className="text-center text-muted-foreground">No members</div>
        ) : (
          members.map((member) => (
            <div key={member.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm">
                  {member.username}
                  {member.role === 'owner' && 
                    <span className="ml-2 text-xs bg-synqup-purple text-white px-2 py-0.5 rounded-full">
                      Owner
                    </span>
                  }
                  {member.user_id === currentUserId && 
                    <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                  }
                </span>
              </div>
              {isOwner && member.user_id !== currentUserId && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => removeMember(member.id, member.user_id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default RoomMembers;
