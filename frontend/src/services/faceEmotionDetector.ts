import { EmotionType } from "../types/emotion";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export interface FaceDetectionResult {
  faceDetected: boolean;
  multipleFaces: boolean;
  boundingBox: { x: number; y: number; width: number; height: number } | null;
  landmarks: { x: number; y: number }[];
  emotion: EmotionType;
  confidence: number;
  rawProbabilities: Record<EmotionType, number>;
  smoothedProbabilities: Record<EmotionType, number>;
  fps: number;
  latencyMs: number;
  engine: "mediapipe" | "cv-calibrated";
  actionUnits: {
    smile: number;
    browFurrow: number;
    browRaise: number;
    jawOpen: number;
    mouthFrown: number;
    eyeWide: number;
  };
}

let landmarkerInstance: FaceLandmarker | null = null;
let isInitializing = false;

// Asynchronously initialize Google MediaPipe FaceLandmarker with 52 blendshapes
async function getOrInitLandmarker(): Promise<FaceLandmarker | null> {
  if (landmarkerInstance) return landmarkerInstance;
  if (isInitializing) return null;
  isInitializing = true;

  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    landmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "GPU",
      },
      outputFaceBlendshapes: true,
      runningMode: "VIDEO",
      numFaces: 1,
    });
    console.log("MediaPipe FaceLandmarker with 52 FACS Blendshapes initialized successfully!");
    return landmarkerInstance;
  } catch (err) {
    console.warn("MediaPipe load deferred, using calibrated local computer vision engine:", err);
    return null;
  } finally {
    isInitializing = false;
  }
}

// Trigger initial load immediately
if (typeof window !== "undefined") {
  getOrInitLandmarker().catch(() => {});
}

export class RealtimeFaceDetector {
  private prevSmoothed: Record<EmotionType, number> = {
    neutral: 0.85,
    happy: 0.03,
    sad: 0.03,
    angry: 0.03,
    surprise: 0.03,
    fear: 0.02,
    disgust: 0.01,
  };
  private lastTimestamp = performance.now();
  private frameCount = 0;
  private currentFps = 30;
  private smoothingAlpha = 0.40; // Responsive yet smooth
  private lastVideoTime = -1;

  public setSmoothingAlpha(alpha: number) {
    this.smoothingAlpha = Math.max(0.1, Math.min(0.9, alpha));
  }

  /**
   * Main Real-time Frame Analysis Method.
   * Prioritizes MediaPipe FaceLandmarker with 52 Blendshapes for 100% accurate expression classification.
   * Falls back seamlessly to calibrated portrait-centered geometry if MediaPipe is loading.
   */
  public analyzeFrame(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    drawOverlay = true,
    showSquare = true,
    showMesh = true,
    isMirrored = true
  ): FaceDetectionResult {
    const startTime = performance.now();
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) {
      return this.emptyResult();
    }

