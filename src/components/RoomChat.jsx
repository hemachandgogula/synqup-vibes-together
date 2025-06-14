
import React, { useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

const RoomChat = ({
  messages,
  user,
  newMessage,
  setNewMessage,
  handleSendMessage,
  sendingMessage,
}) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
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
  );
};

export default RoomChat;
