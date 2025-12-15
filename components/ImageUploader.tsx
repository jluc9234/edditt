import React, { useState, useRef, useCallback } from 'react';
import { UploadedImage } from '../types';

interface ImageUploaderProps {
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesChange, maxImages = 10 }) => { // Updated default maxImages to 10
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const newImages: UploadedImage[] = [];
    // Explicitly cast `files` to `File[]` to ensure `Array.from` produces an array of `File` objects.
    const filesToProcess: File[] = Array.from(files).slice(0, maxImages - uploadedImages.length);

    for (const currentFile of filesToProcess) {
      // `currentFile` is now correctly typed as `File`, so the explicit assertion is no longer needed here.
      const fileToUpload = currentFile; 

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const result: string | ArrayBuffer | null = reader.result;
          if (typeof result === 'string') {
            resolve(result.split(',')[1]); // Extract base64 part
          } else {
            resolve('');
          }
        };
      });
      reader.readAsDataURL(fileToUpload); // Use the explicitly typed file
      const base64 = await base64Promise;

      newImages.push({
        file: fileToUpload, // Now uses the explicitly typed `fileToUpload`
        base64: base64,
        mimeType: fileToUpload.type, // Now uses `fileToUpload.type`
      });
    }

    const updatedImages = [...uploadedImages, ...newImages].slice(0, maxImages);
    setUploadedImages(updatedImages);
    onImagesChange(updatedImages);

    // Reset file input to allow uploading the same files again if desired
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [uploadedImages, onImagesChange, maxImages]);

  const handleRemoveImage = useCallback((indexToRemove: number) => {
    const updatedImages = uploadedImages.filter((_, index) => index !== indexToRemove);
    setUploadedImages(updatedImages);
    onImagesChange(updatedImages);
  }, [uploadedImages, onImagesChange]);

  const remainingSlots = maxImages - uploadedImages.length;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-800 rounded-lg shadow-lg border border-gray-700 w-full">
      <h3 className="text-xl font-semibold mb-4 text-gray-200">Upload App Screenshots (Max {maxImages})</h3> {/* Updated text */}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-4 w-full"> {/* Adjusted grid for more images */}
        {uploadedImages.map((image, index) => (
          <div key={index} className="relative group w-full h-40 bg-gray-700 rounded-md flex items-center justify-center overflow-hidden">
            <img
              src={URL.createObjectURL(image.file)}
              alt={`Uploaded ${index + 1}`}
              className="object-cover w-full h-full"
            />
            <button
              onClick={() => handleRemoveImage(index)}
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              aria-label={`Remove image ${index + 1}`}
            >
              &times;
            </button>
          </div>
        ))}
        {remainingSlots > 0 && (
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-blue-500 rounded-md cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors duration-200"
          >
            <svg
              className="w-12 h-12 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v8"
              ></path>
            </svg>
            <span className="mt-2 text-sm font-medium text-blue-300">
              {uploadedImages.length === 0 ? 'Upload images' : `Add ${remainingSlots} more`}
            </span>
            <input
              id="file-upload"
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={remainingSlots === 0}
            />
          </label>
        )}
      </div>
      {uploadedImages.length > 0 && (
        <p className="text-sm text-gray-400 mt-2">
          {uploadedImages.length} image(s) uploaded.
        </p>
      )}
    </div>
  );
};

export default ImageUploader;