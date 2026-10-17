import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Congestion → color mapping
const CONGESTION_COLORS = {
  Low:        '#22c55e',
  Moderate:   '#eab308',
  High:       '#f97316',
  'Very High':'#ef4444',
}

// ── Building ────────────────────────────────────────────────────────────────
function Building({ position, height, width = 1, depth = 1, color = '#0d1b3e' }) {
  return (
    <mesh position={[position[0], height / 2, position[1]]} castShadow receiveShadow>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.05}
        metalness={0.3} roughness={0.7} />
    </mesh>
  )
}

// ── Windows on a building (instanced planes) ─────────────────────────────
function BuildingWindows({ position, height, width, depth }) {
  const rows = Math.floor(height / 1.5)
  const cols = Math.floor(width / 0.6)
  return (
    <group position={[position[0], 0, position[1]]}>
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <mesh key={`${r}-${c}`}
            position={[
              position[0] - width / 2 + 0.3 + c * 0.6,
              1 + r * 1.5,
              position[1] + depth / 2 + 0.01,
            ]}>
            <planeGeometry args={[0.25, 0.5]} />
            <meshStandardMaterial
              color={Math.random() > 0.3 ? '#fde68a' : '#1e3a5f'}
              emissive={Math.random() > 0.3 ? '#fde68a' : '#000'}
              emissiveIntensity={Math.random() > 0.3 ? 0.8 : 0}
            />
          </mesh>
        ))
      )}
    </group>
  )
}

// ── Animated Car ──────────────────────────────────────────────────────────
function Car({ startPos, direction, speed, color, laneOffset = 0 }) {
  const ref = useRef()
  const progress = useRef(Math.random())
  const trackLength = 28

  useFrame((_, delta) => {
    progress.current = (progress.current + delta * speed) % 1
    const t = progress.current * trackLength - trackLength / 2
    if (ref.current) {
      if (direction === 'x') {
        ref.current.position.set(t, 0.2, startPos + laneOffset)
        ref.current.rotation.y = Math.PI / 2
      } else {
        ref.current.position.set(startPos + laneOffset, 0.2, t)
        ref.current.rotation.y = 0
      }
    }
  })

  return (
    <group ref={ref}>
      {/* Body */}
      <mesh castShadow>
        <boxGeometry args={[1.4, 0.4, 0.7]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.15}
          metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.8, 0.35, 0.6]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Headlights */}
      <pointLight position={[0.7, 0, 0]} intensity={0.4} distance={3} color="#fffde7" />
    </group>
  )
}

// ── Traffic Light ─────────────────────────────────────────────────────────
function TrafficLight({ position, phase = 0 }) {
  const ref = useRef()
  const timer = useRef(phase)
  const lights = useRef({ r: true, g: false })

  useFrame((_, delta) => {
    timer.current += delta
    if (timer.current > 4) {
      timer.current = 0
      lights.current = { r: !lights.current.r, g: !lights.current.g }
    }
  })

  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2.5, 8]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      {/* Box */}
      <mesh position={[0, 2.7, 0]}>
        <boxGeometry args={[0.2, 0.5, 0.2]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      {/* Red */}
      <mesh position={[0, 2.85, 0.11]}>
        <circleGeometry args={[0.07, 12]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={lights.current.r ? 2 : 0.1} />
      </mesh>
      {/* Green */}
      <mesh position={[0, 2.6, 0.11]}>
        <circleGeometry args={[0.07, 12]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={lights.current.g ? 2 : 0.1} />
      </mesh>
    </group>
  )
}

// ── Road ─────────────────────────────────────────────────────────────────
function Road({ position, rotation = [0, 0, 0], length = 28, width = 4, congestionColor }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Asphalt */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>
      {/* Centre dashes */}
      {Array.from({ length: 13 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.01, -length / 2 + 1 + i * 2]}>
          <planeGeometry args={[0.1, 0.8]} />
          <meshStandardMaterial color={congestionColor} emissive={congestionColor} emissiveIntensity={0.6} />
        </mesh>
      ))}
      {/* Lane edges */}
      {[-width / 2 + 0.05, width / 2 - 0.05].map((x, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, 0]}>
          <planeGeometry args={[0.08, length]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
        </mesh>
      ))}
    </group>
  )
}

// ── Streetlight ───────────────────────────────────────────────────────────
function Streetlight({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 3, 8]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      <mesh position={[0.3, 3.1, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.6, 8]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      <pointLight position={[0.3, 3.2, 0]} intensity={0.6} distance={6} color="#fde68a" />
    </group>
  )
}

