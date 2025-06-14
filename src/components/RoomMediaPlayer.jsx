
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const RoomMediaPlayer = ({
  isOwner,
  youtubeUrl,
  setYoutubeUrl,
  handleYoutubeSubmit,
  currentMediaSession,
  playerRef,
}) => {
  return (
    <Card className="p-6 mb-4 bg-card border-border">
      <h2 className="text-xl font-semibold mb-4 text-card-foreground">Media Player</h2>
      <p className="text-sm text-muted-foreground mb-2">Video URL is synced. Playback (play/pause/seek) is controlled locally on each device.</p>
      
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
  );
};

export default RoomMediaPlayer;
