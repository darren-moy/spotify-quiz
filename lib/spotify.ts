// lib/spotify.ts
import axios from 'axios';

export const fetchSpotifyData = async (token: string, endpoint: string) => {
  const response = await axios.get(`https://api.spotify.com/v1/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