// ── Ground ────────────────────────────────────────────────────────────────
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[60, 60]} />
      <meshStandardMaterial color="#060d23" roughness={1} />
    </mesh>
  )
}

// ── Main City Scene ───────────────────────────────────────────────────────
export default function CityScene({ congestionLevel = 'Low' }) {
  const roadColor = CONGESTION_COLORS[congestionLevel] || CONGESTION_COLORS['Low']

  // Speed modifier: more congestion = slower cars
  const speedMap = { Low: 1.0, Moderate: 0.65, High: 0.4, 'Very High': 0.2 }
  const carSpeed = speedMap[congestionLevel] || 1.0

  // Count modifier: more congestion = more cars
  const countMap = { Low: 4, Moderate: 8, High: 12, 'Very High': 16 }
  const carCount = countMap[congestionLevel] || 4

  const CAR_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

  const buildings = useMemo(() => [
    // Block A — left
    { pos: [-10, -8], h: 8, w: 2.5, d: 2.5 },
    { pos: [-7, -8], h: 12, w: 2, d: 2 },
    { pos: [-10, -4], h: 6, w: 3, d: 3 },
    { pos: [-7, -4], h: 10, w: 2.5, d: 2.5 },
    { pos: [-10, 2], h: 14, w: 2, d: 2 },
    { pos: [-7, 2], h: 7, w: 3, d: 2.5 },
    { pos: [-10, 7], h: 5, w: 2.5, d: 2.5 },
    { pos: [-7, 7], h: 9, w: 2, d: 2.5 },
    // Block B — right
    { pos: [7, -8], h: 11, w: 2.5, d: 2 },
    { pos: [10, -8], h: 7, w: 2, d: 2.5 },
    { pos: [7, -4], h: 15, w: 2, d: 2 },
    { pos: [10, -4], h: 8, w: 2.5, d: 2.5 },
    { pos: [7, 2], h: 6, w: 3, d: 2.5 },
    { pos: [10, 2], h: 13, w: 2, d: 2 },
    { pos: [7, 7], h: 10, w: 2, d: 2.5 },
    { pos: [10, 7], h: 5, w: 3, d: 2 },
  ], [])

  const cars = useMemo(() =>
    Array.from({ length: carCount }).map((_, i) => ({
      id: i,
      direction: i % 2 === 0 ? 'x' : 'z',
      startPos: i % 2 === 0
        ? (i % 4 === 0 ? 1 : -2)
        : (i % 4 === 1 ? 1 : -2),
      laneOffset: (i % 3 - 1) * 0.8,
      speed: (0.04 + Math.random() * 0.03) * carSpeed,
      color: CAR_COLORS[i % CAR_COLORS.length],
    })), [carCount, carSpeed])

  return (
    <>
      {/* Lights */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 20, 10]} intensity={0.5} castShadow
        shadow-mapSize={[1024, 1024]} color="#a0c4ff" />
      <pointLight position={[0, 15, 0]} intensity={0.4} color="#22d3ee" distance={40} />
      <hemisphereLight skyColor="#060d23" groundColor="#0d1b3e" intensity={0.5} />

      <Ground />

      {/* Roads */}
      <Road position={[0, 0, 0]} length={28} width={4} congestionColor={roadColor} />
      <Road position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]} length={28} width={4} congestionColor={roadColor} />

      {/* Intersection fill */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>

      {/* Buildings */}
      {buildings.map((b, i) => (
        <Building key={i} position={b.pos} height={b.h} width={b.w} depth={b.d}
          color={i % 3 === 0 ? '#0f2557' : i % 3 === 1 ? '#0d1b3e' : '#091329'} />
      ))}

      {/* Traffic lights */}
      <TrafficLight position={[2.5, 0, 2.5]} phase={0} />
      <TrafficLight position={[-2.5, 0, 2.5]} phase={2} />
      <TrafficLight position={[2.5, 0, -2.5]} phase={2} />
      <TrafficLight position={[-2.5, 0, -2.5]} phase={0} />

      {/* Streetlights */}
      {[-10, -5, 5, 10].map(x =>
        [-10, -5, 5, 10].map(z => (
          <Streetlight key={`${x}-${z}`} position={[x, 0, z]} />
        ))
      )}

      {/* Cars */}
      {cars.map(car => (
        <Car key={car.id}
          startPos={car.startPos}
          direction={car.direction}
          speed={car.speed}
          color={car.color}
          laneOffset={car.laneOffset}
        />
      ))}
    </>
  )
}
