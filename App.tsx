import React, { useState, useCallback } from 'react';
import ImageUploader from './components/ImageUploader';
import VideoPlayer from './components/VideoPlayer';
import { UploadedImage, VideoGenerationProgress } from './types';
import { generateMarketingVideo } from './services/geminiService'; // Removed ensureApiKeySelected

const App: React.FC = () => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [videoPrompt, setVideoPrompt] = useState<string>('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<VideoGenerationProgress>({
    status: 'idle',
    message: 'Ready to generate video',
    currentSegment: 0,
    totalSegments: 0,
  });

  const handleImagesChange = useCallback((images: UploadedImage[]) => {
    setUploadedImages(images);
  }, []);

  const handleGenerateVideo = useCallback(async () => {
    if (uploadedImages.length === 0 || videoPrompt.trim() === '') {
      alert('Please upload at least one image and provide a video prompt.');
      return;
    }

    setIsLoading(true);
    setGeneratedVideoUrl(null);
    setProgress({ status: 'idle', message: 'Starting video generation...', currentSegment: 0, totalSegments: 0 });

    try {
      // API Key selection is no longer handled manually within the app.
      // It is assumed process.env.API_KEY is pre-configured.
      const videoUrl = await generateMarketingVideo(uploadedImages, videoPrompt, setProgress);
      setGeneratedVideoUrl(videoUrl || null);
    } catch (error) {
      console.error('Failed to generate video:', error);
      setProgress({ status: 'error', message: `Generation failed: ${error instanceof Error ? error.message : String(error)}`, currentSegment: 0, totalSegments: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [uploadedImages, videoPrompt]);

  // Removed handleSelectApiKey function as API key selection is no longer manual.

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-8">
      <h1 className="text-4xl font-extrabold text-blue-400 mb-6 drop-shadow-lg text-center">
        EDEN 11 Video Marketing Generator
      </h1>

      <div className="w-full max-w-4xl flex flex-col lg:flex-row lg:space-x-8 space-y-8 lg:space-y-0">
        {/* Left Panel: Image Uploader and Prompt Input */}
        <div className="flex-1 flex flex-col space-y-6">
          <ImageUploader onImagesChange={handleImagesChange} maxImages={10} />

          <div className="flex flex-col p-4 bg-gray-800 rounded-lg shadow-lg border border-gray-700 w-full">
            <h3 className="text-xl font-semibold mb-4 text-gray-200">Video Directions</h3>
            <textarea
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[100px]"
              placeholder="Enter specific directions for your marketing video (e.g., 'Highlight app features, dynamic transitions, call to action at the end')."
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              rows={5}
            />
          </div>

          <button
            onClick={handleGenerateVideo}
            className={`w-full px-6 py-3 rounded-lg text-lg font-bold transition-all duration-300
              ${isLoading ? 'bg-blue-600 cursor-not-allowed opacity-75' : 'bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500'}
              ${uploadedImages.length === 0 || videoPrompt.trim() === '' ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            disabled={isLoading || uploadedImages.length === 0 || videoPrompt.trim() === ''}
          >
            {isLoading ? 'Generating Video...' : 'Generate Video (Min 1 min)'}
          </button>
        </div>

        {/* Right Panel: Video Player and API Key Info (Removed as per user request) */}
        <div className="flex-1 flex flex-col space-y-6">
          <VideoPlayer videoUrl={generatedVideoUrl} isLoading={isLoading} progress={progress} />
          {/* Removed the API key information div and button */}
        </div>
      </div>
    </div>
  );
};

export default App;