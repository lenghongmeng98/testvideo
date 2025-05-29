// app/api/token/route.ts
import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const room = searchParams.get('room');
    const username = searchParams.get('username');
    
    // Validate required parameters
    if (!room || !username) {
      return NextResponse.json({ 
        error: 'Missing required parameters: room and username' 
      }, { status: 400 });
    }

    // Check environment variables
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const serverUrl = process.env.LIVEKIT_URL;

    // Debug logging
    console.log('Environment check:');
    console.log('API Key exists:', !!apiKey);
    console.log('API Key prefix:', apiKey?.substring(0, 6) + '...');
    console.log('API Secret exists:', !!apiSecret);
    console.log('API Secret length:', apiSecret?.length);
    console.log('Server URL:', serverUrl);

    if (!apiKey || !apiSecret || !serverUrl) {
      console.error('Missing LiveKit environment variables');
      
      return NextResponse.json({ 
        error: 'Server configuration error',
        debug: {
          hasApiKey: !!apiKey,
          hasApiSecret: !!apiSecret,
          hasServerUrl: !!serverUrl
        }
      }, { status: 500 });
    }

    // Create access token with 10 hours expiration
    const at = new AccessToken(apiKey, apiSecret, {
      identity: username,
      ttl: 36000, // 10 hours in seconds (10 * 60 * 60)
    });

    // Grant permissions
    at.addGrant({
      room: room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();
    
    // Debug token content
    try {
      const tokenPayload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      console.log('Generated token payload:', tokenPayload);
      console.log('Token expires at:', new Date(tokenPayload.exp * 1000).toISOString());
    } catch (e) {
      console.log('Could not decode generated token:', e);
    }

    return NextResponse.json({
      token: token,
      room: room,
      username: username,
      serverUrl: serverUrl,
    });

  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate token',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}