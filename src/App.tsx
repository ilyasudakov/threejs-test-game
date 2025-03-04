import { useState, useEffect } from 'react';
import Game from './components/Game';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading assets
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Increased loading time to better showcase the improved screen

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="app">
      {isLoading ? (
        <div className="loading-screen">
          <div className="loading-content">
            <h1 className="game-title">Seafarer</h1>
            <p className="loading-text">Preparing your adventure...</p>
            <div className="loading-bar">
              <div className="loading-progress"></div>
            </div>
            <p className="loading-tip">Tip: Watch for changing weather patterns during your journey.</p>
          </div>
        </div>
      ) : (
        <Game />
      )}
    </div>
  );
}

export default App; 