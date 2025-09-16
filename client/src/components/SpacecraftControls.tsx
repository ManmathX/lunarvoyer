import { useKeyboardControls } from "@react-three/drei";
import { useEffect } from "react";
import { useSpaceGame } from "../lib/stores/useSpaceGame";
import { calculateDeltaV, applyBurn } from "../lib/spacecraft";

enum Controls {
  prograde = 'prograde',
  retrograde = 'retrograde',
  normal = 'normal',
  antinormal = 'antinormal',
  radial = 'radial',
  antiradial = 'antiradial',
  burn = 'burn',
  warp = 'warp',
}

export default function SpacecraftControls() {
  const [subscribe, getState] = useKeyboardControls<Controls>();
  const { 
    spacecraft, 
    updateSpacecraft, 
    toggleTimeWarp, 
    addMissionEvent 
  } = useSpaceGame();

  useEffect(() => {
    const unsubscribeBurn = subscribe(
      state => state.burn,
      (pressed) => {
        if (pressed && spacecraft.fuel > 0) {
          console.log("Burn initiated");
          const controls = getState();
          let burnDirection = { x: 0, y: 0, z: 0 };
          
          // Determine burn direction based on controls
          if (controls.prograde) burnDirection.z = 1;
          if (controls.retrograde) burnDirection.z = -1;
          if (controls.normal) burnDirection.y = 1;
          if (controls.antinormal) burnDirection.y = -1;
          if (controls.radial) burnDirection.x = 1;
          if (controls.antiradial) burnDirection.x = -1;
          
          // Default to prograde if no direction specified
          if (burnDirection.x === 0 && burnDirection.y === 0 && burnDirection.z === 0) {
            burnDirection.z = 1;
          }
          
          // Apply burn
          const burnResult = applyBurn(spacecraft, burnDirection, 1.0); // 1 m/s delta-v
          updateSpacecraft(burnResult.spacecraft);
          
          addMissionEvent({
            time: Date.now(),
            type: 'burn',
            description: `Burn: ${burnResult.deltaV.toFixed(2)} m/s, Fuel: ${burnResult.spacecraft.fuel.toFixed(1)} kg`,
            deltaV: burnResult.deltaV
          });
        }
      }
    );

    const unsubscribeWarp = subscribe(
      state => state.warp,
      (pressed) => {
        if (pressed) {
          console.log("Time warp toggled");
          toggleTimeWarp();
        }
      }
    );

    return () => {
      unsubscribeBurn();
      unsubscribeWarp();
    };
  }, [subscribe, getState, spacecraft, updateSpacecraft, toggleTimeWarp, addMissionEvent]);

  return null;
}
