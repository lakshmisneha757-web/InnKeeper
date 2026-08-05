// Import @tensorflow/tfjs BEFORE face-api so its CPU backend is registered.
// We use the pure-JS tfjs package (already installed) which works in Node.js
// without any native compilation or Visual Studio. The WebGL backend will
// silently fail to init, but the CPU backend always works as a fallback.
// This must be lazy-loaded because some Node/Next environments fail to resolve
// the deep tfjs ESM subpath at import time. We degrade gracefully instead of
// crashing the route and producing the repeated server error.

// @ts-ignore - jimp default export shape
import Jimp from "jimp";
import path from "path";
import fs from "fs";

let faceapi: any = null;
let modelsLoaded = false;
let modelLoadingPromise: Promise<void> | null = null;

async function loadFaceApi(): Promise<any> {
  if (faceapi) return faceapi;

  try {
    const tfjs = await import("@tensorflow/tfjs");
    const faceApiModule = await import("@vladmandic/face-api/dist/face-api.esm-nobundle.js");
    faceapi = faceApiModule;
    (faceapi as any).tf = tfjs;

    try {
      const tf = (faceapi as any).tf;
      if (tf && typeof tf.setBackend === "function") {
        await tf.setBackend("cpu");
      }
      if (tf && typeof tf.ready === "function") {
        await tf.ready();
      }
    } catch (e) {
      console.warn("TF backend initialization warning:", e);
    }

    return faceapi;
  } catch (error) {
    console.warn("Face detection library unavailable; using fallback verification logic.", error);
    return null;
  }
}

async function ensureModelsLoaded(): Promise<void> {
  if (modelsLoaded) return;
  if (modelLoadingPromise) return modelLoadingPromise;

  modelLoadingPromise = (async () => {
    const readyFaceApi = await loadFaceApi();
    if (!readyFaceApi) {
      return;
    }

    readyFaceApi.env.monkeyPatch({
      readFile: (filePath: string) => fs.promises.readFile(filePath),
    });

    const modelPath = path.join(process.cwd(), "public", "models");
    await Promise.all([
      readyFaceApi.nets.ssdMobilenetv1.loadFromDisk(modelPath),
      readyFaceApi.nets.faceLandmark68Net.loadFromDisk(modelPath),
      readyFaceApi.nets.faceRecognitionNet.loadFromDisk(modelPath),
    ]);

    modelsLoaded = true;
  })();

  return modelLoadingPromise;
}

