
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Share2, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_email?: string;
}

interface RoomDetails {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  room_code: string | null;
}

interface MediaSession {
  id: string;
  media_url: string;
  is_playing: boolean;
  current_position: number;
}

const Room = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('id');
  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [currentMediaSession, setCurrentMediaSession] = useState<MediaSession | null>(null);
  const [roomCodeCopied, setRoomCodeCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch room details
  useEffect(() => {
    if (!user || !roomId) {
      if (!user) navigate('/login');
      else navigate('/dashboard');
      return;
    }

    const fetchRoomDetails = async () => {
      try {
        setLoading(true);
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', roomId)
          .single();

        if (roomError) {
          console.error('Error fetching room:', roomError);
          toast.error('Could not find room');
          navigate('/dashboard');
          return;
        }

        setRoom(roomData);

        // Check if the user is a member of this room
        const { data: memberData, error: memberError } = await supabase
          .from('room_members')
          .select('*')
          .eq('room_id', roomId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (memberError) {
          console.error('Error checking membership:', memberError);
          toast.error('Error checking room membership');
          navigate('/dashboard');
          return;
        }

        if (!memberData) {
          // If not a member, try to add them
          const { error: joinError } = await supabase
            .from('room_members')
            .insert([{ 
              room_id: roomId, 
              user_id: user.id,
              role: 'member'
            }]);
            
          if (joinError) {
            console.error('Error joining room:', joinError);
            toast.error('You are not a member of this room and could not join');
            navigate('/dashboard');
            return;
          } else {
            toast.success('You have joined the room');
          }
        } else {
          // Check if user is owner
          if (memberData.role === 'owner' || roomData.created_by === user.id) {
            setIsOwner(true);
          }
        }

        // Fetch current media session
        await fetchCurrentMediaSession();

        // Fetch messages
        await fetchMessages();
      } catch (error) {
        console.error('Error:', error);
        toast.error('An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRoomDetails();
  }, [user, roomId, navigate]);

  // Set up real-time subscription for messages and media
  useEffect(() => {
    if (!roomId || !user) return;

    // Clear existing channel if any
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          console.log('New message received:', payload);
          const newMessage = payload.new as Message;
          
          // Get user email
          const { data } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', newMessage.user_id)
            .single();
            
          setMessages((prev) => [
            ...prev,
            { ...newMessage, user_email: data?.username || newMessage.user_id },
          ]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'media_sessions',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('Media session update:', payload);
          if (payload.new && typeof payload.new === 'object' && 'media_url' in payload.new) {
            setCurrentMediaSession(payload.new as MediaSession);
            setYoutubeUrl(payload.new.media_url as string);
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to room channel');
        }
      });

    // Store channel reference for cleanup
    channelRef.current = channel;

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [roomId, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchCurrentMediaSession = async () => {
    if (!roomId) return;
    
    try {
      const { data, error } = await supabase
        .from('media_sessions')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      console.log('Current media session:', data);
      if (data) {
        setCurrentMediaSession(data);
        setYoutubeUrl(data.media_url);
      }
    } catch (error) {
      console.error('Error fetching media session:', error);
    }
  };

  const fetchMessages = async () => {
    if (!roomId) return;

    try {
      console.log('Fetching messages for room:', roomId);
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles:user_id (username)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
        return;
      }

      console.log('Messages fetched:', data);

      // Transform data to include user_email
      const formattedMessages = data.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        created_at: msg.created_at,
        user_id: msg.user_id,
        user_email: msg.profiles?.username || msg.user_id,
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !roomId) return;

    setSendingMessage(true);
    try {
      console.log('Sending message:', {
        room_id: roomId,
        user_id: user.id,
        content: newMessage.trim()
      });
      
      const { error } = await supabase.from('messages').insert([
        {
          room_id: roomId,
          user_id: user.id,
          content: newMessage.trim(),
        },
      ]);

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
        return;
      }

      console.log('Message sent successfully');
      setNewMessage('');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleYoutubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim() || !isOwner || !roomId) return;
    
    const embedUrl = getYoutubeEmbedUrl(youtubeUrl);
    if (!embedUrl) {
      toast.error('Invalid YouTube URL');
      return;
    }
    
    try {
      // Create or update media session
      const { error } = await supabase
        .from('media_sessions')
        .upsert({
          room_id: roomId,
          media_url: embedUrl,
          media_type: 'youtube',
          is_playing: true,
          current_position: 0,
          media_title: youtubeUrl.split('v=')[1] || 'YouTube Video'
        });
        
      if (error) {
        console.error('Error updating media session:', error);
        toast.error('Failed to update media');
      } else {
        toast.success('Media updated for all viewers');
        console.log('Media session updated successfully with URL:', embedUrl);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Function to get YouTube embed URL
  const getYoutubeEmbedUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com')) {
        const videoId = urlObj.searchParams.get('v');
        if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      } else if (urlObj.hostname.includes('youtu.be')) {
        const videoId = urlObj.pathname.substring(1);
        if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      }
    } catch (e) {
      return '';
    }
    return '';
  };

  const handleShare = () => {
    if (room?.room_code) {
      navigator.clipboard.writeText(room.room_code)
        .then(() => {
          setRoomCodeCopied(true);
          toast.success('Room code copied to clipboard!');
          setTimeout(() => setRoomCodeCopied(false), 2000);
        })
        .catch(() => toast.error('Failed to copy room code'));
    } else {
      toast.error('No room code available');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">Loading room...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
          
          {room?.room_code && (
            <Button 
              variant="outline"
              onClick={handleShare}
              className="gap-2"
            >
              {roomCodeCopied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {roomCodeCopied ? 'Copied!' : 'Share Room'}
              </span>
            </Button>
          )}
        </div>

        <h1 className="text-3xl font-bold mb-8">{room?.name}</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Media Player Section */}
          <div className="lg:col-span-2">
            <Card className="p-4 mb-4">
              <h2 className="text-xl font-semibold mb-4">Media Player</h2>
              
              {isOwner ? (
                <form onSubmit={handleYoutubeSubmit} className="flex gap-2 mb-4">
                  <Input
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="Enter YouTube URL"
                    className="flex-1"
                  />
                  <Button type="submit">
                    Play
                  </Button>
                </form>
              ) : (
                <div className="mb-4 text-sm text-muted-foreground">
                  Video playback is controlled by the room owner
                </div>
              )}
              
              <div className="aspect-video bg-black relative rounded-md overflow-hidden">
                {currentMediaSession?.media_url ? (
                  <iframe
                    src={currentMediaSession.media_url}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full"
                    title="YouTube Video"
                  ></iframe>
                ) : (
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-gray-400">
                    {isOwner 
                      ? 'Enter a YouTube URL to watch together' 
                      : 'Waiting for room owner to play a video'}
                  </div>
                )}
              </div>
            </Card>
          </div>
          
          {/* Chat Section */}
          <div className="lg:col-span-1">
            <Card className="p-4 h-[600px] flex flex-col">
              <h2 className="text-xl font-semibold mb-4">Chat</h2>
              
              <div className="flex-1 overflow-auto mb-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-400 py-4">
                      No messages yet
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-3 rounded-lg max-w-[80%] ${
                          message.user_id === user?.id
                            ? 'ml-auto bg-synqup-purple text-white'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                      >
                        <div className="text-xs opacity-70 mb-1">
                          {message.user_id === user?.id
                            ? 'You'
                            : message.user_email || 'User'}
                          {' · '}
                          {formatTime(message.created_at)}
                        </div>
                        <div>{message.content}</div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  disabled={sendingMessage}
                  className="flex-1"
                />
                <Button type="submit" disabled={sendingMessage} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
