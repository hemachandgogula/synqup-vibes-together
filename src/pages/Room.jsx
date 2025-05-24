
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
  const channelRef = useRef(null);
  const lastMessageSentRef = useRef(null);
  const playerRef = useRef(null);
  const mediaChannelRef = useRef(null);

  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      console.log("User authenticated:", user.id);
    }
  }, [user, navigate]);

  // Fetch room details
  useEffect(() => {
    if (!user || !roomId) {
      if (!user) navigate('/login');
      else navigate('/dashboard');
      return;
    }

    console.log("Fetching room details for roomId:", roomId);
    
    const fetchRoomDetails = async () => {
      try {
        setLoading(true);
        console.log("Fetching room data...");
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

        console.log("Room data fetched:", roomData);
        setRoom(roomData);

        // Check if the user is a member of this room
        console.log("Checking membership...");
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
          console.log("Not a member, joining room...");
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
          console.log("User is already a member:", memberData);
          // Check if user is owner
          if (memberData.role === 'owner' || roomData.created_by === user.id) {
            console.log("User is the owner of this room");
            setIsOwner(true);
          }
        }

        // Fetch current media session
        await fetchCurrentMediaSession();

        // Fetch messages
        await fetchMessages();
      } catch (error) {
        console.error('Error in fetchRoomDetails:', error);
        toast.error('An error occurred loading the room');
      } finally {
        setLoading(false);
      }
    };

    fetchRoomDetails();
  }, [user, roomId, navigate]);

  // Set up real-time subscription for messages and media
  useEffect(() => {
    if (!roomId || !user) return;

    console.log("Setting up real-time channels for room:", roomId);

    // Clear existing channels if any
    if (channelRef.current) {
      console.log("Removing existing channel");
      supabase.removeChannel(channelRef.current);
    }

    if (mediaChannelRef.current) {
      console.log("Removing existing media channel");
      supabase.removeChannel(mediaChannelRef.current);
    }

    // Create and subscribe to the messages channel
    console.log("Creating messages channel");
    const messagesChannel = supabase
      .channel(`room-messages-${roomId}`)
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
          if (payload.new && typeof payload.new === 'object') {
            const newMessage = payload.new;
            
            // Only process messages that aren't from the current user or weren't just sent by us
            if (newMessage.user_id !== user.id || lastMessageSentRef.current !== newMessage.id) {
              // Get user username
              const { data } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', newMessage.user_id)
                .single();
                
              console.log("Adding message to state with username:", data?.username);
              setMessages((prev) => [
                ...prev,
                { ...newMessage, user_email: data?.username || newMessage.user_id },
              ]);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Messages channel status:', status);
      });

    // Create and subscribe to the media channel
    console.log("Creating media channel");
    const mediaChannel = supabase
      .channel(`room-media-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'media_sessions',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('Media session update received:', payload);
          if (payload.new && typeof payload.new === 'object') {
            // Ensure payload has the expected properties
            if ('media_url' in payload.new) {
              console.log("Updating media session state:", payload.new);
              setCurrentMediaSession(payload.new);
              
              // Only update the URL field if not the owner (owner controls it)
              if (!isOwner) {
                setYoutubeUrl(payload.new.media_url);
                
                // Force iframe refresh by updating its src
                const iframe = document.querySelector('iframe');
                if (iframe) {
                  console.log("Updating iframe src to:", payload.new.media_url);
                  iframe.src = payload.new.media_url;
                }
                
                toast.success("Media updated by room owner");
              }
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Media channel status:', status);
      });

    // Store channel references for cleanup
    channelRef.current = messagesChannel;
    mediaChannelRef.current = mediaChannel;

    return () => {
      console.log('Cleaning up real-time subscriptions');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (mediaChannelRef.current) {
        supabase.removeChannel(mediaChannelRef.current);
      }
    };
  }, [roomId, user, isOwner]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchCurrentMediaSession = async () => {
    if (!roomId) return;
    
    try {
      console.log("Fetching current media session");
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
      const formattedMessages = data.map((msg) => ({
        id: msg.id,
        content: msg.content,
        created_at: msg.created_at,
        user_id: msg.user_id,
        user_email: msg.profiles?.username || msg.user_id,
      }));

      console.log('Formatted messages:', formattedMessages);
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error in fetchMessages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !roomId) return;

    setSendingMessage(true);
    try {
      console.log('Sending message:', {
        room_id: roomId,
        user_id: user.id,
        content: newMessage.trim()
      });
      
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          room_id: roomId,
          user_id: user.id,
          content: newMessage.trim(),
        }])
        .select('id')
        .single();

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
        return;
      }

      console.log('Message sent successfully with ID:', data?.id);
      
      // Store the ID of the message we just sent to prevent duplication
      if (data?.id) {
        lastMessageSentRef.current = data.id;
      }
      
      // Add our own message to the messages list
      setMessages((prev) => [
        ...prev, 
        { 
          id: data?.id || 'temp-id', 
          content: newMessage.trim(), 
          created_at: new Date().toISOString(),
          user_id: user.id,
          user_email: 'You'
        }
      ]);
      
      // Clear the input
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
      console.log("Updating media session with URL:", embedUrl);
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
        
        // Update local state for owner as well
        setCurrentMediaSession({
          media_url: embedUrl,
          is_playing: true,
          current_position: 0
        });
        
        // Force iframe refresh
        const iframe = document.querySelector('iframe');
        if (iframe) {
          iframe.src = embedUrl;
        }
      }
    } catch (error) {
      console.error('Error in handleYoutubeSubmit:', error);
      toast.error('An error occurred');
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Function to get YouTube embed URL
  const getYoutubeEmbedUrl = (url) => {
    try {
      // Convert to embed URL format
      if (url.includes('youtube.com/watch')) {
        const videoId = url.split('v=')[1]?.split('&')[0];
        if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
      } else if (url.includes('youtu.be')) {
        const videoId = url.split('youtu.be/')[1]?.split('?')[0];
        if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
      } else if (url.includes('youtube.com/embed')) {
        // Already an embed URL, but ensure autoplay and JS API are enabled
        if (!url.includes('autoplay=1')) {
          return url + (url.includes('?') ? '&' : '?') + 'autoplay=1&enablejsapi=1';
        }
        return url;
      }
      return url; // Return the original URL if it doesn't match YouTube patterns
    } catch (e) {
      console.error('Error parsing YouTube URL:', e);
      return '';
    }
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

  const toggleMembersList = () => {
    setShowMembers(!showMembers);
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
          
          <div className="flex items-center gap-2">
            {isOwner && (
              <Button 
                variant="outline"
                onClick={toggleMembersList}
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
            <Card className="p-6 mb-4">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Media Player</h2>
              
              {isOwner ? (
                <form onSubmit={handleYoutubeSubmit} className="flex gap-2 mb-4">
                  <Input
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="Enter YouTube URL"
                    className="flex-1"
                  />
                  <Button type="submit" className="bg-synqup-purple hover:bg-synqup-dark-purple">
                    Play for Everyone
                  </Button>
                </form>
              ) : (
                <div className="mb-4 text-sm text-muted-foreground">
                  Video playback is controlled by the room owner
                </div>
              )}
              
              <div className="aspect-video bg-black relative rounded-lg overflow-hidden border">
                {currentMediaSession?.media_url ? (
                  <iframe
                    ref={playerRef}
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
            <Card className="p-4 h-[600px] flex flex-col">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Chat</h2>
              
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
                          ? 'ml-auto bg-synqup-purple text-white'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <div className={`text-xs mb-1 ${
                        message.user_id === user?.id
                          ? 'text-white/80'
                          : 'text-muted-foreground'
                      }`}>
                        {message.user_id === user?.id
                          ? 'You'
                          : message.user_email || 'User'}
                        {' · '}
                        {formatTime(message.created_at)}
                      </div>
                      <div className={message.user_id === user?.id ? 'text-white' : 'text-foreground'}>
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
                  className="flex-1 min-h-[60px] max-h-[120px] resize-none text-foreground placeholder:text-muted-foreground"
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
                  className="h-[60px] bg-synqup-purple hover:bg-synqup-dark-purple"
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