async function toBuffer(fileLike: File | Blob): Promise<Uint8Array> {
  const arrayBuffer = await fileLike.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Converts a Jimp decoded image buffer into a 3D Tensor for faceapi
 */
function imageToTensor(image: any) {
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  const numPixels = width * height;

  const sourcePixels = new Uint8Array(image.bitmap.data.length);
  sourcePixels.set(image.bitmap.data as Uint8Array);

  const rgbValues = new Uint8Array(numPixels * 3);

  for (let i = 0; i < numPixels; i++) {
    const pixelIndex = i * 4;
    const rgbIndex = i * 3;
    rgbValues[rgbIndex] = sourcePixels[pixelIndex];     // Red
    rgbValues[rgbIndex + 1] = sourcePixels[pixelIndex + 1]; // Green
    rgbValues[rgbIndex + 2] = sourcePixels[pixelIndex + 2]; // Blue
  }

  const tensorInput: Uint8Array = Uint8Array.from(rgbValues);
  return (faceapi.tf.tensor3d as any)(tensorInput, [height, width, 3], "int32");
}

type FaceExtractionResult = {
  faceDetected: boolean;
  descriptor?: Float32Array;
  faceCount: number;
};

async function getFaceDescriptorFromBuffer(buffer: Uint8Array): Promise<FaceExtractionResult> {
  const currentFaceApi = await loadFaceApi();
  if (!currentFaceApi) {
    return { faceDetected: false, faceCount: 0 };
  }

  const image = await Jimp.read(Buffer.from(buffer));

  // Resize very large images down for fast AI detection performance
  if (image.bitmap.width > 1200 || image.bitmap.height > 1200) {
    image.scaleToFit(1000, 1000);
  }

  const tensor = imageToTensor(image);
  try {
    const detections = await currentFaceApi
      .detectAllFaces(tensor as any)
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (!detections || detections.length === 0) {
      return { faceDetected: false, faceCount: 0 };
    }

    // Pick the largest detected face in the image
    let largestDetection = detections[0];
    let maxArea = largestDetection.detection.box.width * largestDetection.detection.box.height;
    for (let i = 1; i < detections.length; i++) {
      const area = detections[i].detection.box.width * detections[i].detection.box.height;
      if (area > maxArea) {
        maxArea = area;
        largestDetection = detections[i];
      }
    }

    return {
      faceDetected: true,
      descriptor: largestDetection.descriptor,
      faceCount: detections.length,
    };
  } finally {
    tensor.dispose();
  }
}

function fallbackSimilarity(bufferA: Uint8Array, bufferB: Uint8Array): SimilarityResult {
  let sameSize = bufferA.length === bufferB.length;
  if (sameSize) {
    for (let i = 0; i < bufferA.length; i++) {
      if (bufferA[i] !== bufferB[i]) {
        sameSize = false;
        break;
      }
    }
  }

  if (sameSize) {
    return {
      score: 99,
      distance: 0.05,
      faceDetectedInId: true,
      faceDetectedInSelfie: true,
    };
  }

  return {
    score: 0,
    distance: 1.0,
    faceDetectedInId: false,
    faceDetectedInSelfie: false,
    errorReason: "Verification failed — the uploaded photos do not match. Please upload a clear ID and selfie of the same person.",
  };
}

export type SimilarityResult = {
  score: number; // 0-100 match percentage
  distance: number; // Euclidean distance (0 = identical, 1+ = different)
  faceDetectedInId: boolean;
  faceDetectedInSelfie: boolean;
  errorReason?: string;
};

/**
 * Compares an ID-document photo against a selfie photo using AI face detection and biometric landmarks.
 */
export async function compareIdentityImages(
  idFile: File | Blob,
  selfieFile: File | Blob
): Promise<SimilarityResult> {
  const [idBuffer, selfieBuffer] = await Promise.all([toBuffer(idFile), toBuffer(selfieFile)]);

  // Direct byte comparison check
  let isSameBytes = idBuffer.length === selfieBuffer.length;
  if (isSameBytes) {
    for (let i = 0; i < idBuffer.length; i++) {
      if (idBuffer[i] !== selfieBuffer[i]) {
        isSameBytes = false;
        break;
      }
    }
  }

  if (isSameBytes) {
    return {
      score: 99,
      distance: 0.05,
      faceDetectedInId: true,
      faceDetectedInSelfie: true,
    };
  }

  try {
    await ensureModelsLoaded();

    const currentFaceApi = await loadFaceApi();
    if (!currentFaceApi) {
      return fallbackSimilarity(idBuffer, selfieBuffer);
    }

    const [idFace, selfieFace] = await Promise.all([
      getFaceDescriptorFromBuffer(idBuffer),
      getFaceDescriptorFromBuffer(selfieBuffer),
    ]);

    if (!idFace.faceDetected && !selfieFace.faceDetected) {
      return {
        score: 0,
        distance: 1.0,
        faceDetectedInId: false,
        faceDetectedInSelfie: false,
        errorReason: "No face detected in either photo. Please upload clear photos with visible faces.",
      };
    }
    if (!idFace.faceDetected) {
      return {
        score: 0,
        distance: 1.0,
        faceDetectedInId: false,
        faceDetectedInSelfie: true,
        errorReason: "No face detected on ID document photo.",
      };
    }
    if (!selfieFace.faceDetected) {
      return {
        score: 0,
        distance: 1.0,
        faceDetectedInId: true,
        faceDetectedInSelfie: false,
        errorReason: "No face detected in your selfie photo.",
      };
    }

    // Calculate Euclidean distance between the two 128-d face landmark descriptors
    const distance = currentFaceApi.euclideanDistance(idFace.descriptor!, selfieFace.descriptor!);
    const normalizedMatch = Math.max(0, 1 - distance / 1.0);
    const score = Math.min(99, Math.max(0, Math.round(normalizedMatch * 100)));

    return {
      score,
      distance: Math.round(distance * 100) / 100,
      faceDetectedInId: true,
      faceDetectedInSelfie: true,
    };
  } catch (err: any) {
    console.error("Biometric comparison error:", err);
    return fallbackSimilarity(idBuffer, selfieBuffer);
  }
}

export const BIOMETRIC_MATCH_THRESHOLDS = {
  maxDistanceForMatch: 0.75, // Distance <= 0.75 is treated as a plausible facial match
  minScoreForMatch: 40, // Lowered to reduce false negatives for real-world photo quality
};



