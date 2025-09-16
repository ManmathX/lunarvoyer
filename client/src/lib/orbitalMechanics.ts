// Orbital mechanics calculations based on the provided formulas

export interface OrbitalElements {
  semiMajorAxis: number;    // a - Size of the orbit (km)
  eccentricity: number;     // e - Shape of orbit (0=circle, 0<e<1 ellipse)
  inclination: number;      // i - Tilt of orbit wrt equator (radians)
  longitudeOfAscendingNode: number;  // Ω - Where orbit crosses equator northward (radians)
  argumentOfPeriapsis: number;       // ω - Orientation of closest approach (radians)
  trueAnomaly: number;      // ν - Current position angle in orbit (radians)
  meanAnomaly: number;      // M - Average position (radians)
  altitude: number;         // Current altitude above surface (km)
}

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Velocity3D {
  x: number;
  y: number;
  z: number;
}

// Standard gravitational parameters
export const MU_EARTH = 398600.4418; // km³/s²
export const MU_MOON = 4902.7779;    // km³/s²
export const EARTH_RADIUS = 6371;    // km
export const MOON_RADIUS = 1737;     // km

// Calculate orbital velocity using vis-viva equation
export function calculateOrbitalVelocity(r: number, a: number, mu: number): number {
  // v = sqrt(μ(2/r - 1/a))
  return Math.sqrt(mu * (2 / r - 1 / a));
}

// Calculate orbital energy
export function calculateOrbitalEnergy(velocity: Velocity3D, position: Position3D, mu: number): number {
  const v = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
  const r = Math.sqrt(position.x ** 2 + position.y ** 2 + position.z ** 2);
  // E = v²/2 - μ/r
  return (v ** 2) / 2 - mu / r;
}

// Calculate specific angular momentum
export function calculateAngularMomentum(position: Position3D, velocity: Velocity3D): Position3D {
  // h = r × v
  return {
    x: position.y * velocity.z - position.z * velocity.y,
    y: position.z * velocity.x - position.x * velocity.z,
    z: position.x * velocity.y - position.y * velocity.x
  };
}

// Convert orbital elements to Cartesian coordinates
export function orbitalElementsToCartesian(elements: OrbitalElements, mu: number): { position: Position3D, velocity: Velocity3D } {
  const { semiMajorAxis: a, eccentricity: e, inclination: i, longitudeOfAscendingNode: Omega, argumentOfPeriapsis: omega, trueAnomaly: nu } = elements;
  
  // Calculate distance from focus
  const r = a * (1 - e * e) / (1 + e * Math.cos(nu));
  
  // Position in orbital plane
  const x_orb = r * Math.cos(nu);
  const y_orb = r * Math.sin(nu);
  
  // Velocity in orbital plane
  const h = Math.sqrt(mu * a * (1 - e * e));
  const vx_orb = -mu / h * Math.sin(nu);
  const vy_orb = mu / h * (e + Math.cos(nu));
  
  // Rotation matrices for 3D transformation
  const cosOmega = Math.cos(Omega);
  const sinOmega = Math.sin(Omega);
  const cosOmega_l = Math.cos(omega);
  const sinOmega_l = Math.sin(omega);
  const cosI = Math.cos(i);
  const sinI = Math.sin(i);
  
  // Transform to 3D coordinates
  const position: Position3D = {
    x: x_orb * (cosOmega * cosOmega_l - sinOmega * sinOmega_l * cosI) - y_orb * (cosOmega * sinOmega_l + sinOmega * cosOmega_l * cosI),
    y: x_orb * (sinOmega * cosOmega_l + cosOmega * sinOmega_l * cosI) - y_orb * (sinOmega * sinOmega_l - cosOmega * cosOmega_l * cosI),
    z: x_orb * (sinOmega_l * sinI) + y_orb * (cosOmega_l * sinI)
  };
  
  const velocity: Velocity3D = {
    x: vx_orb * (cosOmega * cosOmega_l - sinOmega * sinOmega_l * cosI) - vy_orb * (cosOmega * sinOmega_l + sinOmega * cosOmega_l * cosI),
    y: vx_orb * (sinOmega * cosOmega_l + cosOmega * sinOmega_l * cosI) - vy_orb * (sinOmega * sinOmega_l - cosOmega * cosOmega_l * cosI),
    z: vx_orb * (sinOmega_l * sinI) + vy_orb * (cosOmega_l * sinI)
  };
  
  return { position, velocity };
}

