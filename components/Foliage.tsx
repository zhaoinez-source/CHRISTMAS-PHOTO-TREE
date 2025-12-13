import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { getTreePosition, getChaosPosition, getSpiralPosition } from '../utils/math';

const FoliageShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uProgress: { value: 1 }, // 0 = Chaos, 1 = Tree
    uColor1: { value: new THREE.Color('#003311') }, // Dark Emerald
    uColor2: { value: new THREE.Color('#00594C') }, // Light Emerald
    uColorGold: { value: new THREE.Color('#D4AF37') },
  },
  vertexShader: `
    uniform float uTime;
    uniform float uProgress;
    attribute vec3 chaosPos;
    attribute vec3 treePos;
    attribute float aRandom;
    
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      // Cubic ease out for smooth snap
      float p = 1.0 - pow(1.0 - uProgress, 3.0);
      
      vec3 pos = mix(chaosPos, treePos, p);
      
      // Add subtle wind/breathing effect
      float wind = sin(uTime * 2.0 + pos.y * 0.5 + aRandom * 10.0) * 0.1;
      pos.x += wind * (1.0 - p); // More wind in chaos
      pos.x += wind * 0.05 * p;  // Slight shimmer in tree

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size attenuation
      gl_PointSize = (4.0 * aRandom + 2.0) * (30.0 / -mvPosition.z);

      // Color mix based on depth and gold sparkles
      float goldChance = step(0.95, aRandom);
      vec3 baseColor = mix(uColor1, uColor2, pos.y / 20.0 + 0.5);
      // Gold highlights bloom intensely
      vColor = mix(baseColor, uColorGold, goldChance);
      vAlpha = 1.0;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      // Circular particle
      vec2 coord = gl_PointCoord - vec2(0.5);
      if(length(coord) > 0.5) discard;
      
      gl_FragColor = vec4(vColor, vAlpha);
    }
  `
};

export const Foliage: React.FC = () => {
  const COUNT = 15000;
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const targetProgress = useStore((state) => state.targetProgress);
  const currentProgress = useRef(1);

  const [chaosPositions, treePositions, randoms] = useMemo(() => {
    const chaos = new Float32Array(COUNT * 3);
    const tree = new Float32Array(COUNT * 3);
    const rnd = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      // Tree Shape (Spiral)
      const tPos = getSpiralPosition(i, COUNT);
      // Add slight jitter to needles so they aren't perfectly on the spiral line
      tPos.x += (Math.random() - 0.5) * 1.5;
      tPos.z += (Math.random() - 0.5) * 1.5;
      tPos.y += (Math.random() - 0.5) * 0.5;

      tree[i * 3] = tPos.x;
      tree[i * 3 + 1] = tPos.y;
      tree[i * 3 + 2] = tPos.z;

      // Chaos Shape
      const cPos = getChaosPosition();
      chaos[i * 3] = cPos.x;
      chaos[i * 3 + 1] = cPos.y;
      chaos[i * 3 + 2] = cPos.z;

      rnd[i] = Math.random();
    }
    return [chaos, tree, rnd];
  }, []);

  useFrame((state, delta) => {
    // Lerp progress for smooth transition
    currentProgress.current = THREE.MathUtils.damp(
        currentProgress.current, 
        targetProgress, 
        2.5, 
        delta
    );

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uProgress.value = currentProgress.current;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={COUNT} array={treePositions} itemSize={3} />
        <bufferAttribute attach="attributes-chaosPos" count={COUNT} array={chaosPositions} itemSize={3} />
        <bufferAttribute attach="attributes-treePos" count={COUNT} array={treePositions} itemSize={3} />
        <bufferAttribute attach="attributes-aRandom" count={COUNT} array={randoms} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        attach="material"
        args={[FoliageShaderMaterial]}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};