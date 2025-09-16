import { useSpaceGame } from "../lib/stores/useSpaceGame";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";

export default function MissionUI() {
  const { 
    spacecraft, 
    moon, 
    timeWarp, 
    missionEvents, 
    score,
    resetMission 
  } = useSpaceGame();

  // Calculate distance to moon
  const distanceToMoon = Math.sqrt(
    Math.pow(spacecraft.position.x - moon.position.x, 2) +
    Math.pow(spacecraft.position.y - moon.position.y, 2) +
    Math.pow(spacecraft.position.z - moon.position.z, 2)
  );

  // Calculate mission progress (closer to moon = higher progress)
  const maxDistance = 100; // Maximum expected distance
  const progress = Math.max(0, Math.min(100, (maxDistance - distanceToMoon) / maxDistance * 100));

  return (
    <div className="absolute top-4 left-4 space-y-4 z-10">
      {/* Mission Status */}
      <Card className="w-80 bg-black/80 text-white border-gray-600">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Mission Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-400">Altitude:</span>
              <br />
              <span className="font-mono">{spacecraft.orbitalElements.altitude.toFixed(1)} km</span>
            </div>
            <div>
              <span className="text-gray-400">Velocity:</span>
              <br />
              <span className="font-mono">{Math.sqrt(
                spacecraft.velocity.x ** 2 + 
                spacecraft.velocity.y ** 2 + 
                spacecraft.velocity.z ** 2
              ).toFixed(2)} km/s</span>
            </div>
            <div>
              <span className="text-gray-400">Eccentricity:</span>
              <br />
              <span className="font-mono">{spacecraft.orbitalElements.eccentricity.toFixed(3)}</span>
            </div>
            <div>
              <span className="text-gray-400">Inclination:</span>
              <br />
              <span className="font-mono">{(spacecraft.orbitalElements.inclination * 180 / Math.PI).toFixed(1)}°</span>
            </div>
          </div>
          
          <div>
            <span className="text-gray-400 text-sm">Distance to Moon:</span>
            <br />
            <span className="font-mono text-lg">{distanceToMoon.toFixed(1)} km</span>
          </div>
          
          <div>
            <span className="text-gray-400 text-sm">Mission Progress:</span>
            <Progress value={progress} className="mt-1" />
          </div>
        </CardContent>
      </Card>

      {/* Spacecraft Status */}
      <Card className="w-80 bg-black/80 text-white border-gray-600">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Spacecraft</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Fuel</span>
              <span className="font-mono">{spacecraft.fuel.toFixed(1)} kg</span>
            </div>
            <Progress value={(spacecraft.fuel / spacecraft.maxFuel) * 100} className="mt-1" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Mass</span>
              <span className="font-mono">{spacecraft.mass.toFixed(1)} kg</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Time Warp</span>
            <Badge variant={timeWarp > 1 ? "default" : "secondary"}>
              {timeWarp}x
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card className="w-80 bg-black/80 text-white border-gray-600">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm space-y-1">
            <div><kbd className="bg-gray-700 px-1 rounded">WASD</kbd> - Burn Direction</div>
            <div><kbd className="bg-gray-700 px-1 rounded">Q/E</kbd> - Radial Burns</div>
            <div><kbd className="bg-gray-700 px-1 rounded">SPACE</kbd> - Execute Burn</div>
            <div><kbd className="bg-gray-700 px-1 rounded">T</kbd> - Time Warp</div>
          </div>
          <Button 
            onClick={resetMission} 
            variant="outline" 
            size="sm" 
            className="w-full mt-2"
          >
            Reset Mission
          </Button>
        </CardContent>
      </Card>

      {/* Score */}
      <Card className="w-80 bg-black/80 text-white border-gray-600">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-mono">{score.toFixed(0)}</div>
          <div className="text-sm text-gray-400">
            Efficiency: {((1000 - (1000 - spacecraft.fuel) * 2) / 10).toFixed(0)}%
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      {missionEvents.length > 0 && (
        <Card className="w-80 bg-black/80 text-white border-gray-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Mission Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {missionEvents.slice(-5).reverse().map((event, index) => (
                <div key={index} className="text-xs">
                  <span className="text-gray-400">[{new Date(event.time).toLocaleTimeString()}]</span>
                  <br />
                  <span>{event.description}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
