
import React, { useRef, useState } from 'react';

interface FileDropzoneProps {
  label: string;
  onImageSelect: (base64: string) => void;
  imagePreview: string | null;
  className?: string;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({ label, onImageSelect, imagePreview, className = "" }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onImageSelect(result);
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div 
      className={`relative group border-2 border-dashed rounded-xl transition-all duration-300 p-4 flex flex-col items-center justify-center min-h-[200px] cursor-pointer
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-white'} 
        ${className}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      
      {imagePreview ? (
        <div className="relative w-full h-full flex flex-col items-center">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="max-h-48 object-contain rounded-lg shadow-sm"
          />
          <span className="mt-2 text-xs text-gray-400 font-medium">Click to replace</span>
        </div>
      ) : (
        <div className="text-center">
          <div className="mb-3 text-gray-400 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-700">{label}</p>
          <p className="text-xs text-gray-500 mt-1">Drag and drop or click to browse</p>
        </div>
      )}
    </div>
  );
};

export default FileDropzone;
