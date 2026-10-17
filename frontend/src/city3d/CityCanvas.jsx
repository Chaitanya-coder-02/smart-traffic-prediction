import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, Environment } from '@react-three/drei'
import CityScene from './CityScene'

export default function CityCanvas({ congestionLevel = 'Low', onLoad }) {
  return (
    <Canvas
      shadows
      camera={{ position: [18, 14, 18], fov: 50 }}
      style={{ background: 'transparent' }}
      onCreated={onLoad}
    >
      <Suspense fallback={null}>
        <Stars radius={80} depth={40} count={2000} factor={3} fade speed={0.5} />
        <Environment preset="night" />
        <CityScene congestionLevel={congestionLevel} />
        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          minDistance={8}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 2, 0]}
        />
      </Suspense>
    </Canvas>
  )
}
