import { useState, useEffect } from 'react';
import Game from './components/Game';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading assets
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="app">
      {isLoading ? (
        <div className="loading-screen">
          <h1>Wanderer</h1>
          <p>Loading world...</p>
        </div>
      ) : (
        <Game />
      )}
    </div>
  );
}

export default App; 