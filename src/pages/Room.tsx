
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Play, Pause, SkipBack, SkipForward, Send, User, Users, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Room = () => {
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Subscribe to new messages
    const channel = supabase
      .channel('room-messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' }, 
        (payload) => {
          console.log('New message received:', payload);
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();
      
    // Fetch existing messages
    fetchMessages();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate, user]);
  
  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles(username, avatar_url)')
        .order('created_at', { ascending: true })
        .limit(50);
        
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };
  
  const togglePlayPause = () => {
    setPlaying(!playing);
  };

  const sendMessage = async () => {
    if (!message.trim() || !user) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            content: message.trim(),
            user_id: user.id,
            room_id: '00000000-0000-0000-0000-000000000000' // Default room ID for now
          }
        ]);
      
      if (error) throw error;
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Room header */}
      <div className="border-b px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-synqup-purple to-synqup-dark-purple" />
          <h1 className="text-xl font-bold">Movie Night Room</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="gap-2">
            <Users className="h-4 w-4" />
            <span>3 People</span>
          </Button>
          <Button size="sm" className="bg-synqup-purple hover:bg-synqup-dark-purple text-white gap-2">
            <User className="h-4 w-4" />
            <span>Invite</span>
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Media player */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-gray-900 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="text-4xl font-bold mb-4">Media Player</div>
              <p className="text-gray-400">Currently showing a placeholder for the actual media player</p>
            </div>
          </div>
          
          {/* Media controls */}
          <div className="p-4 border-t flex items-center justify-between bg-card">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost">
                <SkipBack className="h-5 w-5" />
              </Button>
              <Button size="lg" className="bg-synqup-purple hover:bg-synqup-dark-purple text-white h-12 w-12 rounded-full p-0" onClick={togglePlayPause}>
                {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>
              <Button size="sm" variant="ghost">
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>
            <div className="text-sm font-medium">
              00:14:35 / 02:23:15
            </div>
          </div>
        </div>
        
        {/* Chat sidebar */}
        <div className="w-80 border-l flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Live Chat</h2>
          </div>
          
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length > 0 ? (
              messages.map((msg, index) => (
                <div key={msg.id || index} className="flex gap-2">
                  <div className="h-8 w-8 rounded-full bg-synqup-soft-purple flex items-center justify-center font-semibold text-synqup-dark-purple">
                    {msg.profiles?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{msg.profiles?.username || 'User'}</div>
                    <div className="bg-muted p-2 rounded-lg text-sm">{msg.content}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation!
              </div>
            )}
          </div>
          
          {/* Chat input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input 
                placeholder="Type a message..." 
                value={message} 
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button size="icon" className="bg-synqup-purple hover:bg-synqup-dark-purple text-white" onClick={sendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
