import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Foliage } from './Foliage';
import { Ornaments } from './Ornaments';
import { Polaroids } from './Polaroids';
import { useStore } from '../store';
import { TREE_HEIGHT } from '../utils/math';

const CameraController = () => {
  const parallax = useStore((state) => state.parallax);
  useFrame(({ camera }) => {
    // Smooth camera parallax based on hand position
    // Center interaction around y=0
    const targetX = parallax.x * 5;
    const targetY = parallax.y * 5; 
    
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.05);
    camera.lookAt(0, 0, 0); // Look at the center of the tree
  });
  return null;
};

export const Experience: React.FC = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 26], fov: 45 }} // Moved back to fit height
      gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}
      shadows
    >
      <color attach="background" args={['#050505']} />
      
      <CameraController />
      
      {/* Centered Tree Group */}
      <group position={[0, 0, 0]}>
        <Foliage />
        
        {/* Luxury Gold Baubles */}
        <Ornaments count={200} type="bauble" color="#D4AF37" scale={0.4} />
        {/* Emerald Baubles */}
        <Ornaments count={150} type="bauble" color="#00594C" scale={0.3} />
        {/* Red Accent Gifts */}
        <Ornaments count={50} type="gift" color="#C41E3A" scale={0.6} />
        {/* Glowing Lights */}
        <Ornaments count={300} type="light" color="#FFD700" scale={0.15} emissive />

        <Polaroids />
        
        {/* Floor Reflection at the base of the tree (-Height/2) */}
        <ContactShadows position={[0, -TREE_HEIGHT/2, 0]} opacity={0.5} scale={30} blur={2} far={10} resolution={256} color="#000000" />
      </group>

      <Environment preset="lobby" background={false} />
      
      {/* Cinematic Lighting */}
      <ambientLight intensity={0.2} />
      <spotLight position={[10, 20, 10]} angle={0.3} penumbra={1} intensity={2} castShadow color="#FFD700" />
      <pointLight position={[-10, 5, 10]} intensity={1} color="#C41E3A" />

      <EffectComposer disableNormalPass>
        <Bloom 
            luminanceThreshold={0.8} 
            mipmapBlur 
            intensity={1.2} 
            radius={0.6}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  );
};