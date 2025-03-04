import * as THREE from 'three';

// Create a simple grass texture procedurally
const createGrassTexture = (): THREE.Texture => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  
  if (!context) {
    console.error('Could not get canvas context');
    return new THREE.Texture();
  }
  
  // Fill with transparent background
  context.fillStyle = 'rgba(0,0,0,0)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  // Create gradient for grass blade
  const gradient = context.createLinearGradient(32, 0, 32, 128);
  gradient.addColorStop(0, 'rgba(66, 155, 27, 1.0)'); // Top color (brighter)
  gradient.addColorStop(0.6, 'rgba(50, 120, 20, 1.0)'); // Middle color
  gradient.addColorStop(1, 'rgba(40, 100, 15, 1.0)'); // Bottom color (darker)
  
  // Draw several blades of grass
  context.fillStyle = gradient;
  
  // Center blade
  context.beginPath();
  context.moveTo(32, 0);
  context.lineTo(38, 128);
  context.lineTo(26, 128);
  context.closePath();
  context.fill();
  
  // Left blade
  context.beginPath();
  context.moveTo(16, 30);
  context.lineTo(24, 128);
  context.lineTo(8, 128);
  context.closePath();
  context.fill();
  
  // Right blade
  context.beginPath();
  context.moveTo(48, 30);
  context.lineTo(56, 128);
  context.lineTo(40, 128);
  context.closePath();
  context.fill();
  
  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  
  return texture;
};

export const createGrass = (
  terrain: THREE.Mesh,
  density = 2000, // Reduced default density
  width = 500, // Reduced area width from 1000 to 500
  height = 500, // Reduced area height from 1000 to 500
  bladeHeight = 3, // Increased height for better visibility with fewer blades
  bladeWidth = 1.0, // Increased width for better visibility with fewer blades
  color = 0x4c9900 // Grass color
): THREE.InstancedMesh => {
  console.log("Creating grass with density:", density);
  
  // Create a simple grass blade geometry
  const grassGeometry = new THREE.PlaneGeometry(bladeWidth, bladeHeight);
  grassGeometry.translate(0, bladeHeight / 2, 0); // Move pivot to bottom
  
  // Create grass texture
  const grassTexture = createGrassTexture();
  
  // Create material with transparency and double-sided rendering
  const grassMaterial = new THREE.MeshStandardMaterial({
    color: color,
    side: THREE.DoubleSide,
    alphaTest: 0.5,
    flatShading: true,
    map: grassTexture,
    transparent: true
  });
  
  // Create instanced mesh for performance
  const grass = new THREE.InstancedMesh(
    grassGeometry,
    grassMaterial,
    density
  );
  
  // Raycaster for height sampling
  const raycaster = new THREE.Raycaster();
  raycaster.ray.direction.set(0, -1, 0); // Cast ray downward
  
  // Temporary objects for calculations
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const rotation = new THREE.Euler();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  
  // Get terrain dimensions and position
  const terrainPosition = new THREE.Vector3();
  terrain.getWorldPosition(terrainPosition);
  
  // Debug info
  console.log("Terrain position:", terrainPosition);
  console.log("Terrain rotation:", terrain.rotation);
  console.log("Terrain scale:", terrain.scale);
  
  // Create grass in a grid pattern for better distribution
  const gridSize = Math.ceil(Math.sqrt(density));
  const cellWidth = width / gridSize;
  const cellHeight = height / gridSize;
  
  let placedCount = 0;
  
  // Create grass in a grid with random offsets
  for (let i = 0; i < gridSize && placedCount < density; i++) {
    for (let j = 0; j < gridSize && placedCount < density; j++) {
      // Base position in grid
      const baseX = -width/2 + i * cellWidth + cellWidth/2;
      const baseZ = -height/2 + j * cellHeight + cellHeight/2;
      
      // Add random offset within cell
      const offsetX = (Math.random() - 0.5) * cellWidth * 0.8;
      const offsetZ = (Math.random() - 0.5) * cellHeight * 0.8;
      
      const x = baseX + offsetX;
      const z = baseZ + offsetZ;
      
      // Set position for raycasting
      // Account for terrain rotation (it's rotated -90 degrees around X axis)
      const rayOriginX = x;
      const rayOriginY = 1000; // Start high above terrain
      const rayOriginZ = z;
      
      // Cast ray to find terrain height at this position
      raycaster.ray.origin.set(rayOriginX, rayOriginY, rayOriginZ);
      const intersects = raycaster.intersectObject(terrain);
      
      if (intersects.length > 0) {
        // Place grass on terrain surface
        position.copy(intersects[0].point);
        
        // Add a tiny offset to prevent z-fighting
        position.y += 0.05;
        
        // Random rotation around Y axis for natural look
        rotation.set(
          0.1 * Math.random(), // Slight random tilt
          Math.PI * 2 * Math.random(), // Random rotation
          0.1 * Math.random() // Slight random tilt
        );
        quaternion.setFromEuler(rotation);
        
        // Random slight scale variation
        const scaleVar = 0.75 + Math.random() * 0.5;
        scale.set(scaleVar, scaleVar + Math.random() * 0.5, scaleVar);
        
        // Apply transformations
        matrix.compose(position, quaternion, scale);
        grass.setMatrixAt(placedCount, matrix);
        
        placedCount++;
      }
    }
  }
  
  console.log(`Successfully placed ${placedCount} grass blades`);
  
  // Update the instance matrix
  grass.instanceMatrix.needsUpdate = true;
  
  // Enable shadows
  grass.castShadow = true;
  grass.receiveShadow = true;
  
  return grass;
}; 