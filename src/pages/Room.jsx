
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Share2, Check, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import RoomMembers from '@/components/RoomMembers';

const Room = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('id');
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [currentMediaSession, setCurrentMediaSession] = useState(null);
  const [roomCodeCopied, setRoomCodeCopied] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const messagesEndRef = useRef(null);
  const channelsRef = useRef({});
  const playerRef = useRef(null);
  const lastMediaUpdateRef = useRef(null);

  // Initialize room
  useEffect(() => {
    if (!user || !roomId) {
      navigate('/dashboard');
      return;
    }

    initializeRoom();
    
    return () => {
      cleanup();
    };
  }, [user, roomId, navigate]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeRoom = async () => {
    try {
      setLoading(true);
      console.log("Initializing room:", roomId);
      
      // Fetch room details
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

      // Check/ensure membership
      await ensureMembership();

      // Load initial data
      await Promise.all([
        fetchCurrentMediaSession(),
        fetchMessages()
      ]);

      // Setup real-time connections
      setupRealtimeConnections();

    } catch (error) {
      console.error('Error initializing room:', error);
      toast.error('Failed to load room');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const ensureMembership = async () => {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (memberError) {
        console.error('Error checking membership:', memberError);
        throw memberError;
      }

      if (!memberData) {
        // Join the room
        const { error: joinError } = await supabase
          .from('room_members')
          .insert([{ 
            room_id: roomId, 
            user_id: user.id,
            role: 'member'
          }]);
          
        if (joinError) {
          console.error('Error joining room:', joinError);
          throw new Error('Could not join room');
        }
        
        toast.success('Joined the room');
      } else {
        // Check if user is owner
        if (memberData.role === 'owner') {
          setIsOwner(true);
        }
      }
    } catch (error) {
      console.error('Error ensuring membership:', error);
      throw error;
    }
  };

  const setupRealtimeConnections = () => {
    console.log("Setting up real-time connections for room:", roomId);
    
    // Clean up existing connections
    cleanup();

    // Messages channel with proper filter
    const messagesChannel = supabase
      .channel(`messages_${roomId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: user.id }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          console.log('New message received via realtime:', payload);
          if (payload.new && payload.new.user_id !== user.id) {
            // Get user info for the message
            const { data: profileData } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', payload.new.user_id)
              .single();
              
            const messageWithUser = {
              ...payload.new,
              profiles: { username: profileData?.username || 'Unknown user' }
            };
            
            setMessages(prev => {
              // Prevent duplicates
              const exists = prev.some(msg => msg.id === messageWithUser.id);
              if (exists) return prev;
              return [...prev, messageWithUser];
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Messages channel status:', status);
      });

    // Media synchronization channel with conflict resolution
    const mediaChannel = supabase
      .channel(`media_${roomId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: user.id }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'media_sessions',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('Media session update via realtime:', payload);
          if (payload.new) {
            const newSession = payload.new;
            
            // Prevent infinite loops and conflicts
            if (lastMediaUpdateRef.current === newSession.updated_at) {
              console.log('Ignoring duplicate media update');
              return;
            }
            
            lastMediaUpdateRef.current = newSession.updated_at;
            setCurrentMediaSession(newSession);
            
            // Sync video for non-owners only if URL changed
            if (!isOwner && newSession.media_url !== youtubeUrl) {
              console.log('Syncing video to:', newSession.media_url);
              setYoutubeUrl(newSession.media_url);
              
              // Force iframe reload for sync
              setTimeout(() => {
                const iframe = playerRef.current;
                if (iframe && newSession.media_url) {
                  iframe.src = newSession.media_url;
                }
              }, 100);
              
              toast.success('Video synced by room owner');
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Media channel status:', status);
      });

    // Store channel references for cleanup
    channelsRef.current = {
      messages: messagesChannel,
      media: mediaChannel
    };
  };

  const cleanup = () => {
    console.log('Cleaning up real-time connections');
    
    Object.values(channelsRef.current).forEach(channel => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    });
    
    channelsRef.current = {};
  };

  const fetchCurrentMediaSession = async () => {
    try {
      const { data, error } = await supabase
        .from('media_sessions')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (data) {
        setCurrentMediaSession(data);
        setYoutubeUrl(data.media_url);
        lastMediaUpdateRef.current = data.updated_at;
      }
    } catch (error) {
      console.error('Error fetching media session:', error);
    }
  };

  const fetchMessages = async () => {
    try {
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
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error in fetchMessages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !roomId || sendingMessage) return;

    const messageContent = newMessage.trim();
    setSendingMessage(true);
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          room_id: roomId,
          user_id: user.id,
          content: messageContent,
        }])
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles:user_id (username)
        `)
        .single();

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
        return;
      }

      // Add message immediately to local state
      setMessages(prev => {
        const exists = prev.some(msg => msg.id === data.id);
        if (exists) return prev;
        return [...prev, data];
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleYoutubeSubmit = async (e) => {
    e.preventDefault();
    if (!youtubeUrl.trim() || !isOwner || !roomId) return;
    
    const embedUrl = getYoutubeEmbedUrl(youtubeUrl);
    if (!embedUrl) {
      toast.error('Invalid YouTube URL');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('media_sessions')
        .upsert({
          room_id: roomId,
          media_url: embedUrl,
          media_type: 'youtube',
          is_playing: true,
          current_position: 0,
          media_title: 'YouTube Video'
        });
        
      if (error) {
        console.error('Error updating media session:', error);
        toast.error('Failed to update media');
      } else {
        toast.success('Video updated for all viewers');
      }
    } catch (error) {
      console.error('Error in handleYoutubeSubmit:', error);
      toast.error('Failed to update video');
    }
  };

  const getYoutubeEmbedUrl = (url) => {
    try {
      if (url.includes('youtube.com/watch')) {
        const videoId = url.split('v=')[1]?.split('&')[0];
        if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
      } else if (url.includes('youtu.be')) {
        const videoId = url.split('youtu.be/')[1]?.split('?')[0];
        if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
      } else if (url.includes('youtube.com/embed')) {
        return url.includes('autoplay=1') ? url : url + (url.includes('?') ? '&' : '?') + 'autoplay=1&enablejsapi=1';
      }
      return url;
    } catch (e) {
      console.error('Error parsing YouTube URL:', e);
      return '';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center text-foreground">Loading room...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="gap-2 text-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
          
          <div className="flex items-center gap-2">
            {isOwner && (
              <Button 
                variant="outline"
                onClick={() => setShowMembers(!showMembers)}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Members</span>
              </Button>
            )}
            
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
        </div>

        <h1 className="text-3xl font-bold mb-8 text-foreground">{room?.name}</h1>
        
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Media Player Section */}
          <div className="xl:col-span-3">
            <Card className="p-6 mb-4 bg-card border-border">
              <h2 className="text-xl font-semibold mb-4 text-card-foreground">Media Player</h2>
              
              {isOwner ? (
                <form onSubmit={handleYoutubeSubmit} className="flex gap-2 mb-4">
                  <Input
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="Enter YouTube URL"
                    className="flex-1 bg-background text-foreground border-input"
                  />
                  <Button 
                    type="submit" 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Play for Everyone
                  </Button>
                </form>
              ) : (
                <div className="mb-4 text-sm text-muted-foreground">
                  Video playback is controlled by the room owner
                </div>
              )}
              
              <div className="aspect-video bg-black relative rounded-lg overflow-hidden border border-border">
                {currentMediaSession?.media_url ? (
                  <iframe
                    ref={playerRef}
                    src={currentMediaSession.media_url}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full"
                    title="YouTube Video"
                  />
                ) : (
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-muted-foreground">
                    {isOwner 
                      ? 'Enter a YouTube URL to watch together' 
                      : 'Waiting for room owner to play a video'}
                  </div>
                )}
              </div>
            </Card>
            
            {showMembers && isOwner && (
              <RoomMembers 
                roomId={roomId || ''} 
                currentUserId={user?.id || ''} 
                isOwner={isOwner} 
              />
            )}
          </div>
          
          {/* Chat Section */}
          <div className="xl:col-span-1">
            <Card className="p-4 h-[600px] flex flex-col bg-card border-border">
              <h2 className="text-xl font-semibold mb-4 text-card-foreground">Chat</h2>
              
              <div className="flex-1 overflow-auto mb-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    No messages yet
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg max-w-[85%] break-words ${
                        message.user_id === user?.id
                          ? 'ml-auto bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <div className={`text-xs mb-1 ${
                        message.user_id === user?.id
                          ? 'text-primary-foreground/80'
                          : 'text-muted-foreground'
                      }`}>
                        {message.user_id === user?.id
                          ? 'You'
                          : message.profiles?.username || 'Unknown user'}
                        {' · '}
                        {formatTime(message.created_at)}
                      </div>
                      <div className={message.user_id === user?.id 
                        ? 'text-primary-foreground' 
                        : 'text-foreground'
                      }>
                        {message.content}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  disabled={sendingMessage}
                  className="flex-1 min-h-[60px] max-h-[120px] resize-none bg-background text-foreground border-input placeholder:text-muted-foreground"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <Button 
                  type="submit" 
                  disabled={sendingMessage || !newMessage.trim()} 
                  size="icon" 
                  className="h-[60px] bg-primary hover:bg-primary/90 text-primary-foreground"
                >
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
