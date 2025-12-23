import React, { useRef } from 'react';
import { Experience } from './components/Experience';
import { CameraFeed } from './components/CameraFeed';
import { useStore, GestureType, TreeState } from './store';

const GestureFeedback: React.FC = () => {
  const gesture = useStore((state) => state.gesture);
  const treeState = useStore((state) => state.treeState);

  let text = "WAITING...";
  let color = "text-gray-500";
  let icon = "";

  if (gesture === GestureType.FIST) {
    text = "ORDER RESTORED";
    color = "text-[#D4AF37]";
    icon = "✊";
  } else if (gesture === GestureType.OPEN) {
    text = "CHAOS RELEASED";
    color = "text-[#C41E3A]";
    icon = "🖐";
  } else if (gesture === GestureType.PINCH) {
    text = "MEMORY GRABBED";
    color = "text-blue-400";
    icon = "👌";
  } else {
    // Fallback status
    if (treeState === TreeState.FORMED) {
      text = "GRAND TREE FORMED";
      color = "text-emerald-400";
    } else {
      text = "PARTICLES SCATTERED";
      color = "text-orange-400";
    }
  }

  return (
    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center pointer-events-none z-40">
      <div className={`text-6xl mb-2 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]`}>{icon}</div>
      <h1 className={`text-2xl font-luxury tracking-[0.3em] font-bold ${color} drop-shadow-md border-b-2 border-opacity-50 pb-2 border-current inline-block`}>
        {text}
      </h1>
    </div>
  );
};

const UploadButton: React.FC = () => {
  const photos = useStore((state) => state.photos);
  const addPhoto = useStore((state) => state.addPhoto);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressAndAdd = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Use JPEG compression (0.7) to significantly reduce Base64 string size
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        addPhoto(compressedBase64);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (photos.length >= 30) {
        alert("Memory capacity reached (Max 30). Please delete a memory to add a new one.");
        return;
      }
      compressAndAdd(e.target.files[0]);
    }
  };

  return (
    <div className="absolute bottom-8 right-8 z-50 pointer-events-auto flex flex-col items-end gap-2">
      <div className="text-[#D4AF37] font-luxury text-[10px] tracking-widest opacity-60">
        CAPACITY: {photos.length} / 30
      </div>
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
      <button 
        onClick={() => fileInputRef.current?.click()}
        className="bg-[#023020] text-[#D4AF37] border border-[#D4AF37] px-6 py-3 font-luxury tracking-widest hover:bg-[#D4AF37] hover:text-[#023020] transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)]"
      >
        ADD POLAROID MEMORY
      </button>
    </div>
  );
}

const SelectedPhotoActions: React.FC = () => {
  const selectedPhoto = useStore((state) => state.selectedPhoto);
  const removePhoto = useStore((state) => state.removePhoto);
  const deselectPhoto = useStore((state) => state.deselectPhoto);

  if (!selectedPhoto) return null;

  return (
    <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex gap-4">
        <button 
          onClick={() => deselectPhoto()}
          className="bg-black/80 text-[#D4AF37] border border-[#D4AF37]/50 px-6 py-2 font-luxury text-sm tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all"
        >
          BACK TO TREE
        </button>
        <button 
          onClick={() => removePhoto(selectedPhoto.id)}
          className="bg-[#C41E3A]/20 text-[#C41E3A] border border-[#C41E3A] px-6 py-2 font-luxury text-sm tracking-widest hover:bg-[#C41E3A] hover:text-white transition-all shadow-[0_0_15px_rgba(196,30,58,0.3)]"
        >
          DELETE MEMORY
        </button>
      </div>
    </div>
  );
};

const Instructions: React.FC = () => {
    return (
        <div className="absolute bottom-8 left-8 z-40 text-[#D4AF37] font-serif text-sm bg-black/40 p-4 border-l-2 border-[#D4AF37] backdrop-blur-sm max-w-xs">
            <h3 className="font-bold mb-2 uppercase tracking-widest">Controls</h3>
            <ul className="space-y-1 opacity-80">
                <li><span className="font-bold">✊ Fist:</span> Restore Order (Build Tree)</li>
                <li><span className="font-bold">🖐 Open Palm:</span> Release Chaos (Explode)</li>
                <li><span className="font-bold">👌 Pinch:</span> Grab Memory (In Chaos)</li>
                <li><span className="font-bold">👋 Move Hand:</span> Parallax View</li>
            </ul>
        </div>
    )
}

function App() {
  return (
    <div className="relative w-full h-screen bg-black">
      <CameraFeed />
      <GestureFeedback />
      <UploadButton />
      <SelectedPhotoActions />
      <Instructions />
      
      <div className="absolute inset-0 z-0">
        <Experience />
      </div>
      
      {/* Vignette Overlay for extra cinematic feel */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_50%,rgba(0,0,0,0.8)_100%)]"></div>
    </div>
  );
}

export default App;