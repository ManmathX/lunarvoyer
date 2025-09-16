import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useEffect } from "react";
import { KeyboardControls } from "@react-three/drei";
import "@fontsource/inter";
import SpaceGame from "./components/SpaceGame";
import MissionUI from "./components/MissionUI";

// WebGL compatibility check
function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
}

// Define control keys for spacecraft
const controls = [
  { name: "prograde", keys: ["KeyW", "ArrowUp"] },
  { name: "retrograde", keys: ["KeyS", "ArrowDown"] },
  { name: "normal", keys: ["KeyA", "ArrowLeft"] },
  { name: "antinormal", keys: ["KeyD", "ArrowRight"] },
  { name: "radial", keys: ["KeyQ"] },
  { name: "antiradial", keys: ["KeyE"] },
  { name: "burn", keys: ["Space"] },
  { name: "warp", keys: ["KeyT"] },
];

function App() {
  const [webGLSupported, setWebGLSupported] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const supported = checkWebGLSupport();
      setWebGLSupported(supported);
      if (!supported) {
        setError("WebGL is not supported or available in this environment");
      }
    } catch (err) {
      setWebGLSupported(false);
      setError("Error checking WebGL support");
    }
  }, []);

  // WebGL error boundary
  const onCanvasError = (error: any) => {
    console.error("Canvas/WebGL Error:", error);
    setError("WebGL context creation failed. The 3D space game requires WebGL support.");
    setWebGLSupported(false);
  };

  // Fallback UI when WebGL is not available
  if (webGLSupported === false) {
    return (
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #000000 100%)',
        color: 'white',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div style={{ maxWidth: '600px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🚀 Space Mission Planning Game</h1>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.1)', 
            padding: '20px', 
            borderRadius: '10px',
            marginBottom: '2rem'
          }}>
            <h2 style={{ color: '#ff6b6b', marginBottom: '1rem' }}>WebGL Not Available</h2>
            <p style={{ marginBottom: '1rem' }}>{error}</p>
            <p>This 3D space mission planning game requires WebGL for orbital mechanics visualization.</p>
          </div>
          
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            padding: '20px', 
            borderRadius: '10px',
            textAlign: 'left'
          }}>
            <h3 style={{ marginBottom: '1rem' }}>🎮 Game Features (requires WebGL):</h3>
            <ul style={{ lineHeight: '1.8' }}>
              <li>• Realistic orbital mechanics with semi-major axis, eccentricity, and inclination</li>
              <li>• 3D visualization of Earth, Moon, and spacecraft trajectories</li>
              <li>• Fuel management using the Tsiolkovsky rocket equation</li>
              <li>• Hazard systems including radiation storms and orbital debris</li>
              <li>• Interactive mission planning with keyboard controls</li>
              <li>• Scoring based on fuel efficiency and mission safety</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (webGLSupported === null) {
    return (
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #000000 100%)',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>🚀 Loading Space Mission Game...</h2>
          <p>Checking WebGL compatibility...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      <Canvas
          shadows={false} // Disable shadows for better compatibility
          camera={{
            position: [0, 0, 50],
            fov: 60,
            near: 0.1,
            far: 10000
          }}
          gl={{
            antialias: false, // Disable antialiasing for better compatibility
            powerPreference: "default", // Use default power preference
            alpha: true,
            preserveDrawingBuffer: false,
            failIfMajorPerformanceCaveat: false
          }}
          onError={onCanvasError}
          fallback={
            <div style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: '#000008',
              color: 'white'
            }}>
              <div style={{ textAlign: 'center' }}>
                <h2>🚀 Space Mission Game</h2>
                <p>WebGL initialization failed. Retrying...</p>
              </div>
            </div>
          }
        >
          <color attach="background" args={["#000008"]} />
          
          {/* Simplified lighting for better compatibility */}
          <ambientLight intensity={0.3} />
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={0.8}
          />
          
          <Suspense fallback={null}>
            <KeyboardControls map={controls}>
              <SpaceGame />
            </KeyboardControls>
          </Suspense>
        </Canvas>
        
        <MissionUI />
    </div>
  );
}

export default App;
