import { useFrame } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import { Group, Vector3 } from "three";
import { OrbitControls, Sphere, Text } from "@react-three/drei";
import { useSpaceGame } from "../lib/stores/useSpaceGame";
import { updateOrbitalMotion } from "../lib/orbitalMechanics";
import { updateHazards } from "../lib/hazards";
import SpacecraftControls from "./SpacecraftControls";
import OrbitVisualizer from "./OrbitVisualizer";

export default function SpaceGame() {
  const groupRef = useRef<Group>(null);
  const {
    spacecraft,
    earth,
    moon,
    hazards,
    gameTime,
    timeWarp,
    updateSpacecraft,
    updateGameTime,
    updateHazards: updateGameHazards
  } = useSpaceGame();

  useFrame((state, delta) => {
    const SIMULATION_SPEED = 20; // amplify time to make motion visible
    const adjustedDelta = delta * timeWarp * SIMULATION_SPEED;
    const newTime = gameTime + adjustedDelta;
    
    // Update spacecraft orbital motion
    const newSpacecraft = updateOrbitalMotion(spacecraft, earth, adjustedDelta, moon);
    updateSpacecraft(newSpacecraft);
    
    // Update hazards
    const newHazards = updateHazards(hazards, adjustedDelta);
    updateGameHazards(newHazards);
    
    // Update game time
    updateGameTime(newTime);
  });

  return (
    <group ref={groupRef}>
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxDistance={200}
        minDistance={5}
      />
      
      {/* Earth */}
      <group position={[earth.position.x, earth.position.y, earth.position.z]}>
        <Sphere args={[earth.radius]} receiveShadow>
          <meshLambertMaterial color="#4a90e2" />
        </Sphere>
        <Text
          position={[0, earth.radius + 2, 0]}
          fontSize={1}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          Earth
        </Text>
      </group>

      {/* Moon */}
      <group position={[moon.position.x, moon.position.y, moon.position.z]}>
        <Sphere args={[moon.radius]} receiveShadow>
          <meshLambertMaterial color="#c0c0c0" />
        </Sphere>
        <Text
          position={[0, moon.radius + 1, 0]}
          fontSize={0.8}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          Moon
        </Text>
      </group>

      {/* Spacecraft (satellite) */}
      <group position={[spacecraft.position.x, spacecraft.position.y, spacecraft.position.z]}>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.5, 1]} />
          <meshLambertMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
        </mesh>
        {/* Thrust visualization */}
        {spacecraft.isBurning && (
          <mesh position={[0, 0, -0.8]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.2, 1, 8]} />
            <meshBasicMaterial color="#ffaa00" transparent opacity={0.8} />
          </mesh>
        )}
      </group>

      {/* Hazards */}
      {hazards.map((hazard: any, index: number) => (
        <group key={index} position={[hazard.position.x, hazard.position.y, hazard.position.z]}>
          {hazard.type === 'radiation' && (
            <mesh>
              <sphereGeometry args={[hazard.radius, 16, 16]} />
              <meshBasicMaterial color="#ff0000" transparent opacity={0.3} />
            </mesh>
          )}
          {hazard.type === 'debris' && (
            <mesh>
              <boxGeometry args={[0.3, 0.3, 0.3]} />
              <meshLambertMaterial color="#666666" />
            </mesh>
          )}
        </group>
      ))}

      {/* Orbit visualization */}
      <OrbitVisualizer spacecraft={spacecraft} earth={earth} />
      
      {/* Spacecraft controls */}
      <SpacecraftControls />
    </group>
  );
}
