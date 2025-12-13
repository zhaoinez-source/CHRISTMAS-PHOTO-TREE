import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/+esm";
import { useStore, GestureType, TreeState } from '../store';

let handLandmarker: HandLandmarker | undefined;
let video: HTMLVideoElement | null = null;
let lastVideoTime = -1;
let requestRef: number;

export const initGestureRecognition = async (videoElement: HTMLVideoElement) => {
  video = videoElement;
  
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numHands: 1
  });

  useStore.getState().setCameraReady(true);
  predict();
};

const predict = () => {
  if (!handLandmarker || !video) return;

  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    const results = handLandmarker.detectForVideo(video, performance.now());

    if (results.landmarks && results.landmarks.length > 0) {
      const landmarks = results.landmarks[0];
      processGestures(landmarks);
    } else {
      useStore.getState().setGesture(GestureType.NONE);
      // Reset parallax drift if no hand
      useStore.getState().setParallax(0, 0);
    }
  }

  requestRef = requestAnimationFrame(predict);
};

const processGestures = (landmarks: any[]) => {
  const { setGesture, setTreeState, selectRandomPhoto, deselectPhoto, setParallax, treeState, selectedPhoto } = useStore.getState();

  // 1. Parallax Mapping (Palm Center - Index 0 or 9)
  // Map x [0,1] to [-1, 1]. Note: Webcam is mirrored usually, flip X.
  const palmX = 1 - landmarks[9].x; 
  const palmY = 1 - landmarks[9].y; 
  setParallax((palmX - 0.5) * 2, (palmY - 0.5) * 2);

  // 2. Gesture Detection Logic
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  
  const wrist = landmarks[0];

  // Calculate distance between thumb and index for PINCH
  const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
  
  // Check open/closed fingers (Distance from tip to wrist vs knuckle to wrist is robust)
  // Simple heuristic: Are tips above knuckles? (Assuming hand is upright-ish, but distance check is rotation invariant)
  // Let's use compactness: Distance of tips to wrist.
  
  const isFingerExtended = (tipIdx: number, knuckleIdx: number) => {
    const dTip = Math.hypot(landmarks[tipIdx].x - wrist.x, landmarks[tipIdx].y - wrist.y);
    const dKnuckle = Math.hypot(landmarks[knuckleIdx].x - wrist.x, landmarks[knuckleIdx].y - wrist.y);
    return dTip > dKnuckle * 1.2; // Significant extension
  };

  const indexOpen = isFingerExtended(8, 5);
  const middleOpen = isFingerExtended(12, 9);
  const ringOpen = isFingerExtended(16, 13);
  const pinkyOpen = isFingerExtended(20, 17);

  // Detect States
  
  // PINCH: Index and Thumb close, others can be whatever (often open)
  if (pinchDist < 0.05) {
     if (useStore.getState().gesture !== GestureType.PINCH) {
        setGesture(GestureType.PINCH);
        if (treeState === TreeState.CHAOS && !selectedPhoto) {
           selectRandomPhoto();
        }
     }
  } 
  // FIST: All fingers curled/not extended
  else if (!indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
    if (useStore.getState().gesture !== GestureType.FIST) {
       setGesture(GestureType.FIST);
       setTreeState(TreeState.FORMED);
       deselectPhoto();
    }
  }
  // OPEN: All fingers extended
  else if (indexOpen && middleOpen && ringOpen && pinkyOpen) {
    if (useStore.getState().gesture !== GestureType.OPEN) {
       setGesture(GestureType.OPEN);
       setTreeState(TreeState.CHAOS);
       deselectPhoto();
    }
  } else {
    setGesture(GestureType.NONE);
  }
};

export const stopGestureRecognition = () => {
  cancelAnimationFrame(requestRef);
  handLandmarker?.close();
  video = null;
};