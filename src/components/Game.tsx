import { useRef, useEffect, useState } from 'react';
import { SceneManager } from '../utils/sceneManager';

const Game = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  
  // Player offset from boat
  const playerOffsetX = 0;
  const playerOffsetY = 5;
  const playerOffsetZ = 0;
  
  // Initialize the scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create scene manager
    sceneManagerRef.current = new SceneManager({
      container: containerRef.current,
      playerOffsetX,
      playerOffsetY,
      playerOffsetZ
    });
    
    // Handle window resize
    const handleResize = () => {
      if (sceneManagerRef.current) {
        sceneManagerRef.current.resize();
      }
    };
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Add pointer lock change listener
    const handlePointerLockChange = () => {
      setIsPointerLocked(document.pointerLockElement === containerRef.current);
    };
    
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      
      if (sceneManagerRef.current) {
        sceneManagerRef.current.dispose();
        sceneManagerRef.current = null;
      }
    };
  }, []);
  
  return (
    <>
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: '100vh', 
          overflow: 'hidden' 
        }} 
      />
      
      {!isPointerLocked && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <h2>Game Controls</h2>
          <p>Use WASD or Arrow Keys to move</p>
          <p>Click anywhere to enable mouse look</p>
        </div>
      )}
    </>
  );
};

export default Game; 