import { create } from 'zustand';

export enum TreeState {
  CHAOS = 'CHAOS',
  FORMED = 'FORMED',
}

export enum GestureType {
  NONE = 'NONE',
  FIST = 'FIST', // Form
  OPEN = 'OPEN', // Explode
  PINCH = 'PINCH', // Grab Photo
}

interface PhotoData {
  id: string;
  url: string;
  texture?: any; // THREE.Texture
}

interface AppState {
  treeState: TreeState;
  targetProgress: number; // 0 = Chaos, 1 = Formed
  gesture: GestureType;
  parallax: { x: number; y: number };
  photos: PhotoData[];
  selectedPhoto: PhotoData | null;
  cameraReady: boolean;
  
  setTreeState: (state: TreeState) => void;
  setGesture: (gesture: GestureType) => void;
  setParallax: (x: number, y: number) => void;
  addPhoto: (url: string) => void;
  selectRandomPhoto: () => void;
  deselectPhoto: () => void;
  setCameraReady: (ready: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  treeState: TreeState.FORMED,
  targetProgress: 1,
  gesture: GestureType.NONE,
  parallax: { x: 0, y: 0 },
  photos: [],
  selectedPhoto: null,
  cameraReady: false,

  setTreeState: (treeState) => set({ 
    treeState, 
    targetProgress: treeState === TreeState.FORMED ? 1 : 0 
  }),
  
  setGesture: (gesture) => set({ gesture }),
  
  setParallax: (x, y) => set({ parallax: { x, y } }),
  
  addPhoto: (url) => set((state) => ({
    photos: [...state.photos, { id: Math.random().toString(36).substr(2, 9), url }]
  })),

  selectRandomPhoto: () => {
    const { photos, selectedPhoto, treeState } = get();
    // Only allow grabbing if in chaos mode (exploded) or if desired
    if (photos.length === 0 || selectedPhoto) return;
    
    const random = photos[Math.floor(Math.random() * photos.length)];
    set({ selectedPhoto: random });
  },

  deselectPhoto: () => set({ selectedPhoto: null }),
  
  setCameraReady: (cameraReady) => set({ cameraReady }),
}));