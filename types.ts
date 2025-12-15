export interface UploadedImage {
  file: File;
  base64: string;
  mimeType: string;
}

export interface VideoGenerationProgress {
  status: 'idle' | 'generating_initial' | 'extending' | 'complete' | 'error';
  message: string;
  currentSegment: number;
  totalSegments: number;
}
