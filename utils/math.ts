import * as THREE from 'three';

export const TREE_HEIGHT = 18;
export const TREE_RADIUS_BASE = 6;
export const CHAOS_RADIUS = 25;

// Generate a position on a cone (The Tree)
export const getTreePosition = (ratio: number, angle: number): THREE.Vector3 => {
  const y = (ratio * TREE_HEIGHT) - (TREE_HEIGHT / 2);
  // Radius decreases as we go up
  const r = TREE_RADIUS_BASE * (1 - ratio);
  const x = r * Math.cos(angle);
  const z = r * Math.sin(angle);
  return new THREE.Vector3(x, y, z);
};

// Generate a random position in a sphere (Chaos)
export const getChaosPosition = (): THREE.Vector3 => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = CHAOS_RADIUS * Math.cbrt(Math.random());
  
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);
  
  return new THREE.Vector3(x, y, z);
};

// Helper for spiral distribution
export const getSpiralPosition = (i: number, count: number) => {
  const ratio = i / count;
  const angle = i * 2.5; // Golden angle approx for aesthetic spiral
  return getTreePosition(ratio, angle);
}