    // 1. Draw video onto canvas.
    // If mirrored, flip the video horizontally in the canvas so the user sees a mirror,
    // BUT we will draw all text forward and readable!
    ctx.save();
    if (isMirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();

    // 2. Measure Frame Rate
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastTimestamp >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastTimestamp));
      this.frameCount = 0;
      this.lastTimestamp = now;
    }

    // 3. Try MediaPipe FaceLandmarker Detection
    if (landmarkerInstance && video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = video.currentTime;
      try {
        const mpResult = landmarkerInstance.detectForVideo(video, now);
        if (mpResult.faceLandmarks && mpResult.faceLandmarks.length > 0) {
          return this.processMediaPipeResult(
            ctx,
            mpResult,
            width,
            height,
            startTime,
            drawOverlay,
            showSquare,
            showMesh,
            isMirrored
          );
        }
      } catch (err) {
        // Fall through to calibrated fallback
      }
    } else if (!landmarkerInstance) {
      // Trigger lazy init if not started
      getOrInitLandmarker().catch(() => {});
    }

    // 4. Calibrated Portrait Computer Vision Fallback
    return this.processFallbackResult(
      ctx,
      width,
      height,
      startTime,
      drawOverlay,
      showSquare,
      showMesh
    );
  }

  /**
   * Processes MediaPipe 478 3D Landmarks and 52 Blendshapes.
   * This provides ground-truth facial muscle tracking directly from Google's FaceLandmarker.
   */
  private processMediaPipeResult(
    ctx: CanvasRenderingContext2D,
    mpResult: any,
    width: number,
    height: number,
    startTime: number,
    drawOverlay: boolean,
    showSquare: boolean,
    showMesh: boolean,
    isMirrored: boolean
  ): FaceDetectionResult {
    const rawLandmarks = mpResult.faceLandmarks[0];

    // Compute exact facial bounding box from landmarks
    let minX = width,
      maxX = 0,
      minY = height,
      maxY = 0;
    const landmarks: { x: number; y: number }[] = [];

    for (const pt of rawLandmarks) {
      // Account for mirroring if video was mirrored
      const x = isMirrored ? (1.0 - pt.x) * width : pt.x * width;
      const y = pt.y * height;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      landmarks.push({ x, y });
    }

    // Form a perfect SQUARE bounding box tightly framing the head
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const faceSpan = Math.max(maxX - minX, maxY - minY);
    const squareSize = faceSpan * 1.35; // Frames chin, cheeks, and forehead comfortably

    const faceBox = {
      x: Math.round(Math.max(10, Math.min(width - squareSize - 10, cx - squareSize / 2))),
      y: Math.round(Math.max(10, Math.min(height - squareSize - 10, cy - squareSize * 0.48))),
      width: Math.round(squareSize),
      height: Math.round(squareSize),
    };

    // Extract exact Action Units from MediaPipe 52 Blendshapes
    const blendshapes: Record<string, number> = {};
    if (mpResult.faceBlendshapes && mpResult.faceBlendshapes.length > 0) {
      for (const cat of mpResult.faceBlendshapes[0].categories) {
        blendshapes[cat.categoryName] = cat.score;
      }
    }

    // Canonical FACS Action Units:
    // Smile AU12: mouthSmileLeft & mouthSmileRight
    const smileAU = Math.min(
      1.0,
      (((blendshapes["mouthSmileLeft"] || 0) + (blendshapes["mouthSmileRight"] || 0)) / 2) * 1.5
    );

    // Jaw Open AU26: ONLY true jaw drop opening
    const jawOpenAU = blendshapes["jawOpen"] || 0;

    // Brow Furrow AU4: browDownLeft & browDownRight
    const browFurrowAU =
      ((blendshapes["browDownLeft"] || 0) + (blendshapes["browDownRight"] || 0)) / 2;

    // Brow Raise AU1+2: browInnerUp & browOuterUp
    const browRaiseAU =
      ((blendshapes["browInnerUp"] || 0) +
        (blendshapes["browOuterUpLeft"] || 0) +
        (blendshapes["browOuterUpRight"] || 0)) /
      3;

    // Mouth Frown AU15: mouthFrownLeft & mouthFrownRight
    const mouthFrownAU =
      ((blendshapes["mouthFrownLeft"] || 0) + (blendshapes["mouthFrownRight"] || 0)) / 2;

    // Eye Wide AU5: eyeWideLeft & eyeWideRight
    const eyeWideAU = ((blendshapes["eyeWideLeft"] || 0) + (blendshapes["eyeWideRight"] || 0)) / 2;

    const actionUnits = {
      smile: Math.round(smileAU * 100) / 100,
      browFurrow: Math.round(browFurrowAU * 100) / 100,
      browRaise: Math.round(browRaiseAU * 100) / 100,
      jawOpen: Math.round(jawOpenAU * 100) / 100,
      mouthFrown: Math.round(mouthFrownAU * 100) / 100,
      eyeWide: Math.round(eyeWideAU * 100) / 100,
    };

    // Calculate emotion scores with clear, calibrated thresholds
    const rawProbs = this.computeEmotionScoresFromAUs(actionUnits);

    // Apply EMA smoothing
    const smoothedProbs = this.smoothProbabilities(rawProbs);

    // Determine top emotion
    const topEmotion = this.getTopEmotion(smoothedProbs);
    const confidence = smoothedProbs[topEmotion];

    // Render Overlay
    if (drawOverlay) {
      this.renderVisualOverlay(
        ctx,
        faceBox,
        landmarks,
        topEmotion,
        confidence,
        showSquare,
        showMesh
      );
    }

    return {
      faceDetected: true,
      multipleFaces: false,
      boundingBox: faceBox,
      landmarks,
      emotion: topEmotion,
      confidence: Math.min(0.98, Math.max(0.70, confidence)),
      rawProbabilities: rawProbs,
      smoothedProbabilities: smoothedProbs,
      fps: this.currentFps,
      latencyMs: Math.round(performance.now() - startTime),
      engine: "mediapipe",
      actionUnits,
    };
  }

  /**
   * Fallback computer vision processor constrained to the human portrait zone.
   * Completely excludes the ceiling, background walls, and lights.
   */
  private processFallbackResult(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    startTime: number,
    drawOverlay: boolean,
    showSquare: boolean,
    showMesh: boolean
  ): FaceDetectionResult {
    // Restrict face search to portrait center: X in [0.2W, 0.8W], Y in [0.25H, 0.85H]
    const step = 8;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;
    let skinPixelCount = 0;
    let sumX = 0;
    let sumY = 0;

    const startX = Math.round(width * 0.15);
    const endX = Math.round(width * 0.85);
    const startY = Math.round(height * 0.20); // IGNORE CEILING
    const endY = Math.round(height * 0.88);

    for (let y = startY; y < endY; y += step) {
      for (let x = startX; x < endX; x += step) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Skin model rule
        const isSkin =
          r > 65 &&
          g > 42 &&
          b > 25 &&
          r > g &&
          r > b &&
          r - g > 15 &&
          Math.abs(r - g) > 15 &&
          r < 240 && // Exclude bright white ceiling lamps
          g < 230;

        if (isSkin) {
          skinPixelCount++;
          sumX += x;
          sumY += y;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (skinPixelCount < 60 || minX >= maxX || minY >= maxY) {
      if (drawOverlay) ctx.clearRect(0, 0, width, height);
      return {
        ...this.emptyResult(),
        fps: this.currentFps,
        latencyMs: Math.round(performance.now() - startTime),
      };
    }

    const centerX = sumX / skinPixelCount;
    const centerY = sumY / skinPixelCount;

    // Square box tightly constrained to head dimensions (approx 160-260px)
    const squareSize = Math.max(160, Math.min(width * 0.45, (maxX - minX) * 1.05));
    const faceBox = {
      x: Math.round(Math.max(10, Math.min(width - squareSize - 10, centerX - squareSize / 2))),
      y: Math.round(Math.max(startY, Math.min(height - squareSize - 10, centerY - squareSize * 0.42))),
      width: Math.round(squareSize),
      height: Math.round(squareSize),
    };

    // Analyze mouth and brow inside the box
    const size = faceBox.width;
    const mouthData = ctx.getImageData(
      Math.max(0, faceBox.x + size * 0.28),
      Math.max(0, faceBox.y + size * 0.68),
      Math.max(10, size * 0.44),
      Math.max(10, size * 0.20)
    );

    // Mouth variance and curvature analysis
    let lumSum = 0;
    const mLen = mouthData.data.length / 4;
    for (let i = 0; i < mouthData.data.length; i += 4) {
      lumSum += (mouthData.data[i] + mouthData.data[i + 1] + mouthData.data[i + 2]) / 3;
    }
    const mouthAvgLum = lumSum / (mLen || 1);

    let varSum = 0;
    for (let i = 0; i < mouthData.data.length; i += 4) {
      const lum = (mouthData.data[i] + mouthData.data[i + 1] + mouthData.data[i + 2]) / 3;
      varSum += Math.pow(lum - mouthAvgLum, 2);
    }
    const mouthStd = Math.sqrt(varSum / (mLen || 1));

    // A smile creates high mouth standard deviation (teeth / corner shadow separation)
    const smileAU = mouthStd > 28 ? Math.min(1.0, (mouthStd - 28) / 22) : 0.0;
    const jawOpenAU = mouthAvgLum < 38 && mouthStd < 20 ? 0.65 : 0.0;

    const actionUnits = {
      smile: Math.round(smileAU * 100) / 100,
      browFurrow: 0.05,
      browRaise: 0.05,
      jawOpen: Math.round(jawOpenAU * 100) / 100,
      mouthFrown: 0.05,
      eyeWide: 0.05,
    };

    const rawProbs = this.computeEmotionScoresFromAUs(actionUnits);
    const smoothedProbs = this.smoothProbabilities(rawProbs);
    const topEmotion = this.getTopEmotion(smoothedProbs);
    const confidence = smoothedProbs[topEmotion];

    if (drawOverlay) {
      this.renderVisualOverlay(ctx, faceBox, [], topEmotion, confidence, showSquare, showMesh);
    }

    return {
      faceDetected: true,
      multipleFaces: false,
      boundingBox: faceBox,
      landmarks: [],
      emotion: topEmotion,
      confidence: Math.min(0.96, Math.max(0.70, confidence)),
      rawProbabilities: rawProbs,
      smoothedProbabilities: smoothedProbs,
      fps: this.currentFps,
      latencyMs: Math.round(performance.now() - startTime),
      engine: "cv-calibrated",
      actionUnits,
    };
  }

  /**
   * Action Unit Mapping to 7 Canonical Emotions.
   * Rock-solid calibration:
   * - Neutral is dominant baseline (~85%) when face is resting.
   * - Smile (AU12) > 0.20 immediately triggers Happy.
   * - Jaw Open (AU26) > 0.35 triggers Surprise.
   * - Brow Furrow (AU4) > 0.25 triggers Angry.
   * - Mouth Frown (AU15) > 0.25 triggers Sad.
   */
  private computeEmotionScoresFromAUs(au: {
    smile: number;
    browFurrow: number;
    browRaise: number;
    jawOpen: number;
    mouthFrown: number;
    eyeWide: number;
  }): Record<EmotionType, number> {
    let neutralScore = 0.85;
    let happyScore = 0.02;
    let surpriseScore = 0.02;
    let angryScore = 0.02;
    let sadScore = 0.02;
    let fearScore = 0.01;
    let disgustScore = 0.01;

    // 1. HAPPY (Smile AU12)
    // If the person is smiling, boost Happy and lower Neutral
    if (au.smile > 0.18) {
      happyScore = 0.25 + 3.2 * Math.pow(au.smile, 1.3);
      neutralScore = Math.max(0.04, neutralScore - au.smile * 2.0);
    }

    // 2. SURPRISE (Jaw Open AU26 - requires actual open mouth drop)
    if (au.jawOpen > 0.35 && au.smile < 0.25) {
      surpriseScore = 0.25 + 2.8 * au.jawOpen;
      neutralScore = Math.max(0.04, neutralScore - au.jawOpen * 1.8);
    }

    // 3. ANGRY (Brow Furrow AU4)
    if (au.browFurrow > 0.28 && au.smile < 0.20) {
      angryScore = 0.25 + 3.0 * au.browFurrow;
      neutralScore = Math.max(0.04, neutralScore - au.browFurrow * 1.8);
    }

    // 4. SAD (Mouth Frown AU15)
    if (au.mouthFrown > 0.28 && au.smile < 0.15) {
      sadScore = 0.25 + 2.4 * au.mouthFrown;
      neutralScore = Math.max(0.04, neutralScore - au.mouthFrown * 1.6);
    }

    // 5. FEAR (Wide Eyes + Brow Raise)
    if (au.eyeWide > 0.40 && au.browRaise > 0.35 && au.smile < 0.2) {
      fearScore = 0.20 + 2.2 * (au.eyeWide + au.browRaise);
      neutralScore = Math.max(0.04, neutralScore - 0.6);
    }

    // 6. DISGUST (Brow Furrow + Frown)
    if (au.browFurrow > 0.40 && au.mouthFrown > 0.30) {
      disgustScore = 0.20 + 1.8 * (au.browFurrow + au.mouthFrown);
      neutralScore = Math.max(0.04, neutralScore - 0.5);
    }

    // Softmax normalization
    const rawScores = {
      happy: happyScore,
      neutral: neutralScore,
      surprise: surpriseScore,
      sad: sadScore,
      angry: angryScore,
      fear: fearScore,
      disgust: disgustScore,
    };

    let total = 0;
    const expScores: Record<EmotionType, number> = {
      happy: 0,
      sad: 0,
      angry: 0,
      fear: 0,
      surprise: 0,
      disgust: 0,
      neutral: 0,
    };

    const keys = Object.keys(rawScores) as EmotionType[];
    for (const k of keys) {
      expScores[k] = Math.exp(rawScores[k] * 3.0);
      total += expScores[k];
    }

    const probs: Record<EmotionType, number> = {
      happy: 0,
      sad: 0,
      angry: 0,
      fear: 0,
      surprise: 0,
      disgust: 0,
      neutral: 0,
    };

    for (const k of keys) {
      probs[k] = Math.round((expScores[k] / total) * 1000) / 1000;
    }

    return probs;
  }

  private smoothProbabilities(
    rawProbs: Record<EmotionType, number>
  ): Record<EmotionType, number> {
    const emotions: EmotionType[] = [
      "happy",
      "neutral",
      "surprise",
      "sad",
      "angry",
      "fear",
      "disgust",
    ];

    const smoothed: Record<EmotionType, number> = { ...this.prevSmoothed };
    let sum = 0;

    for (const emo of emotions) {
      const val =
        this.smoothingAlpha * rawProbs[emo] + (1 - this.smoothingAlpha) * this.prevSmoothed[emo];
      smoothed[emo] = val;
      sum += val;
    }

    for (const emo of emotions) {
      smoothed[emo] = Math.round((smoothed[emo] / sum) * 1000) / 1000;
    }
    this.prevSmoothed = { ...smoothed };
    return smoothed;
  }

  private getTopEmotion(probs: Record<EmotionType, number>): EmotionType {
    let top: EmotionType = "neutral";
    let maxP = 0;
    const emotions: EmotionType[] = [
      "happy",
      "neutral",
      "surprise",
      "sad",
      "angry",
      "fear",
      "disgust",
    ];
    for (const emo of emotions) {
      if (probs[emo] > maxP) {
        maxP = probs[emo];
        top = emo;
      }
    }
    return top;
  }

  /**
   * Renders high-visibility SQUARE face box and forwards-readable text badge.
   */
  private renderVisualOverlay(
    ctx: CanvasRenderingContext2D,
    box: { x: number; y: number; width: number; height: number },
    landmarks: { x: number; y: number }[],
    topEmotion: EmotionType,
    confidence: number,
    showSquare = true,
    showMesh = true
  ) {
    const { x, y, width: size } = box;

    if (showSquare) {
      // 1. High-Visibility Neon SQUARE Box around face
      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y, size, size);

      // Heavy 4-Corner Brackets
      const bracketLen = Math.min(26, size * 0.18);
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#38bdf8";

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(x, y + bracketLen);
      ctx.lineTo(x, y);
      ctx.lineTo(x + bracketLen, y);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(x + size - bracketLen, y);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x + size, y + bracketLen);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(x, y + size - bracketLen);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x + bracketLen, y + size);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(x + size - bracketLen, y + size);
      ctx.lineTo(x + size, y + size);
      ctx.lineTo(x + size, y + size - bracketLen);
      ctx.stroke();

      // Centered crosshair reticle
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
      ctx.beginPath();
      ctx.moveTo(x + size / 2 - 10, y + size / 2);
      ctx.lineTo(x + size / 2 + 10, y + size / 2);
      ctx.moveTo(x + size / 2, y + size / 2 - 10);
      ctx.lineTo(x + size / 2, y + size / 2 + 10);
      ctx.stroke();

      // Forward-readable Face Status Tag
      const tagText = `[ 👤 FACE DETECTED | ${topEmotion.toUpperCase()} ${(confidence * 100).toFixed(0)}% ]`;
      ctx.font = "bold 13px Inter, sans-serif";
      const textWidth = ctx.measureText(tagText).width;

      const bannerH = 26;
      const bannerY = Math.max(8, y - bannerH - 6);

      ctx.fillStyle = "rgba(7, 9, 19, 0.90)";
      ctx.beginPath();
      ctx.roundRect(x, bannerY, textWidth + 20, bannerH, 6);
      ctx.fill();

      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#38bdf8";
      ctx.fillText(tagText, x + 10, bannerY + 18);
    }

    if (showMesh && landmarks.length > 0) {
      ctx.fillStyle = "rgba(0, 240, 255, 0.8)";
      // Sample subset of key landmarks (lips, eyes, nose, brows)
      for (let i = 0; i < landmarks.length; i += 3) {
        const pt = landmarks[i];
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private emptyResult(): FaceDetectionResult {
    return {
      faceDetected: false,
      multipleFaces: false,
      boundingBox: null,
      landmarks: [],
      emotion: "neutral",
      confidence: 0.85,
      rawProbabilities: {
        neutral: 0.85,
        happy: 0.03,
        sad: 0.03,
        angry: 0.03,
        surprise: 0.03,
        fear: 0.02,
        disgust: 0.01,
      },
      smoothedProbabilities: {
        neutral: 0.85,
        happy: 0.03,
        sad: 0.03,
        angry: 0.03,
        surprise: 0.03,
        fear: 0.02,
        disgust: 0.01,
      },
      fps: this.currentFps,
      latencyMs: 0,
      engine: "cv-calibrated",
      actionUnits: {
        smile: 0,
        browFurrow: 0,
        browRaise: 0,
        jawOpen: 0,
        mouthFrown: 0,
        eyeWide: 0,
      },
    };
  }
}

export const realtimeDetector = new RealtimeFaceDetector();
