
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Play, Pause, SkipBack, SkipForward, Send, User, Users } from 'lucide-react';

const Room = () => {
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState('');
  
  const togglePlayPause = () => {
    setPlaying(!playing);
  };

  const sendMessage = () => {
    if (message.trim()) {
      console.log('Message sent:', message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage();
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
            <div className="flex gap-2">
              <div className="h-8 w-8 rounded-full bg-synqup-soft-purple flex items-center justify-center font-semibold text-synqup-dark-purple">J</div>
              <div>
                <div className="font-medium text-sm">John</div>
                <div className="bg-muted p-2 rounded-lg text-sm">This movie is great so far!</div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="h-8 w-8 rounded-full bg-synqup-soft-blue flex items-center justify-center font-semibold text-synqup-accent-blue">S</div>
              <div>
                <div className="font-medium text-sm">Sarah</div>
                <div className="bg-muted p-2 rounded-lg text-sm">I know right? I love this scene!</div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="h-8 w-8 rounded-full bg-synqup-soft-pink flex items-center justify-center font-semibold text-synqup-accent-orange">M</div>
              <div>
                <div className="font-medium text-sm">Mike</div>
                <div className="bg-muted p-2 rounded-lg text-sm">Should we pause for snacks soon?</div>
              </div>
            </div>
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
