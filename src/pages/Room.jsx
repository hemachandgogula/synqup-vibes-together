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
  const [youtubeUrl, setYoutubeUrl] = useState(''); // Primarily for owner's input
  const [isOwner, setIsOwner] = useState(false);
  const [currentMediaSession, setCurrentMediaSession] = useState(null);
  const [roomCodeCopied, setRoomCodeCopied] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const messagesEndRef = useRef(null);
  const channelsRef = useRef({});
  const playerRef = useRef(null);
  const lastMediaUpdateRef = useRef(null); // Stores the 'updated_at' of the last processed media session

  // New: Separate status for membership state
  const [membership, setMembership] = useState(null);

  // Initialize room
  useEffect(() => {
    if (!user || !roomId) {
      // If user is null, and we have a roomId, it might be a temp state during auth.
      // However, ProtectedRoute should handle unauthenticated access.
      // If no roomId, definitely navigate.
      if (!roomId) {
        navigate('/dashboard');
      } else if (!user) {
        // Potentially navigating away if user becomes null during tab focus session check
        // This could be a source of the "refresh" if user state flickers.
        // For now, we keep this behavior as it's tied to auth state.
        navigate('/login'); // or /dashboard, consistent with ProtectedRoute
      }
      return;
    }
    initializeRoom();
    return () => {
      cleanup();
      // Reset states on component unmount or when dependencies change significantly
      setMembership(null);
      setIsOwner(false);
      setCurrentMediaSession(null); 
      setMessages([]);
    };
  }, [user, roomId, navigate]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Refactored: membership fetching
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

      // If not a member, insert and refetch for consistency
      if (!memberData) {
        const { error: joinError } = await supabase
          .from('room_members')
          .insert([{ room_id: roomId, user_id: user.id, role: 'member' }]);
        if (joinError) {
          console.error('Error joining room:', joinError);
          throw new Error('Could not join room');
        }
        // After insert, fetch again to get full member object
        const { data: refreshed, error: refreshErr } = await supabase
          .from('room_members')
          .select('*')
          .eq('room_id', roomId)
          .eq('user_id', user.id)
          .maybeSingle();
        if (refreshErr) throw refreshErr;
        setMembership(refreshed);
        setIsOwner(refreshed.role === 'owner');
        toast.success('Joined the room');
      } else {
        setMembership(memberData);
        setIsOwner(memberData.role === 'owner');
      }
    } catch (error) {
      console.error('Error ensuring membership:', error);
      throw error;
    }
  };

  // Main boot logic
  const initializeRoom = async () => {
    try {
      setLoading(true);
      setMembership(null);
      setIsOwner(false);

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

      // Membership
      await ensureMembership();

      // Load initial data
      await Promise.all([
        fetchCurrentMediaSession(),
        fetchMessages()
      ]);
      setupRealtimeConnections();
    } catch (error) {
      console.error('Error initializing room:', error);
      toast.error('Failed to load room');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Realtime setup, robust
  const setupRealtimeConnections = () => {
    cleanup();
    // Messages channel
    const messagesChannel = supabase
      .channel(`messages_${roomId}`, {
        config: {
          broadcast: { self: false }, // Do not receive own messages via broadcast
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
          console.log('Realtime new message payload:', payload);
          if (payload.new && payload.new.user_id !== user.id) {
            // Fetch username if not already available from a previous fetch or if profile isn't on payload
            let username = 'Unknown user';
            // Attempt to get username from existing messages (less queries)
            const existingMsgWithProfile = messages.find(msg => msg.user_id === payload.new.user_id && msg.profiles?.username);
            if (existingMsgWithProfile) {
              username = existingMsgWithProfile.profiles.username;
            } else if (payload.new.profiles?.username) { // Check if payload itself has it (if select was changed)
                username = payload.new.profiles.username;
            }
            else {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', payload.new.user_id)
                .maybeSingle();
              if (profileData?.username) username = profileData.username;
            }
            const messageWithUser = {
              ...payload.new,
              profiles: { username } // Ensure profiles object structure
            };
            setMessages(prev => {
              const exists = prev.some(msg => msg.id === messageWithUser.id);
              if (exists) return prev; // Avoid duplicates
              return [...prev, messageWithUser];
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`Messages channel (${roomId}) status:`, status);
        if (status === 'CLOSED' || status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
            toast.error('Chat connection issue. Please refresh.');
        }
      });

    // Media channel
    const mediaChannel = supabase
      .channel(`media_${roomId}`, {
        config: {
          broadcast: { self: false }, // Owner might not need to self-broadcast if UI updates directly
          presence: { key: user.id }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE)
          schema: 'public',
          table: 'media_sessions',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('Realtime media session payload:', payload);
          if (payload.new) {
            const newSessionData = payload.new;
            
            // Prevent processing the exact same update if timestamp hasn't changed.
            // This is a safeguard, usually updated_at should change.
            if (lastMediaUpdateRef.current && lastMediaUpdateRef.current === newSessionData.updated_at) {
                console.warn('Media update skipped, same updated_at:', newSessionData.updated_at);
                return;
            }
            lastMediaUpdateRef.current = newSessionData.updated_at;

            console.log('Applying media session update:', newSessionData);
            setCurrentMediaSession(newSessionData); // This will update the iframe src via JSX

            if (!isOwner) {
              // The iframe src is primarily controlled by `currentMediaSession.media_url`
              // Forcing iframe.src might be needed if React doesn't reliably reload on prop change for iframes with query params
              const iframe = playerRef.current;
              if (iframe && iframe.src !== newSessionData.media_url) {
                console.log(`Non-owner: Updating iframe src from ${iframe.src} to ${newSessionData.media_url}`);
                iframe.src = newSessionData.media_url; // Ensure it reloads with the new URL
                toast.info('Video updated by room owner.');
              } else if (iframe && iframe.src === newSessionData.media_url) {
                console.log('Non-owner: Media session updated, URL is the same. Video should continue or restart based on autoplay.');
              }
              // Set local youtubeUrl state as well, though it's less critical for non-owners
              setYoutubeUrl(newSessionData.media_url);
            }
          } else if (payload.eventType === 'DELETE' && payload.old?.id === currentMediaSession?.id) {
            // Handle media session deletion (e.g., owner clears video)
            console.log('Media session deleted:', payload.old);
            setCurrentMediaSession(null);
            setYoutubeUrl('');
            if (playerRef.current) playerRef.current.src = '';
            if (!isOwner) toast.info('Video stopped by room owner.');
          }
        }
      )
      .subscribe((status) => {
        console.log(`Media channel (${roomId}) status:`, status);
         if (status === 'CLOSED' || status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
            toast.error('Video sync connection issue. Please refresh.');
        }
      });

    channelsRef.current = { messages: messagesChannel, media: mediaChannel };
  };

  const cleanup = () => {
    Object.values(channelsRef.current).forEach(channel => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    });
    channelsRef.current = {};
  };

  // Enforce robust fetch
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
      const { data: insertedMessages, error } = await supabase
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
          profiles!inner(username)
        `); // Removed .single(), expect an array. Use !inner to ensure profile exists.

      if (error) {
        console.error('Error sending message to Supabase:', error);
        toast.error(`Failed to send message: ${error.message}`);
        setSendingMessage(false);
        return;
      }

      if (!insertedMessages || insertedMessages.length === 0) {
        console.error('Error sending message: No data returned after insert.');
        toast.error('Failed to send message: No data returned from server.');
        setSendingMessage(false);
        return;
      }
      
      const sentMessageData = insertedMessages[0];
      // Manually add to local state. Realtime listener with self:false won't pick this up.
      setMessages(prev => [...prev, sentMessageData]);
      setNewMessage('');
    } catch (err) { // Catch any other exceptions
      console.error('Exception during sendMessage:', err);
      toast.error(`Failed to send message: ${err.message || 'Unknown client-side error'}`);
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
      // Upsert will create if not exists, or update if exists based on room_id (if room_id is part of primary key or unique constraint for media_sessions)
      // Assuming media_sessions has a unique constraint on room_id or pk is room_id for upsert to work as intended to update single session per room.
      // If media_sessions.id is the PK, and we want one session per room, ensure upsert has a conflict target.
      // Current schema: id is PK, room_id is FK. So upsert should target room_id if we want one session per room.
      // Let's assume the intention is to update the existing media_session for the room or create one if none exists.
      // This requires knowing the ID of the existing media_session or using a conflict target on room_id.
      // For simplicity, if currentMediaSession exists, we update it, otherwise insert.
      
      const mediaData = {
        room_id: roomId,
        media_url: embedUrl,
        media_type: 'youtube',
        is_playing: true, // Assuming video starts playing
        current_position: 0,
        media_title: 'YouTube Video', // Could try to fetch title later
        updated_at: new Date().toISOString(), // Explicitly set updated_at to ensure change
      };

      let operationError;

      if (currentMediaSession?.id) {
        const { error } = await supabase
          .from('media_sessions')
          .update(mediaData)
          .eq('id', currentMediaSession.id)
          .eq('room_id', roomId); // ensure we're updating the correct room's session
          operationError = error;
      } else {
         const { error } = await supabase
          .from('media_sessions')
          .insert(mediaData)
          .select() // To get back the inserted data, including new updated_at
          .single(); // Assuming insert will give back the single new record
          operationError = error;
          // if (!operationError && newSessionData) setCurrentMediaSession(newSessionData); // Update local state immediately
      }
        
      if (operationError) {
        console.error('Error updating media session:', operationError);
        toast.error(`Failed to update media: ${operationError.message}`);
      } else {
        toast.success('Video updated for all viewers');
        // The realtime channel should pick up this change for other users.
        // Owner's view will also update via setCurrentMediaSession if we fetch after upsert, or rely on realtime if self=true.
        // For now, let owner's UI update from direct state change / currentMediaSession if needed
      }
    } catch (error) {
      console.error('Error in handleYoutubeSubmit:', error);
      toast.error('Failed to update video');
    }
  };

  const fetchCurrentMediaSession = async () => {
    if (!roomId) return;
    try {
      const { data, error } = await supabase
        .from('media_sessions')
        .select('*')
        .eq('room_id', roomId)
        .maybeSingle(); // A room might not have a media session yet

      if (error) {
        console.error('Error fetching current media session:', error);
        toast.error('Could not load current video.');
        return;
      }
      if (data) {
        setCurrentMediaSession(data);
        setYoutubeUrl(data.media_url); // Set owner's input field if they are owner
        // Ensure iframe loads initial video, especially if joining a room with an active session
        setTimeout(() => { // Delay to ensure playerRef is available
          if (playerRef.current && data.media_url) {
            console.log('Setting initial iframe src:', data.media_url);
            playerRef.current.src = data.media_url;
          }
        }, 100);
      } else {
        setCurrentMediaSession(null);
        setYoutubeUrl('');
      }
    } catch (err) {
      console.error('Exception fetching media session:', err);
    }
  };

  const getYoutubeEmbedUrl = (url) => {
    try {
      let videoId;
      if (url.includes('youtube.com/watch')) {
        const params = new URL(url).searchParams;
        videoId = params.get('v');
      } else if (url.includes('youtu.be')) {
        videoId = new URL(url).pathname.substring(1);
      } else if (url.includes('youtube.com/embed')) {
        // Already an embed URL, just ensure params
        const embedUrl = new URL(url);
        embedUrl.searchParams.set('autoplay', '1');
        embedUrl.searchParams.set('enablejsapi', '1');
        return embedUrl.toString();
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
      }
      // If not a recognized YouTube URL, but user submitted it, pass it through (less ideal)
      // Or return null/empty to indicate invalidity
      console.warn("Could not parse YouTube URL, returning as is:", url);
      return url; // Fallback, might not work if not embeddable
    } catch (e) {
      console.error('Error parsing YouTube URL:', e, url);
      toast.error('Invalid YouTube URL format.');
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

  if (loading && !room) { // Ensure room data is also checked if loading is primary flag
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
            {isOwner && ( // Only show members button to owner
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

        <h1 className="text-3xl font-bold mb-8 text-foreground">{room?.name || 'Room'}</h1>
        
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Media Player Section */}
          <div className="xl:col-span-3">
            <Card className="p-6 mb-4 bg-card border-border">
              <h2 className="text-xl font-semibold mb-4 text-card-foreground">Media Player</h2>
              <p className="text-sm text-muted-foreground mb-2">Video URL is synced. Playback (play/pause/seek) is controlled locally on each device.</p>
              
              {isOwner ? (
                <form onSubmit={handleYoutubeSubmit} className="flex gap-2 mb-4">
                  <Input
                    value={youtubeUrl} // This state is for the owner's input field
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
                  Video playback is controlled by the room owner.
                </div>
              )}
              
              <div className="aspect-video bg-black relative rounded-lg overflow-hidden border border-border">
                {currentMediaSession?.media_url ? (
                  <iframe
                    ref={playerRef}
                    key={currentMediaSession.media_url} // Add key to force re-render on src change
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
                          // Ensure profiles and username exist before trying to access
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
