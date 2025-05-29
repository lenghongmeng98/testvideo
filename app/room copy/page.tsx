'use client';

import {
  ControlBar,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
  RoomContext,
} from '@livekit/components-react';
import { Room, Track } from 'livekit-client';
import '@livekit/components-styles';
import { useEffect, useState } from 'react';

export default function Page() {
  // TODO: get user input for room and name
  const room = 'quickstart-room';
  const name = 'quickstart-user';
  
  // State management
  const [token, setToken] = useState('');
  const [serverUrl, setServerUrl] = useState(''); // Add serverUrl state
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [roomInstance] = useState(() => new Room({
    // Optimize video quality for each participant's screen
    adaptiveStream: true,
    // Enable automatic audio/video quality optimization
    dynacast: true,
  }));

  useEffect(() => {
    let mounted = true;
    
    const connectToRoom = async () => {
      try {
        console.log('Fetching token...');
        
        // Fetch token from API
        const resp = await fetch(`/api/token?room=${room}&username=${name}`);
        
        if (!resp.ok) {
          const errorText = await resp.text();
          throw new Error(`HTTP error! status: ${resp.status}, message: ${errorText}`);
        }
        
        const data = await resp.json();
        
        if (!mounted) return;
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        if (!data.token) {
          throw new Error('No token received from server');
        }
        
        if (!data.serverUrl) {
          throw new Error('No server URL received from server');
        }
        
        console.log('Token received, connecting to room...');
        console.log('Server URL:', data.serverUrl);
        console.log('Token preview:', data.token.substring(0, 50) + '...');
        
        // Decode JWT for debugging (remove this in production)
        try {
          const tokenPayload = JSON.parse(atob(data.token.split('.')[1]));
          console.log('Token payload:', tokenPayload);
          console.log('Token expires at:', new Date(tokenPayload.exp * 1000).toISOString());
          console.log('Current time:', new Date().toISOString());
          console.log('Time until expiry:', (tokenPayload.exp * 1000 - Date.now()) / 1000, 'seconds');
          
          // Check if token is already expired
          if (tokenPayload.exp * 1000 < Date.now()) {
            throw new Error('Token is already expired');
          }
        } catch (e) {
          console.log('Token validation error:', e);
          if (e.message === 'Token is already expired') {
            throw e;
          }
        }
        
        setToken(data.token);
        setServerUrl(data.serverUrl);
        
        // Connect to room using the serverUrl from the API response
        await roomInstance.connect(data.serverUrl, data.token);
        
        if (mounted) {
          setIsConnected(true);
          console.log('Successfully connected to room');
        }
        
      } catch (e) {
        console.error('Connection error:', e);
        if (mounted) {
          setError(e instanceof Error ? e.message : 'Unknown error occurred');
        }
      }
    };

    connectToRoom();

    return () => {
      mounted = false;
      roomInstance.disconnect();
    };
  }, [roomInstance, room, name]);

  // Show loading state while getting token
  if (!token && !error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div>Getting token...</div>
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          Room: {room} | User: {name}
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        color: 'red'
      }}>
        <h2>Connection Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Show connecting state
  if (token && !isConnected) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Connecting to room...</div>
      </div>
    );
  }

  // Main video conference UI
  return (
    <RoomContext.Provider value={roomInstance}>
      <div data-lk-theme="default" style={{ height: '100dvh' }}>
        {/* Your custom component with basic video conferencing functionality. */}
        <MyVideoConference />
        {/* The RoomAudioRenderer takes care of room-wide audio for you. */}
        <RoomAudioRenderer />
        {/* Controls for the user to start/stop audio, video, and screen share tracks */}
        <ControlBar />
      </div>
    </RoomContext.Provider>
  );
}

function MyVideoConference() {
  // `useTracks` returns all camera and screen share tracks. If a user
  // joins without a published camera track, a placeholder track is returned.
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );
  
  return (
    <GridLayout 
      tracks={tracks} 
      style={{ height: 'calc(100vh - var(--lk-control-bar-height))' }}
    >
      {/* The GridLayout accepts zero or one child. The child is used
      as a template to render all passed in tracks. */}
      <ParticipantTile />
    </GridLayout>
  );
}