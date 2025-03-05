import * as THREE from 'three';

export const createBoat = (): THREE.Group => {
  const boatGroup = new THREE.Group();
  
  // Boat hull - red with yellow stripe
  const hullGeometry = new THREE.BoxGeometry(8, 4, 20);
  const hullMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xe74c3c, // Bright red
    roughness: 0.7,
    metalness: 0.1
  });
  const hull = new THREE.Mesh(hullGeometry, hullMaterial);
  hull.position.y = 0;
  hull.castShadow = true;
  hull.receiveShadow = true;
  boatGroup.add(hull);
  
  // Yellow stripe on hull
  const stripeGeometry = new THREE.BoxGeometry(8.1, 1, 20.1);
  const stripeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xf1c40f, // Bright yellow
    roughness: 0.7,
    metalness: 0.1
  });
  const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
  stripe.position.y = 0.5;
  stripe.castShadow = true;
  stripe.receiveShadow = true;
  boatGroup.add(stripe);
  
  // Dark bottom of hull
  const bottomGeometry = new THREE.BoxGeometry(8, 1, 20);
  const bottomMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x34495e, // Dark blue-gray
    roughness: 0.7,
    metalness: 0.1
  });
  const bottom = new THREE.Mesh(bottomGeometry, bottomMaterial);
  bottom.position.y = -1.5;
  bottom.castShadow = true;
  bottom.receiveShadow = true;
  boatGroup.add(bottom);
  
  // Boat deck - tan colored
  const deckGeometry = new THREE.BoxGeometry(7.5, 0.5, 19);
  const deckMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xf5d6a8, // Sandy/tan color
    roughness: 0.8,
    metalness: 0.1
  });
  const deck = new THREE.Mesh(deckGeometry, deckMaterial);
  deck.position.y = 2.25;
  deck.castShadow = true;
  deck.receiveShadow = true;
  boatGroup.add(deck);
  
  // Add gunwales (side walls) around the deck
  const gunwaleHeight = 1.5; // Height of the side walls
  const gunwaleThickness = 0.4; // Thickness of the walls
  
  // Left gunwale (side wall)
  const leftGunwaleGeometry = new THREE.BoxGeometry(gunwaleThickness, gunwaleHeight, 19);
  const gunwaleMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xe74c3c, // Match the hull color
    roughness: 0.7,
    metalness: 0.1
  });
  const leftGunwale = new THREE.Mesh(leftGunwaleGeometry, gunwaleMaterial);
  leftGunwale.position.x = 3.75 - (gunwaleThickness / 2); // Position at the edge of the deck
  leftGunwale.position.y = 2.25 + (gunwaleHeight / 2); // Position on top of the deck
  leftGunwale.position.z = 0;
  leftGunwale.castShadow = true;
  leftGunwale.receiveShadow = true;
  boatGroup.add(leftGunwale);
  
  // Right gunwale (side wall)
  const rightGunwaleGeometry = new THREE.BoxGeometry(gunwaleThickness, gunwaleHeight, 19);
  const rightGunwale = new THREE.Mesh(rightGunwaleGeometry, gunwaleMaterial);
  rightGunwale.position.x = -3.75 + (gunwaleThickness / 2); // Position at the edge of the deck
  rightGunwale.position.y = 2.25 + (gunwaleHeight / 2); // Position on top of the deck
  rightGunwale.position.z = 0;
  rightGunwale.castShadow = true;
  rightGunwale.receiveShadow = true;
  boatGroup.add(rightGunwale);
  
  // Front gunwale (bow)
  const frontGunwaleGeometry = new THREE.BoxGeometry(7.5 - (gunwaleThickness * 2), gunwaleHeight, gunwaleThickness);
  const frontGunwale = new THREE.Mesh(frontGunwaleGeometry, gunwaleMaterial);
  frontGunwale.position.x = 0;
  frontGunwale.position.y = 2.25 + (gunwaleHeight / 2); // Position on top of the deck
  frontGunwale.position.z = -9.5 + (gunwaleThickness / 2); // Position at the front edge of the deck
  frontGunwale.castShadow = true;
  frontGunwale.receiveShadow = true;
  boatGroup.add(frontGunwale);
  
  // Back gunwale (stern)
  const backGunwaleGeometry = new THREE.BoxGeometry(7.5 - (gunwaleThickness * 2), gunwaleHeight, gunwaleThickness);
  const backGunwale = new THREE.Mesh(backGunwaleGeometry, gunwaleMaterial);
  backGunwale.position.x = 0;
  backGunwale.position.y = 2.25 + (gunwaleHeight / 2); // Position on top of the deck
  backGunwale.position.z = 9.5 - (gunwaleThickness / 2); // Position at the back edge of the deck
  backGunwale.castShadow = true;
  backGunwale.receiveShadow = true;
  boatGroup.add(backGunwale);
  
  // Cabin - white with blue windows
  const cabinGeometry = new THREE.BoxGeometry(6, 4, 6);
  const cabinMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff, // White
    roughness: 0.7,
    metalness: 0.1
  });
  const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
  cabin.position.y = 4.5;
  cabin.position.z = -4; // Positioned toward the front
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  boatGroup.add(cabin);
  
  // Cabin roof - red
  const roofGeometry = new THREE.BoxGeometry(6.5, 0.5, 6.5);
  const roofMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xe74c3c, // Bright red
    roughness: 0.7,
    metalness: 0.1
  });
  const roof = new THREE.Mesh(roofGeometry, roofMaterial);
  roof.position.y = 6.75;
  roof.position.z = -4;
  roof.castShadow = true;
  roof.receiveShadow = true;
  boatGroup.add(roof);
  
  // Front window - blue
  const frontWindowGeometry = new THREE.PlaneGeometry(4, 2);
  const windowMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x3498db, // Light blue
    roughness: 0.3,
    metalness: 0.5,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide
  });
  const frontWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
  frontWindow.position.y = 5;
  frontWindow.position.z = -7.01; // Slightly offset to avoid z-fighting
  frontWindow.rotation.y = Math.PI;
  frontWindow.castShadow = false;
  frontWindow.receiveShadow = false;
  boatGroup.add(frontWindow);
  
  // Side windows - blue
  const sideWindowGeometry = new THREE.PlaneGeometry(4, 2);
  const leftWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
  leftWindow.position.y = 5;
  leftWindow.position.z = -4;
  leftWindow.position.x = 3.01; // Slightly offset
  leftWindow.rotation.y = Math.PI / 2;
  leftWindow.castShadow = false;
  leftWindow.receiveShadow = false;
  boatGroup.add(leftWindow);
  
  const rightWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
  rightWindow.position.y = 5;
  rightWindow.position.z = -4;
  rightWindow.position.x = -3.01; // Slightly offset
  rightWindow.rotation.y = -Math.PI / 2;
  rightWindow.castShadow = false;
  rightWindow.receiveShadow = false;
  boatGroup.add(rightWindow);
  
  // Smokestack/exhaust pipe
  const stackGeometry = new THREE.CylinderGeometry(0.6, 0.8, 4, 8);
  const stackMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x7f8c8d, // Gray
    roughness: 0.7,
    metalness: 0.3
  });
  const stack = new THREE.Mesh(stackGeometry, stackMaterial);
  stack.position.y = 8;
  stack.position.z = -2;
  stack.castShadow = true;
  stack.receiveShadow = true;
  boatGroup.add(stack);
  
  // Top of smokestack
  const stackTopGeometry = new THREE.CylinderGeometry(0.8, 0.6, 0.5, 8);
  const stackTopMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x34495e, // Dark blue-gray
    roughness: 0.7,
    metalness: 0.3
  });
  const stackTop = new THREE.Mesh(stackTopGeometry, stackTopMaterial);
  stackTop.position.y = 10;
  stackTop.position.z = -2;
  stackTop.castShadow = true;
  stackTop.receiveShadow = true;
  boatGroup.add(stackTop);
  
  // Flag pole
  const flagPoleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
  const flagPoleMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x7f8c8d, // Gray
    roughness: 0.7,
    metalness: 0.3
  });
  const flagPole = new THREE.Mesh(flagPoleGeometry, flagPoleMaterial);
  flagPole.position.y = 4;
  flagPole.position.z = 8; // At the back of the boat
  flagPole.position.x = 0;
  boatGroup.add(flagPole);
  
  // Flag
  const flagGeometry = new THREE.PlaneGeometry(1.5, 1);
  const flagMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xe74c3c, // Red
    roughness: 0.7,
    metalness: 0.1,
    side: THREE.DoubleSide
  });
  const flag = new THREE.Mesh(flagGeometry, flagMaterial);
  flag.position.y = 5;
  flag.position.z = 8;
  flag.position.x = 0.75;
  flag.rotation.y = Math.PI / 2;
  flag.castShadow = true;
  flag.receiveShadow = true;
  // Store flag for animation
  (boatGroup as any).flag = flag;
  boatGroup.add(flag);
  
  // Life preservers (3 of them)
  const preserverGeometry = new THREE.TorusGeometry(0.6, 0.2, 8, 16);
  const preserverMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff, // White
    roughness: 0.7,
    metalness: 0.1
  });
  
  // Red stripes for life preservers
  const redStripeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xe74c3c, // Bright red
    roughness: 0.7,
    metalness: 0.1
  });
  
  // Create a function to add red stripes to life preservers
  const createLifePreserver = (x: number, y: number, z: number): THREE.Group => {
    const preserverGroup = new THREE.Group();
    
    // Main white ring
    const ring = new THREE.Mesh(preserverGeometry, preserverMaterial);
    ring.castShadow = true;
    ring.receiveShadow = true;
    preserverGroup.add(ring);
    
    // Add red stripes (smaller torus rings at 90 degree angles)
    const stripeGeometry = new THREE.TorusGeometry(0.6, 0.05, 8, 16);
    
    // Vertical stripe
    const verticalStripe = new THREE.Mesh(stripeGeometry, redStripeMaterial);
    verticalStripe.rotation.y = Math.PI / 2;
    verticalStripe.castShadow = true;
    verticalStripe.receiveShadow = true;
    preserverGroup.add(verticalStripe);
    
    // Horizontal stripe
    const horizontalStripe = new THREE.Mesh(stripeGeometry, redStripeMaterial);
    horizontalStripe.castShadow = true;
    horizontalStripe.receiveShadow = true;
    preserverGroup.add(horizontalStripe);
    
    // Position the entire group
    preserverGroup.position.set(x, y, z);
    preserverGroup.rotation.y = Math.PI / 2;
    
    return preserverGroup;
  };
  
  // Left side preservers
  const leftPreserver1 = createLifePreserver(3.75, 3, 0);
  boatGroup.add(leftPreserver1);
  
  const leftPreserver2 = createLifePreserver(3.75, 3, 3);
  boatGroup.add(leftPreserver2);
  
  // Right side preserver
  const rightPreserver = createLifePreserver(-3.75, 3, 0);
  boatGroup.add(rightPreserver);
  
  // Add rudder
  const rudderGeometry = new THREE.BoxGeometry(0.5, 2, 3);
  const rudderMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x7f8c8d, // Gray
    roughness: 0.7,
    metalness: 0.3
  });
  const rudder = new THREE.Mesh(rudderGeometry, rudderMaterial);
  rudder.position.y = 0;
  rudder.position.z = 10;
  rudder.castShadow = true;
  rudder.receiveShadow = true;
  // Store rudder for animation
  (boatGroup as any).rudder = rudder;
  boatGroup.add(rudder);
  
  // Create water splash particles
  const splashCount = 20;
  const splashGroup = new THREE.Group();
  const splashGeometry = new THREE.SphereGeometry(0.2, 4, 4);
  const splashMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xadd8e6, // Light blue color for water
    transparent: true,
    opacity: 0.7
  });
  
  for (let i = 0; i < splashCount; i++) {
    const splash = new THREE.Mesh(splashGeometry, splashMaterial.clone());
    splash.visible = false;
    // Store initial position and velocity for animation
    (splash as any).velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      Math.random() * 5 + 2,
      (Math.random() - 0.5) * 2
    );
    (splash as any).life = 0;
    (splash as any).maxLife = Math.random() * 1 + 0.5;
    splashGroup.add(splash);
  }
  
  // Create additional smaller splash droplets for more realistic effect
  const dropletCount = 30;
  const dropletGeometry = new THREE.SphereGeometry(0.1, 3, 3);
  const dropletMaterial = new THREE.MeshBasicMaterial({
    color: 0xd4f1f9, // Very light blue, almost white
    transparent: true,
    opacity: 0.6
  });
  
  for (let i = 0; i < dropletCount; i++) {
    const droplet = new THREE.Mesh(dropletGeometry, dropletMaterial.clone());
    droplet.visible = false;
    // Store initial position and velocity for animation
    (droplet as any).velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 3,
      Math.random() * 7 + 3, // Higher initial velocity for droplets
      (Math.random() - 0.5) * 3
    );
    (droplet as any).life = 0;
    (droplet as any).maxLife = Math.random() * 0.8 + 0.3; // Shorter lifespan
    splashGroup.add(droplet);
  }
  
  // Position splash at the front and sides of the boat
  splashGroup.position.z = -10; // Front of boat
  splashGroup.position.y = 0;
  // Store splash group for animation
  (boatGroup as any).splashGroup = splashGroup;
  boatGroup.add(splashGroup);
  
  // Create a second splash group for the sides/wake of the boat
  const wakeGroup = new THREE.Group();
  
  // Clone the splash particles for the wake
  for (let i = 0; i < 15; i++) {
    const wakeSplash = new THREE.Mesh(splashGeometry, splashMaterial.clone());
    wakeSplash.visible = false;
    (wakeSplash as any).velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      Math.random() * 3 + 1, // Lower height for wake
      (Math.random() - 0.5) * 2
    );
    (wakeSplash as any).life = 0;
    (wakeSplash as any).maxLife = Math.random() * 1.2 + 0.8; // Longer life for wake
    wakeGroup.add(wakeSplash);
  }
  
  // Position wake at the sides/back of the boat
  wakeGroup.position.z = 5; // Back of boat
  wakeGroup.position.y = 0;
  // Store wake group for animation
  (boatGroup as any).wakeGroup = wakeGroup;
  boatGroup.add(wakeGroup);
  
  return boatGroup;
}; 