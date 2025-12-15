import React from 'react';
import { VideoGenerationProgress } from '../types';

interface VideoPlayerProps {
  videoUrl: string | null;
  isLoading: boolean;
  progress: VideoGenerationProgress;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, isLoading, progress }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-800 rounded-lg shadow-lg border border-gray-700 w-full mt-8">
      <h3 className="text-xl font-semibold mb-4 text-gray-200">Generated Video</h3>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center w-full h-64 bg-gray-700 rounded-md animate-pulse">
          <svg
            className="animate-spin h-10 w-10 text-blue-400 mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-blue-300 text-lg font-medium">
            {progress.message}
          </p>
          {progress.status === 'extending' && progress.totalSegments > 0 && (
            <p className="text-sm text-gray-400 mt-2">
              Segment {progress.currentSegment} of {progress.totalSegments}
            </p>
          )}
        </div>
      ) : videoUrl ? (
        <div className="w-full aspect-video bg-black rounded-md overflow-hidden">
          <video controls src={videoUrl} className="w-full h-full object-contain" />
        </div>
      ) : (
        <div className="w-full h-64 bg-gray-700 rounded-md flex items-center justify-center">
          <p className="text-gray-400">Upload images and provide a prompt to generate your video.</p>
        </div>
      )}

      {progress.status === 'error' && (
        <p className="text-red-500 mt-4 text-center">Error: {progress.message}. Please try again.</p>
      )}
    </div>
  );
};

export default VideoPlayer;
