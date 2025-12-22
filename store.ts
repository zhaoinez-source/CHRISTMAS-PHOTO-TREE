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
  url: string; // Now stores Base64 data for persistence
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
  removePhoto: (id: string) => void;
  selectRandomPhoto: () => void;
  deselectPhoto: () => void;
  setCameraReady: (ready: boolean) => void;
}

const STORAGE_KEY = 'grand_tree_memories_v1';

export const useStore = create<AppState>((set, get) => {
  // Load initial photos from localStorage
  const savedPhotos = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

  return {
    treeState: TreeState.FORMED,
    targetProgress: 1,
    gesture: GestureType.NONE,
    parallax: { x: 0, y: 0 },
    photos: savedPhotos,
    selectedPhoto: null,
    cameraReady: false,

    setTreeState: (treeState) => set({ 
      treeState, 
      targetProgress: treeState === TreeState.FORMED ? 1 : 0 
    }),
    
    setGesture: (gesture) => set({ gesture }),
    
    setParallax: (x, y) => set({ parallax: { x, y } }),
    
    addPhoto: (url) => {
      const newPhoto = { id: Math.random().toString(36).substr(2, 9), url };
      set((state) => {
        const updatedPhotos = [...state.photos, newPhoto];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPhotos));
        return { photos: updatedPhotos };
      });
    },

    removePhoto: (id) => {
      set((state) => {
        const updatedPhotos = state.photos.filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPhotos));
        return { 
          photos: updatedPhotos,
          selectedPhoto: state.selectedPhoto?.id === id ? null : state.selectedPhoto
        };
      });
    },

    selectRandomPhoto: () => {
      const { photos, selectedPhoto } = get();
      if (photos.length === 0 || selectedPhoto) return;
      
      const random = photos[Math.floor(Math.random() * photos.length)];
      set({ selectedPhoto: random });
    },

    deselectPhoto: () => set({ selectedPhoto: null }),
    
    setCameraReady: (cameraReady) => set({ cameraReady }),
  };
});