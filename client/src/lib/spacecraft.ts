import { Position3D, Velocity3D, OrbitalElements, cartesianToOrbitalElements, MU_EARTH } from "./orbitalMechanics";

export interface BurnResult {
  spacecraft: any;
  deltaV: number;
  fuelUsed: number;
}

// Tsiolkovsky rocket equation: Δv = ve * ln(mi/mf)
export function calculateDeltaV(initialMass: number, finalMass: number, specificImpulse: number): number {
  const exhaustVelocity = specificImpulse * 9.81; // Convert Isp to exhaust velocity
  return exhaustVelocity * Math.log(initialMass / finalMass);
}

// Calculate fuel consumption from delta-v
export function calculateFuelConsumption(deltaV: number, mass: number, specificImpulse: number): number {
  const exhaustVelocity = specificImpulse * 9.81;
  const massRatio = Math.exp(deltaV / exhaustVelocity);
  return mass * (massRatio - 1) / massRatio;
}

// Apply burn to spacecraft
export function applyBurn(spacecraft: any, burnDirection: Position3D, deltaVMagnitude: number): BurnResult {
  // Normalize burn direction
  const magnitude = Math.sqrt(burnDirection.x ** 2 + burnDirection.y ** 2 + burnDirection.z ** 2);
  if (magnitude === 0) {
    return { spacecraft, deltaV: 0, fuelUsed: 0 };
  }
  
  const normalizedDirection = {
    x: burnDirection.x / magnitude,
    y: burnDirection.y / magnitude,
    z: burnDirection.z / magnitude
  };
  
  // Calculate fuel consumption
  const specificImpulse = 300; // seconds (typical for chemical rockets)
  const fuelUsed = calculateFuelConsumption(deltaVMagnitude, spacecraft.mass, specificImpulse);
  
  // Check if enough fuel available
  if (fuelUsed > spacecraft.fuel) {
    const availableDeltaV = calculateDeltaV(spacecraft.mass, spacecraft.mass - spacecraft.fuel, specificImpulse);
    const actualFuelUsed = spacecraft.fuel;
    const actualDeltaV = availableDeltaV;
    
    // Apply limited burn
    const newVelocity = {
      x: spacecraft.velocity.x + normalizedDirection.x * actualDeltaV / 1000, // Convert m/s to km/s
      y: spacecraft.velocity.y + normalizedDirection.y * actualDeltaV / 1000,
      z: spacecraft.velocity.z + normalizedDirection.z * actualDeltaV / 1000
    };
    
    const newMass = spacecraft.mass - actualFuelUsed;
    const newFuel = 0;
    
    // Recalculate orbital elements
    const newOrbitalElements = cartesianToOrbitalElements(spacecraft.position, newVelocity, MU_EARTH);
    
    return {
      spacecraft: {
        ...spacecraft,
        velocity: newVelocity,
        mass: newMass,
        fuel: newFuel,
        orbitalElements: newOrbitalElements,
        isBurning: true
      },
      deltaV: actualDeltaV,
      fuelUsed: actualFuelUsed
    };
  }
  
  // Apply full burn
  const newVelocity = {
    x: spacecraft.velocity.x + normalizedDirection.x * deltaVMagnitude / 1000, // Convert m/s to km/s
    y: spacecraft.velocity.y + normalizedDirection.y * deltaVMagnitude / 1000,
    z: spacecraft.velocity.z + normalizedDirection.z * deltaVMagnitude / 1000
  };
  
  const newMass = spacecraft.mass - fuelUsed;
  const newFuel = spacecraft.fuel - fuelUsed;
  
  // Recalculate orbital elements
  const newOrbitalElements = cartesianToOrbitalElements(spacecraft.position, newVelocity, MU_EARTH);
  
  return {
    spacecraft: {
      ...spacecraft,
      velocity: newVelocity,
      mass: newMass,
      fuel: newFuel,
      orbitalElements: newOrbitalElements,
      isBurning: true
    },
    deltaV: deltaVMagnitude,
    fuelUsed
  };
}

// Calculate spacecraft performance metrics
export function calculatePerformanceMetrics(spacecraft: any): {
  efficiency: number;
  fuelRatio: number;
  totalDeltaV: number;
} {
  const fuelUsed = spacecraft.maxFuel - spacecraft.fuel;
  const fuelRatio = spacecraft.fuel / spacecraft.maxFuel;
  const efficiency = 1 - (fuelUsed / spacecraft.maxFuel);
  
  // Estimate total delta-v used
  const totalDeltaV = calculateDeltaV(spacecraft.maxMass, spacecraft.mass, 300);
  
  return {
    efficiency,
    fuelRatio,
    totalDeltaV
  };
}

// Check if spacecraft can reach target with available fuel
export function canReachTarget(spacecraft: any, targetPosition: Position3D): boolean {
  const distance = Math.sqrt(
    (spacecraft.position.x - targetPosition.x) ** 2 +
    (spacecraft.position.y - targetPosition.y) ** 2 +
    (spacecraft.position.z - targetPosition.z) ** 2
  );
  
  // Rough estimate: assume direct trajectory needs ~sqrt(distance) m/s delta-v
  const estimatedDeltaV = Math.sqrt(distance * 1000); // Very rough approximation
  const maxDeltaV = calculateDeltaV(spacecraft.mass, spacecraft.mass - spacecraft.fuel, 300);
  
  return maxDeltaV >= estimatedDeltaV;
}
