import { GoogleGenAI, VideoGenerationReferenceImage, VideoGenerationReferenceType } from "@google/genai";
import { UploadedImage, VideoGenerationProgress } from "../types";

// Helper functions for base64 encoding/decoding, if needed for other parts.
// For image upload, base64 is handled by FileReader in ImageUploader.tsx
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Removed ensureApiKeySelected function as per user request to bypass manual API key input.
// The application will now rely solely on process.env.API_KEY being pre-configured.

export async function generateMarketingVideo(
  images: UploadedImage[],
  prompt: string,
  onProgress: (progress: VideoGenerationProgress) => void,
): Promise<string | undefined> {
  // The GoogleGenAI instance must be created *after* the key is assumed to be available
  // through process.env.API_KEY.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const model = 'veo-3.1-generate-preview'; // Model supports reference images and video extension
  const targetDurationSeconds = 60;
  const estimatedExtensionSeconds = 7; // Each extension adds ~7 seconds
  const maxSegments = Math.ceil(targetDurationSeconds / estimatedExtensionSeconds);

  let currentVideoUri: string | undefined;
  let currentOperation: any | undefined; // Using `any` for `Operation` type for simplicity
  let accumulatedDuration = 0;
  let segmentCount = 0;

  try {
    // 1. Initial Video Generation
    onProgress({
      status: 'generating_initial',
      message: `Initiating video generation (segment ${segmentCount + 1}/${maxSegments})...`,
      currentSegment: segmentCount,
      totalSegments: maxSegments,
    });

    const referenceImagesPayload: VideoGenerationReferenceImage[] = images.map((img) => ({
      image: {
        imageBytes: img.base64,
        mimeType: img.mimeType,
      },
      referenceType: VideoGenerationReferenceType.ASSET,
    }));

    // Augment the prompt to inform the model about all provided images,
    // while still only directly embedding the first 3 due to API limits.
    const augmentedPrompt = `Create a captivating marketing video for an app. You have been provided with ${images.length} app screenshots for comprehensive visual context. ${prompt}`;

    currentOperation = await ai.models.generateVideos({
      model: model,
      prompt: augmentedPrompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9',
        referenceImages: referenceImagesPayload.slice(0, 3), // Max 3 reference images for direct embedding
      },
    });

    while (!currentOperation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
      currentOperation = await ai.operations.getVideosOperation({ operation: currentOperation });
      console.log("Polling initial video operation: ", currentOperation);
    }

    if (currentOperation.response?.generatedVideos?.[0]?.video?.uri) {
      currentVideoUri = currentOperation.response.generatedVideos[0].video.uri;
      accumulatedDuration = currentOperation.response.generatedVideos[0].video.durationSeconds || 0;
      segmentCount++;
      console.log(`Initial video generated. Duration: ${accumulatedDuration}s. URI: ${currentVideoUri}`);
    } else {
      throw new Error('Initial video generation failed or returned no URI.');
    }

    // 2. Sequential Video Extension to reach 1 minute
    while (accumulatedDuration < targetDurationSeconds && segmentCount < maxSegments) {
      onProgress({
        status: 'extending',
        message: `Extending video (segment ${segmentCount + 1}/${maxSegments}). Current duration: ${accumulatedDuration.toFixed(1)}s`,
        currentSegment: segmentCount,
        totalSegments: maxSegments,
      });

      const previousVideoObject = currentOperation.response.generatedVideos[0].video;

      const extensionPrompt = `Continue the marketing video, maintaining the tone and content established, focusing on further showcasing the app. Incorporate elements from the provided ${images.length} app screenshots. ${prompt}`;

      currentOperation = await ai.models.generateVideos({
        model: model,
        prompt: extensionPrompt,
        video: previousVideoObject, // Use the video object from the previous operation
        config: {
          numberOfVideos: 1,
          resolution: '720p', // Must be 720p for extension
          aspectRatio: '16:9', // Must use same aspect ratio as previous
        },
      });

      while (!currentOperation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        currentOperation = await ai.operations.getVideosOperation({ operation: currentOperation });
        console.log(`Polling extension operation for segment ${segmentCount + 1}: `, currentOperation);
      }

      if (currentOperation.response?.generatedVideos?.[0]?.video?.uri) {
        currentVideoUri = currentOperation.response.generatedVideos[0].video.uri;
        accumulatedDuration = currentOperation.response.generatedVideos[0].video.durationSeconds || accumulatedDuration + estimatedExtensionSeconds; // Update duration or estimate
        segmentCount++;
        console.log(`Segment ${segmentCount} generated. Total duration: ${accumulatedDuration}s. URI: ${currentVideoUri}`);
      } else {
        throw new Error(`Video extension for segment ${segmentCount + 1} failed or returned no URI.`);
      }
    }

    onProgress({
      status: 'complete',
      message: `Video generation complete! Total duration: ${accumulatedDuration.toFixed(1)}s`,
      currentSegment: segmentCount,
      totalSegments: maxSegments,
    });
    return `${currentVideoUri}&key=${process.env.API_KEY}`; // Append API key for direct access
  } catch (error) {
    console.error('Error generating video:', error);
    onProgress({
      status: 'error',
      message: `Video generation failed: ${error instanceof Error ? error.message : String(error)}`,
      currentSegment: segmentCount,
      totalSegments: maxSegments,
    });
    // The previous API Key error check related to "Requested entity was not found."
    // would now only occur if process.env.API_KEY is truly invalid or missing
    // after direct initialization.
    return undefined;
  }
}