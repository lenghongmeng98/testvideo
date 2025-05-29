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
  // Form state
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  
  // Connection state management
  const [token, setToken] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [roomInstance] = useState(() => new Room({
    // Optimize video quality for each participant's screen
    adaptiveStream: true,
    // Enable automatic audio/video quality optimization
    dynacast: true,
  }));

  // Handle form submission
  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    if (!roomName.trim() || !userName.trim()) {
      setError('Please enter both room name and your name');
      return;
    }
    
    setError(null);
    setIsFormSubmitted(true);
  };

  // Connect to room when form is submitted
  useEffect(() => {
    if (!isFormSubmitted) return;
    
    let mounted = true;
    
    const connectToRoom = async () => {
      try {
        setIsConnecting(true);
        console.log('Fetching token...');
        
        // Fetch token from API
        const resp = await fetch(`/api/token?room=${encodeURIComponent(roomName)}&username=${encodeURIComponent(userName)}`);
        
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
          setIsConnecting(false);
          console.log('Successfully connected to room');
        }
        
      } catch (e) {
        console.error('Connection error:', e);
        if (mounted) {
          setError(e instanceof Error ? e.message : 'Unknown error occurred');
          setIsConnecting(false);
          setIsFormSubmitted(false); // Allow user to try again
        }
      }
    };

    connectToRoom();

    return () => {
      mounted = false;
      if (isConnected) {
        roomInstance.disconnect();
      }
    };
  }, [isFormSubmitted, roomName, userName, roomInstance, isConnected]);

  // Handle leaving the room
  const handleLeaveRoom = () => {
    roomInstance.disconnect();
    setIsConnected(false);
    setIsFormSubmitted(false);
    setToken('');
    setServerUrl('');
    setError(null);
    setIsConnecting(false);
  };

  // Show form if not submitted yet
  if (!isFormSubmitted) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        {/* Animated background elements */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          zIndex: 0
        }}>
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: '300px',
            height: '300px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            animation: 'float 6s ease-in-out infinite'
          }} />
          <div style={{
            position: 'absolute',
            top: '60%',
            right: '10%',
            width: '200px',
            height: '200px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '50%',
            animation: 'float 8s ease-in-out infinite reverse'
          }} />
        </div>

        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          padding: '50px',
          borderRadius: '24px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
          minWidth: '450px',
          maxWidth: '500px',
          width: '100%',
          position: 'relative',
          zIndex: 1,
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}>
          {/* Header with icon */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #ff6b6b, #ffa500)',
              borderRadius: '50%',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              boxShadow: '0 10px 30px rgba(255, 107, 107, 0.3)'
            }}>
              🎥
            </div>
            <h1 style={{ 
              margin: 0,
              fontSize: '32px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Join Video Call
            </h1>
            <p style={{
              margin: '10px 0 0',
              color: '#666',
              fontSize: '16px'
            }}>
              Connect with your team instantly
            </p>
          </div>
          
          <form onSubmit={handleFormSubmit}>
            <div style={{ marginBottom: '30px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '12px',
                fontWeight: '600',
                color: '#333',
                fontSize: '15px'
              }}>
                Room Name
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter room name"
                  style={{
                    width: '100%',
                    padding: '18px 20px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '16px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    background: '#fafbfc',
                    color: '#000'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.background = '#fff';
                    e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e1e5e9';
                    e.target.style.background = '#fafbfc';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
                <div style={{
                  position: 'absolute',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '20px',
                  opacity: 0.4
                }}>
                  🏠
                </div>
              </div>
            </div>
            
            <div style={{ marginBottom: '40px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '12px',
                fontWeight: '600',
                color: '#333',
                fontSize: '15px'
              }}>
                Your Name
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  style={{
                    width: '100%',
                    padding: '18px 20px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '16px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    background: '#fafbfc',
                    color: '#000'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.background = '#fff';
                    e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e1e5e9';
                    e.target.style.background = '#fafbfc';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
                <div style={{
                  position: 'absolute',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '20px',
                  opacity: 0.4
                }}>
                  👤
                </div>
              </div>
            </div>
            
            {error && (
              <div style={{
                background: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)',
                color: 'white',
                padding: '16px 20px',
                borderRadius: '12px',
                marginBottom: '30px',
                textAlign: 'center',
                fontSize: '15px',
                fontWeight: '500',
                boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)'
              }}>
                ⚠️ {error}
              </div>
            )}
            
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '18px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 15px 40px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.3)';
              }}
            >
              <span style={{ position: 'relative', zIndex: 1 }}>
                🚀 Join Room
              </span>
            </button>
          </form>

          {/* Footer */}
          <div style={{
            textAlign: 'center',
            marginTop: '30px',
            color: '#888',
            fontSize: '14px'
          }}>
            Secure • High Quality • Instant Connection
          </div>
        </div>

        <style jsx>{`
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-20px);
            }
          }
        `}</style>
      </div>
    );
  }

  // Show loading state while getting token
  if (!token && !error && isConnecting) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #667eea',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            margin: '0 auto 20px',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{ marginBottom: '15px', fontSize: '20px', fontWeight: '600', color: '#333' }}>
            Getting token...
          </div>
          <div style={{ fontSize: '16px', color: '#666', marginBottom: '25px' }}>
            Room: <strong>{roomName}</strong> | User: <strong>{userName}</strong>
          </div>
          <button 
            onClick={() => setIsFormSubmitted(false)}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #6c757d, #5a6268)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '500'
            }}
          >
            ← Back to Form
          </button>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
          maxWidth: '500px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ color: '#ff6b6b', marginBottom: '15px', fontSize: '24px' }}>Connection Error</h2>
          <p style={{ color: '#666', marginBottom: '30px', lineHeight: '1.5' }}>{error}</p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button 
              onClick={() => {
                setError(null);
                setIsFormSubmitted(true);
              }}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '500'
              }}
            >
              🔄 Retry
            </button>
            <button 
              onClick={() => setIsFormSubmitted(false)}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #6c757d, #5a6268)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '500'
              }}
            >
              ← Back to Form
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show connecting state
  if (token && !isConnected && isConnecting) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #667eea',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            margin: '0 auto 20px',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{ marginBottom: '15px', fontSize: '20px', fontWeight: '600', color: '#333' }}>
            Connecting to room...
          </div>
          <div style={{ fontSize: '16px', color: '#666' }}>
            Room: <strong>{roomName}</strong> | User: <strong>{userName}</strong>
          </div>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Main video conference UI
  return (
    <RoomContext.Provider value={roomInstance}>
      <div data-lk-theme="default" style={{ height: '100dvh' }}>
        {/* Room info header */}
        <div style={{
          position: 'absolute',
          top: '15px',
          left: '15px',
          right: '15px',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          color: 'white',
          padding: '15px 25px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>
            🏠 <strong>{roomName}</strong> | 👤 <strong>{userName}</strong>
          </div>
          <button
            onClick={handleLeaveRoom}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #ff6b6b, #ff5252)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 5px 15px rgba(255, 107, 107, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            🚪 Leave Room
          </button>
        </div>
        
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