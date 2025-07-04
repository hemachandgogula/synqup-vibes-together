
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client'; // Use the TS file for correct types!
import { toast } from 'sonner';

interface RoomMember {
  id: string;
  user_id: string;
  joined_at: string;
  role: string;
  profiles?: {
    username: string | null;
  } | null;
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

    const channel = supabase
      .channel(`members_${roomId}`, {
        config: { broadcast: { self: false }, presence: { key: currentUserId } }
      })
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
  }, [roomId, currentUserId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      // Nested select for user profile
      const { data: membersData, error: membersError } = await supabase
        .from('room_members')
        .select(`
          id,
          user_id,
          joined_at,
          role,
          profiles:user_id (username)
        `)
        .eq('room_id', roomId)
        .order('joined_at', { ascending: false });

      if (membersError) {
        toast.error('Failed to load room members');
        setMembers([]);
        return;
      }
      if (!membersData || membersData.length === 0) {
        setMembers([]);
        return;
      }
      // membersData is now strongly typed and contains profiles
      setMembers(
        membersData.map((m: any) => ({
          id: m.id,
          user_id: m.user_id,
          joined_at: m.joined_at,
          role: m.role,
          profiles: m.profiles ? { username: m.profiles.username } : null
        }))
      );
    } catch (error) {
      toast.error('An unexpected error occurred');
      setMembers([]);
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
        toast.error('Failed to remove member');
        return;
      }
      toast.success('Member removed successfully');
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="text-center text-muted-foreground">Loading members...</div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Room Members ({members.length})</h3>
      <div className="space-y-2">
        {members.length === 0 ? (
          <div className="text-center text-muted-foreground">No members</div>
        ) : (
          members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-2 rounded border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  {(member.profiles?.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-sm font-medium">
                    {member.profiles?.username || 'Unknown user'}
                  </span>
                  {member.role === 'owner' && 
                    <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      Owner
                    </span>
                  }
                  {member.user_id === currentUserId && 
                    <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                  }
                </div>
              </div>
              {isOwner && member.user_id !== currentUserId && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive hover:text-destructive" 
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
