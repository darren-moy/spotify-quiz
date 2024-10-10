import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    
    // Prepare base64 encoding for Spotify Auth
    const authString = `${clientId}:${clientSecret}`;
    const authBase64 = Buffer.from(authString).toString('base64');

    // Make the request to Spotify API for access token
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
      }).toString(),
      {
        headers: {
          Authorization: `Basic ${authBase64}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // Send the token back to the client
    const token = response.data.access_token;
    res.status(200).json({ token });

  } catch (error) {
    console.error('Error fetching Spotify token:', error);
    res.status(500).json({ error: 'Failed to get Spotify token' });
  }
}