// Convert Cartesian coordinates to orbital elements
export function cartesianToOrbitalElements(position: Position3D, velocity: Velocity3D, mu: number): OrbitalElements {
  const r = Math.sqrt(position.x ** 2 + position.y ** 2 + position.z ** 2);
  const v = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
  
  // Angular momentum
  const h_vec = calculateAngularMomentum(position, velocity);
  const h = Math.sqrt(h_vec.x ** 2 + h_vec.y ** 2 + h_vec.z ** 2);
  
  // Semi-major axis
  const energy = calculateOrbitalEnergy(velocity, position, mu);
  const a = -mu / (2 * energy);
  
  // Eccentricity
  const e = Math.sqrt(1 + (2 * energy * h ** 2) / (mu ** 2));
  
  // Inclination
  const i = Math.acos(h_vec.z / h);
  
  // Longitude of ascending node
  const n_x = -h_vec.y;
  const n_y = h_vec.x;
  const n = Math.sqrt(n_x ** 2 + n_y ** 2);
  let Omega = 0;
  if (n > 0) {
    Omega = Math.acos(n_x / n);
    if (n_y < 0) Omega = 2 * Math.PI - Omega;
  }
  
  // True anomaly (simplified)
  const nu = Math.atan2(
    (position.x * velocity.x + position.y * velocity.y + position.z * velocity.z) / Math.sqrt(mu),
    r - mu / (v ** 2 * r)
  );
  
  // Approximate other elements
  const omega = 0; // Simplified
  const M = nu; // Simplified (assuming circular orbit for mean anomaly)
  
  return {
    semiMajorAxis: a,
    eccentricity: e,
    inclination: i,
    longitudeOfAscendingNode: Omega,
    argumentOfPeriapsis: omega,
    trueAnomaly: nu,
    meanAnomaly: M,
    altitude: r - EARTH_RADIUS
  };
}

// Update orbital motion over time
export function updateOrbitalMotion(spacecraft: any, earth: any, deltaTime: number, moon?: any): any {
  const elements = spacecraft.orbitalElements;
  // Use scaled mu from state to control simulation speed/scale
  const mu = earth.mu ?? MU_EARTH;
  
  // Calculate mean motion (n = sqrt(μ/a³))
  const n = Math.sqrt(mu / Math.pow(elements.semiMajorAxis, 3));
  
  // Update mean anomaly
  const newMeanAnomaly = elements.meanAnomaly + n * deltaTime;
  
  // Solve Kepler's equation (simplified)
  // M = E - e*sin(E)
  let E = newMeanAnomaly; // Initial guess
  for (let i = 0; i < 5; i++) {
    E = newMeanAnomaly + elements.eccentricity * Math.sin(E);
  }
  
  // Calculate true anomaly from eccentric anomaly
  const nu = 2 * Math.atan2(
    Math.sqrt(1 + elements.eccentricity) * Math.sin(E / 2),
    Math.sqrt(1 - elements.eccentricity) * Math.cos(E / 2)
  );
  
  // Update orbital elements
  const newElements = {
    ...elements,
    meanAnomaly: newMeanAnomaly,
    trueAnomaly: nu
  };
  
  // Convert to Cartesian coordinates around Earth
  const { position, velocity } = orbitalElementsToCartesian(newElements, mu);

  // Apply a perturbation from the Moon's gravity if provided
  if (moon && typeof moon.mu === "number") {
    const dx = moon.position.x - position.x;
    const dy = moon.position.y - position.y;
    const dz = moon.position.z - position.z;
    const r2 = dx * dx + dy * dy + dz * dz;
    const r = Math.sqrt(r2) || 1e-6;
    const accelFactor = moon.mu / (r2 * r); // = mu / r^3
    const ax = accelFactor * dx;
    const ay = accelFactor * dy;
    const az = accelFactor * dz;

    // Semi-implicit Euler step for small perturbation
    velocity.x += ax * deltaTime;
    velocity.y += ay * deltaTime;
    velocity.z += az * deltaTime;
    position.x += velocity.x * deltaTime;
    position.y += velocity.y * deltaTime;
    position.z += velocity.z * deltaTime;
  }
  
  return {
    ...spacecraft,
    position,
    velocity,
    orbitalElements: {
      ...newElements,
      altitude: Math.sqrt(position.x ** 2 + position.y ** 2 + position.z ** 2) - EARTH_RADIUS
    }
  };
}

// Calculate orbit points for visualization
export function calculateOrbitPoints(elements: OrbitalElements, earth: any, numPoints: number = 64): Position3D[] {
  const points: Position3D[] = [];
  const mu = MU_EARTH;
  
  for (let i = 0; i < numPoints; i++) {
    const nu = (2 * Math.PI * i) / numPoints;
    const tempElements = { ...elements, trueAnomaly: nu };
    const { position } = orbitalElementsToCartesian(tempElements, mu);
    points.push(position);
  }
  
  return points;
}

// Calculate Hohmann transfer delta-v
export function calculateHohmannTransfer(r1: number, r2: number, mu: number): { deltaV1: number, deltaV2: number } {
  // Δv₁ = √(μ/r₁) * (√(2r₂/(r₁+r₂)) - 1)
  const deltaV1 = Math.sqrt(mu / r1) * (Math.sqrt(2 * r2 / (r1 + r2)) - 1);
  
  // Δv₂ = √(μ/r₂) * (1 - √(2r₁/(r₁+r₂)))
  const deltaV2 = Math.sqrt(mu / r2) * (1 - Math.sqrt(2 * r1 / (r1 + r2)));
  
  return { deltaV1, deltaV2 };
}
