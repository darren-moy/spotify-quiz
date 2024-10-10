import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { fetchSpotifyData } from '../lib/spotify';  // Make sure this is imported correctly

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [playlistId, setPlaylistId] = useState<string>('');  // User input for playlist
  const [tracks, setTracks] = useState<any[]>([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState<number>(0); // Time when the question starts
  const [choices, setChoices] = useState<any[]>([]); // Choices for the current question
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);  // Keep track of the selected answer
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null); // Track if the answer is correct
  const [volume, setVolume] = useState(0.5);  // Volume state
  const audioRef = useRef<HTMLAudioElement>(null); // Ref to control the audio element

  useEffect(() => {
    const getToken = async () => {
      const response = await axios.get('/api/auth');
      setToken(response.data.token);
    };
    getToken();
  }, []);

  // Function to extract playlist ID from URL
  const extractPlaylistId = (input: string) => {
    const regex = /playlist\/([a-zA-Z0-9]+)(\?.*)?$/;
    const match = input.match(regex);
    if (match) return match[1]; // Return the playlist ID
    return input; // If it's already the ID, just return it
  };

  // Function to get random songs for multiple choices
  const getRandomSongs = (correctSong: string, trackList: any[]) => {
    const allSongs = trackList.map((track) => track.track.name); // Get song names
    const uniqueSongs = allSongs.filter(song => song !== correctSong);  // Remove the correct song from choices
    const shuffled = uniqueSongs.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);  // Return 3 random wrong choices
  };

  // Function to start the quiz and fetch tracks
  const handleFetchTracks = async () => {
    const extractedId = extractPlaylistId(playlistId);
    if (token && extractedId) {
      try {
        const data = await fetchSpotifyData(token, `playlists/${extractedId}/tracks`);
        setTracks(data.items); // Store tracks in state
        setQuizStarted(true);  // Start the quiz
        setScore(0);
        setCurrentQuestion(0);
        prepareNextQuestion(data.items, 0);  // Prepare first question
      } catch (error) {
        alert('Error fetching playlist. Please make sure the playlist ID is correct.');
        console.error(error);
      }
    }
  };

  // Prepare the choices for the current question
  const prepareNextQuestion = (trackList: any[], questionIndex: number) => {
    const currentTrack = trackList[questionIndex];
    const correctSong = currentTrack.track.name;
    const wrongChoices = getRandomSongs(correctSong, trackList);
    const allChoices = [...wrongChoices, correctSong].sort(() => 0.5 - Math.random());  // Shuffle choices
    setChoices(allChoices);
    setSelectedAnswer(null); // Reset selected answer
    setIsCorrect(null); // Reset correct state
    setStartTime(Date.now());  // Start the timer for scoring
  };

  const handleAnswer = (selectedSong: string) => {
    const correctSong = tracks[currentQuestion]?.track.name;

    // Calculate score based on response time
    const timeTaken = (Date.now() - startTime) / 1000; // Time taken in seconds
    const timeBonus = Math.max(0, 10 - timeTaken);  // 10 is max bonus, subtract time taken

    setSelectedAnswer(selectedSong); 

    if (selectedSong === correctSong) {
      setScore(score + Math.floor(100 + timeBonus * 10));  
      setIsCorrect(true); 
    } else {
      setIsCorrect(false); 
    }

    setTimeout(() => {
      if (currentQuestion < tracks.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        prepareNextQuestion(tracks, currentQuestion + 1);
      } else {
        alert(`Quiz Finished! Your final score: ${score}`);
        setQuizStarted(false);
      }
    }, 1500);  
  };

  // Handle volume changes
  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-6">Spotify Music Quiz</h1>
      <p className="text-2xl">Score: {score}</p>  
      
      {!quizStarted ? (
        <>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Enter Spotify Playlist ID or URL"
              className="border p-2 w-full max-w-lg rounded"
              value={playlistId}
              onChange={(e) => setPlaylistId(e.target.value)}
            />
          </div>
          <button
            onClick={handleFetchTracks}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg"
          >
            Start Quiz
          </button>
        </>
      ) : (
        <>
          <div className="quiz-question text-center">
            <h2 className="text-2xl mb-4">
              What song is this snippet from? (Track {currentQuestion + 1} / {tracks.length})
            </h2>
            <audio ref={audioRef} src={tracks[currentQuestion]?.track.preview_url} controls={false} autoPlay></audio>  
            <div className="flex justify-center mt-4">
              <label htmlFor="volume" className="mr-2">Volume:</label>
              <input
                id="volume"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>
            <div className="flex justify-center mt-4">
              {choices.map((song: string, index: number) => (
                <button
                  key={index}
                  className={`bg-gray-300 text-black px-4 py-2 m-2 rounded-lg 
                    ${selectedAnswer === song ? (isCorrect ? 'bg-green-500' : 'bg-red-500') : ''}`}
                  onClick={() => handleAnswer(song)}
                  disabled={selectedAnswer !== null} 
                >
                  {song}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
