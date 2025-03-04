import * as THREE from 'three';

/**
 * Creates a simple boat model with a hull, deck, and wheel
 * @returns THREE.Group containing the boat model
 */
export const createBoat = (): THREE.Group => {
  // Create a group to hold all boat parts
  const boat = new THREE.Group();
  
  // Create the hull (bottom part of the boat)
  const hullGeometry = new THREE.BoxGeometry(10, 3, 25);
  const hullMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8B4513, // Brown
    roughness: 0.7,
    metalness: 0.2
  });
  const hull = new THREE.Mesh(hullGeometry, hullMaterial);
  hull.position.y = -1; // Position hull below deck
  hull.castShadow = true;
  hull.receiveShadow = true;
  
  // Create the deck (top part of the boat)
  const deckGeometry = new THREE.BoxGeometry(8, 1, 20);
  const deckMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xD2B48C, // Tan
    roughness: 0.5,
    metalness: 0.1
  });
  const deck = new THREE.Mesh(deckGeometry, deckMaterial);
  deck.position.y = 0.5; // Position deck above hull
  deck.castShadow = true;
  deck.receiveShadow = true;
  
  // Create a cabin
  const cabinGeometry = new THREE.BoxGeometry(6, 3, 8);
  const cabinMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xD2B48C, // Tan
    roughness: 0.6,
    metalness: 0.1
  });
  const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
  cabin.position.set(0, 2, -4); // Position cabin on deck
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  
  // Create a wheel for steering
  const wheelGeometry = new THREE.TorusGeometry(1, 0.1, 16, 32);
  const wheelMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8B4513, // Brown
    roughness: 0.5,
    metalness: 0.3
  });
  const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  wheel.position.set(0, 2, 5); // Position wheel at front of boat
  wheel.rotation.x = Math.PI / 2; // Rotate to be vertical
  wheel.castShadow = true;
  
  // Create wheel spokes
  for (let i = 0; i < 4; i++) {
    const spokeGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2);
    const spoke = new THREE.Mesh(spokeGeometry, wheelMaterial);
    spoke.rotation.z = (Math.PI / 4) * i;
    wheel.add(spoke);
  }
  
  // Create a rudder
  const rudderGeometry = new THREE.BoxGeometry(0.5, 2, 3);
  const rudder = new THREE.Mesh(rudderGeometry, hullMaterial);
  rudder.position.set(0, -1, 10); // Position at back of boat
  rudder.castShadow = true;
  
  // Store references to interactive parts
  (boat as any).wheel = wheel;
  (boat as any).rudder = rudder;
  
  // Add all parts to the boat group
  boat.add(hull);
  boat.add(deck);
  boat.add(cabin);
  boat.add(wheel);
  boat.add(rudder);
  
  return boat;
}; 