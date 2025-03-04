import { useRef, useEffect, useState } from 'react';
import { SceneManager } from '../utils/sceneManager';

const Game = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [debugMessage, setDebugMessage] = useState<string>('');
  
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
      const isLocked = document.pointerLockElement === containerRef.current;
      setIsPointerLocked(isLocked);
      setDebugMessage(`Pointer ${isLocked ? 'locked' : 'unlocked'}`);
    };
    
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    
    // Add click handler to container
    const handleContainerClick = () => {
      setDebugMessage('Container clicked, requesting pointer lock...');
      containerRef.current?.requestPointerLock();
    };
    
    containerRef.current.addEventListener('click', handleContainerClick);
    
    // Add key event debug
    const handleKeyDown = (e: KeyboardEvent) => {
      setDebugMessage(`Key pressed: ${e.code}`);
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('keydown', handleKeyDown);
      containerRef.current?.removeEventListener('click', handleContainerClick);
      
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
          overflow: 'hidden',
          cursor: 'pointer',
          position: 'relative'
        }} 
      />
      {/* Debug overlay - always visible */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        zIndex: 100
      }}>
        {debugMessage}
      </div>
    </>
  );
};

export default Game; 