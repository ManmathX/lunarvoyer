import { Position3D } from "./orbitalMechanics";

export interface Hazard {
  id: string;
  type: 'radiation' | 'debris' | 'perturbation';
  position: Position3D;
  velocity?: Position3D;
  radius: number;
  intensity: number;
  duration: number;
  timeRemaining: number;
}

export interface RadiationStorm extends Hazard {
  type: 'radiation';
  kpIndex: number; // Geomagnetic activity index
}

export interface OrbitalDebris extends Hazard {
  type: 'debris';
  velocity: Position3D;
  mass: number;
}

export interface Perturbation extends Hazard {
  type: 'perturbation';
  force: Position3D; // Force in RTN frame
}

// Generate random hazards
export function generateRandomHazards(count: number, gameTime: number): Hazard[] {
  const hazards: Hazard[] = [];
  
  for (let i = 0; i < count; i++) {
    const type = Math.random() < 0.5 ? 'radiation' : 'debris';
    const id = `${type}_${gameTime}_${i}`;
    
    if (type === 'radiation') {
      hazards.push({
        id,
        type: 'radiation',
        position: {
          x: (Math.random() - 0.5) * 40 + (Math.random() > 0.5 ? 20 : -20),
          y: (Math.random() - 0.5) * 40,
          z: (Math.random() - 0.5) * 40
        },
        radius: 1 + Math.random() * 3,
        intensity: Math.random() * 100,
        duration: 60 + Math.random() * 300, // 1-6 minutes
        timeRemaining: 60 + Math.random() * 300,
        kpIndex: 5 + Math.random() * 4 // Kp 5-9
      } as RadiationStorm);
    } else {
      hazards.push({
        id,
        type: 'debris',
        position: {
          x: (Math.random() - 0.5) * 30 + (Math.random() > 0.5 ? 15 : -15),
          y: (Math.random() - 0.5) * 30,
          z: (Math.random() - 0.5) * 30
        },
        velocity: {
          x: (Math.random() - 0.5) * 10,
          y: (Math.random() - 0.5) * 10,
          z: (Math.random() - 0.5) * 10
        },
        radius: 0.5 + Math.random() * 2,
        intensity: 1,
        duration: Infinity,
        timeRemaining: Infinity,
        mass: 1 + Math.random() * 100
      } as OrbitalDebris);
    }
  }
  
  return hazards;
}

// Update hazards over time
export function updateHazards(hazards: Hazard[], deltaTime: number): Hazard[] {
  return hazards.map(hazard => {
    // Update time remaining
    const newTimeRemaining = hazard.timeRemaining - deltaTime;
    
    // Move debris
    if (hazard.type === 'debris' && hazard.velocity) {
      const newPosition = {
        x: hazard.position.x + hazard.velocity.x * deltaTime,
        y: hazard.position.y + hazard.velocity.y * deltaTime,
        z: hazard.position.z + hazard.velocity.z * deltaTime
      };
      
      return {
        ...hazard,
        position: newPosition,
        timeRemaining: newTimeRemaining
      };
    }
    
    return {
      ...hazard,
      timeRemaining: newTimeRemaining
    };
  }).filter(hazard => hazard.timeRemaining > 0); // Remove expired hazards
}

// Check collision with spacecraft
export function checkHazardCollision(spacecraftPosition: Position3D, hazards: Hazard[]): Hazard[] {
  return hazards.filter(hazard => {
    const distance = Math.sqrt(
      (spacecraftPosition.x - hazard.position.x) ** 2 +
      (spacecraftPosition.y - hazard.position.y) ** 2 +
      (spacecraftPosition.z - hazard.position.z) ** 2
    );
    
    return distance <= hazard.radius;
  });
}

// Calculate radiation dose based on Van Allen belt formulas
export function calculateRadiationDose(position: Position3D, hazards: Hazard[]): number {
  let totalDose = 0;
  
  hazards.forEach(hazard => {
    if (hazard.type === 'radiation') {
      const distance = Math.sqrt(
        (position.x - hazard.position.x) ** 2 +
        (position.y - hazard.position.y) ** 2 +
        (position.z - hazard.position.z) ** 2
      );
      
      if (distance <= hazard.radius) {
        // D = ∫Φ(E)S(E)dE (simplified)
        const intensity = hazard.intensity;
        const falloff = Math.max(0, 1 - distance / hazard.radius);
        totalDose += intensity * falloff;
      }
    }
  });
  
  return totalDose;
}

// Check if geomagnetic storm is active (Kp ≥ 7)
export function isGeromagneticStormActive(hazards: Hazard[]): boolean {
  return hazards.some(hazard => 
    hazard.type === 'radiation' && 
    (hazard as RadiationStorm).kpIndex >= 7
  );
}

// Calculate collision probability (simplified)
export function calculateCollisionProbability(spacecraftPosition: Position3D, spacecraftVelocity: Position3D, debris: OrbitalDebris): number {
  // Simplified collision probability calculation
  // In reality, this would involve complex statistical analysis
  
  const relativeVelocity = {
    x: spacecraftVelocity.x - (debris.velocity?.x || 0),
    y: spacecraftVelocity.y - (debris.velocity?.y || 0),
    z: spacecraftVelocity.z - (debris.velocity?.z || 0)
  };
  
  const relativeSpeed = Math.sqrt(
    relativeVelocity.x ** 2 + 
    relativeVelocity.y ** 2 + 
    relativeVelocity.z ** 2
  );
  
  const distance = Math.sqrt(
    (spacecraftPosition.x - debris.position.x) ** 2 +
    (spacecraftPosition.y - debris.position.y) ** 2 +
    (spacecraftPosition.z - debris.position.z) ** 2
  );
  
  // Higher probability for closer debris and higher relative speeds
  const baseProbability = 1 / (1 + distance);
  const speedFactor = Math.min(1, relativeSpeed / 10);
  
  return baseProbability * speedFactor;
}
