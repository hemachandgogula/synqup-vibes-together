import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Check, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import RoomMembers from '@/components/RoomMembers.tsx';
import RoomMediaPlayer from '@/components/RoomMediaPlayer';
import RoomChat from '@/components/RoomChat';

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
  const channelsRef = useRef({});
  const playerRef = useRef(null);
  const lastMediaUpdateRef = useRef(null);

  const [membership, setMembership] = useState(null);

  useEffect(() => {
    if (!user || !roomId) {
      if (!roomId) {
        navigate('/dashboard');
      } else if (!user) {
        navigate('/login');
      }
      return;
    }
    initializeRoom();
    return () => {
      cleanup();
      setMembership(null);
      setIsOwner(false);
      setCurrentMediaSession(null); 
      setMessages([]);
    };
  }, [user, roomId, navigate]);

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
        const { error: joinError } = await supabase
          .from('room_members')
          .insert([{ room_id: roomId, user_id: user.id, role: 'member' }]);
        if (joinError) {
          console.error('Error joining room:', joinError);
          throw new Error('Could not join room');
        }
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

  const initializeRoom = async () => {
    try {
      setLoading(true);
      setMembership(null);
      setIsOwner(false);

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

      await ensureMembership();

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

  const setupRealtimeConnections = () => {
    cleanup();
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
          console.log('Realtime new message payload:', payload);
          if (payload.new && payload.new.user_id !== user.id) {
            let username = 'Unknown user';
            const existingMsgWithProfile = messages.find(msg => msg.user_id === payload.new.user_id && msg.profiles?.username);
            if (existingMsgWithProfile) {
              username = existingMsgWithProfile.profiles.username;
            } else if (payload.new.profiles?.username) { 
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
              profiles: { username } 
            };
            setMessages(prev => {
              const exists = prev.some(msg => msg.id === messageWithUser.id);
              if (exists) return prev; 
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
          console.log('Realtime media session payload:', payload);
          if (payload.new) {
            const newSessionData = payload.new;
            
            if (lastMediaUpdateRef.current && lastMediaUpdateRef.current === newSessionData.updated_at) {
                console.warn('Media update skipped, same updated_at:', newSessionData.updated_at);
                return;
            }
            lastMediaUpdateRef.current = newSessionData.updated_at;

            console.log('Applying media session update:', newSessionData);
            setCurrentMediaSession(newSessionData); 

            if (!isOwner) {
              const iframe = playerRef.current;
              if (iframe && iframe.src !== newSessionData.media_url) {
                console.log(`Non-owner: Updating iframe src from ${iframe.src} to ${newSessionData.media_url}`);
                iframe.src = newSessionData.media_url; 
                toast.info('Video updated by room owner.');
              } else if (iframe && iframe.src === newSessionData.media_url) {
                console.log('Non-owner: Media session updated, URL is the same. Video should continue or restart based on autoplay.');
              }
              setYoutubeUrl(newSessionData.media_url);
            }
          } else if (payload.eventType === 'DELETE' && payload.old?.id === currentMediaSession?.id) {
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
        `);

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
      setMessages(prev => [...prev, sentMessageData]);
      setNewMessage('');
    } catch (err) { 
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
      const mediaData = {
        room_id: roomId,
        media_url: embedUrl,
        media_type: 'youtube',
        is_playing: true, 
        current_position: 0,
        media_title: 'YouTube Video', 
        updated_at: new Date().toISOString(), 
      };

      let operationError;

      if (currentMediaSession?.id) {
        const { error } = await supabase
          .from('media_sessions')
          .update(mediaData)
          .eq('id', currentMediaSession.id)
          .eq('room_id', roomId);
          operationError = error;
      } else {
         const { error } = await supabase
          .from('media_sessions')
          .insert(mediaData)
          .select() 
          .single(); 
          operationError = error;
      }
        
      if (operationError) {
        console.error('Error updating media session:', operationError);
        toast.error(`Failed to update media: ${operationError.message}`);
      } else {
        toast.success('Video updated for all viewers');
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
        .maybeSingle(); 

      if (error) {
        console.error('Error fetching current media session:', error);
        toast.error('Could not load current video.');
        return;
      }
      if (data) {
        setCurrentMediaSession(data);
        setYoutubeUrl(data.media_url); 
        setTimeout(() => { 
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
        const embedUrl = new URL(url);
        embedUrl.searchParams.set('autoplay', '1');
        embedUrl.searchParams.set('enablejsapi', '1');
        return embedUrl.toString();
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
      }
      console.warn("Could not parse YouTube URL, returning as is:", url);
      return url; 
    } catch (e) {
      console.error('Error parsing YouTube URL:', e, url);
      toast.error('Invalid YouTube URL format.');
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
    }
  };

  if (loading && !room) {
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

        <h1 className="text-3xl font-bold mb-8 text-foreground">{room?.name || 'Room'}</h1>
        
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3">
            <RoomMediaPlayer
              isOwner={isOwner}
              youtubeUrl={youtubeUrl}
              setYoutubeUrl={setYoutubeUrl}
              handleYoutubeSubmit={handleYoutubeSubmit}
              currentMediaSession={currentMediaSession}
              playerRef={playerRef}
            />
            
            {showMembers && isOwner && (
              <RoomMembers
                roomId={roomId || ''}
                currentUserId={user?.id || ''}
                isOwner={isOwner}
              />
            )}
          </div>
          
          <div className="xl:col-span-1">
            <RoomChat
              messages={messages}
              user={user}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              handleSendMessage={handleSendMessage}
              sendingMessage={sendingMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
