import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Position3D, Velocity3D, OrbitalElements, EARTH_RADIUS, MU_EARTH } from "../orbitalMechanics";
import { Hazard, generateRandomHazards } from "../hazards";

export interface CelestialBody {
  position: Position3D;
  radius: number;
  mass: number;
  mu: number; // Standard gravitational parameter
}

export interface Spacecraft {
  position: Position3D;
  velocity: Velocity3D;
  mass: number;
  fuel: number;
  maxFuel: number;
  maxMass: number;
  orbitalElements: OrbitalElements;
  isBurning: boolean;
}

export interface MissionEvent {
  time: number;
  type: 'burn' | 'hazard' | 'milestone';
  description: string;
  deltaV?: number;
}

interface SpaceGameState {
  // Game objects
  spacecraft: Spacecraft;
  earth: CelestialBody;
  moon: CelestialBody;
  hazards: Hazard[];
  
  // Game state
  gameTime: number;
  timeWarp: number;
  missionEvents: MissionEvent[];
  score: number;
  
  // Actions
  updateSpacecraft: (spacecraft: Spacecraft) => void;
  updateGameTime: (time: number) => void;
  updateHazards: (hazards: Hazard[]) => void;
  addMissionEvent: (event: MissionEvent) => void;
  toggleTimeWarp: () => void;
  resetMission: () => void;
}

// Initial spacecraft in Low Earth Orbit
// Using visualization scale (Earth radius ~6.37 units)
const VISUALIZATION_SCALE = 1000; // 1 unit = 1000 km
const earthVisRadius = EARTH_RADIUS / VISUALIZATION_SCALE;
const spacecraftAltitude = 300 / VISUALIZATION_SCALE; // 300km -> 0.3 units

const initialSpacecraft: Spacecraft = {
  position: { x: 0, y: 0, z: earthVisRadius + spacecraftAltitude }, // 300km altitude in visualization scale
  // Reduce initial orbital speed to slow the satellite visually
  velocity: { x: 0.0039, y: 0, z: 0 }, // half speed for clearer visibility
  mass: 1000, // kg
  fuel: 500, // kg
  maxFuel: 500,
  maxMass: 1000,
  orbitalElements: {
    semiMajorAxis: earthVisRadius + spacecraftAltitude,
    eccentricity: 0.01,
    inclination: 0.1, // ~6 degrees
    longitudeOfAscendingNode: 0,
    argumentOfPeriapsis: 0,
    trueAnomaly: 0,
    meanAnomaly: 0,
    altitude: spacecraftAltitude * VISUALIZATION_SCALE // Keep altitude in km for UI
  },
  isBurning: false
};

const initialEarth: CelestialBody = {
  position: { x: 0, y: 0, z: 0 },
  radius: earthVisRadius, // Scaled down for visualization
  mass: 5.972e24,
  mu: MU_EARTH / (VISUALIZATION_SCALE * VISUALIZATION_SCALE * VISUALIZATION_SCALE) // Scale mu for visualization units
};

const initialMoon: CelestialBody = {
  position: { x: 60, y: 0, z: 0 }, // Simplified moon position
  radius: 1.737, // Moon radius in visualization scale
  mass: 7.342e22,
  // Scale Moon mu to visualization units (similar scale used for Earth mu above)
  mu: 4902.7779 / (VISUALIZATION_SCALE * VISUALIZATION_SCALE * VISUALIZATION_SCALE)
};

export const useSpaceGame = create<SpaceGameState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    spacecraft: initialSpacecraft,
    earth: initialEarth,
    moon: initialMoon,
    hazards: generateRandomHazards(5, 0),
    gameTime: 0,
    timeWarp: 2,
    missionEvents: [],
    score: 1000,
    
    // Actions
    updateSpacecraft: (spacecraft) => {
      set({ spacecraft: { ...spacecraft, isBurning: false } });
      
      // Update score based on fuel efficiency
      const fuelEfficiency = spacecraft.fuel / spacecraft.maxFuel;
      const newScore = 1000 * fuelEfficiency;
      set({ score: newScore });
    },
    
    updateGameTime: (time) => set({ gameTime: time }),
    
    updateHazards: (hazards) => set({ hazards }),
    
    addMissionEvent: (event) => {
      const { missionEvents } = get();
      set({ missionEvents: [...missionEvents, event] });
    },
    
    toggleTimeWarp: () => {
      const { timeWarp } = get();
      // Limit max time warp to slow overall simulation speed for visibility
      const newTimeWarp = timeWarp === 1 ? 2 : 1;
      set({ timeWarp: newTimeWarp });
    },
    
    resetMission: () => {
      set({
        spacecraft: { ...initialSpacecraft },
        gameTime: 0,
        timeWarp: 1,
        missionEvents: [],
        score: 1000,
        hazards: generateRandomHazards(5, 0)
      });
    }
  }))
);

// Subscribe to spacecraft changes to detect mission milestones
useSpaceGame.subscribe(
  (state) => state.spacecraft,
  (spacecraft) => {
    const { moon, addMissionEvent } = useSpaceGame.getState();
    
    // Check if reached moon's sphere of influence
    const distanceToMoon = Math.sqrt(
      (spacecraft.position.x - moon.position.x) ** 2 +
      (spacecraft.position.y - moon.position.y) ** 2 +
      (spacecraft.position.z - moon.position.z) ** 2
    );
    
    if (distanceToMoon < 10) { // Within 10 units of moon
      addMissionEvent({
        time: Date.now(),
        type: 'milestone',
        description: 'Entered Moon\'s sphere of influence!'
      });
    }
    
    // Check for low fuel warning
    if (spacecraft.fuel < 100 && spacecraft.fuel > 0) {
      addMissionEvent({
        time: Date.now(),
        type: 'hazard',
        description: 'Low fuel warning!'
      });
    }
  }
);
