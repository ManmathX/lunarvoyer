import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { Vector3 } from "three";
import { Spacecraft, CelestialBody } from "../lib/stores/useSpaceGame";
import { calculateOrbitPoints } from "../lib/orbitalMechanics";

interface OrbitVisualizerProps {
  spacecraft: Spacecraft;
  earth: CelestialBody;
}

export default function OrbitVisualizer({ spacecraft, earth }: OrbitVisualizerProps) {
  const orbitPoints = useMemo(() => {
    return calculateOrbitPoints(spacecraft.orbitalElements, earth, 64);
  }, [spacecraft.orbitalElements, earth]);

  const points = orbitPoints.map((point: any) => new Vector3(point.x, point.y, point.z));

  return (
    <Line
      points={points}
      color="#00ff88"
      lineWidth={2}
      transparent
      opacity={0.6}
    />
  );
}
