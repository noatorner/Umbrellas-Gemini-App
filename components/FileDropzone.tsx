import React, { useRef, useState } from 'react';

interface FileDropzoneProps {
  label: string;
  onImageSelect: (base64: string) => void;
  imagePreview: string | null;
  className?: string;
}

// --- Helpers: resize + compress to small JPG dataURL ---
async function fileToCompressedDataURL(
  file: File,
  opts?: { maxSide?: number; quality?: number }
): Promise<string> {
  const maxSide = opts?.maxSide ?? 1200;   // <= important for Vercel payload
  const quality = opts?.quality ?? 0.75;   // 0.65–0.8 suele ir muy bien

  // Read file as DataURL
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

  // Load into Image
  const img: HTMLImageElement = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('La imagen no se pudo cargar.'));
    i.src = dataUrl;
  });

  // Compute resized dimensions (keep aspect ratio)
  const { width, height } = img;
  let targetW = width;
  let targetH = height;

  const largestSide = Math.max(width, height);
  if (largestSide > maxSide) {
    const scale = maxSide / largestSide;
    targetW = Math.round(width * scale);
    targetH = Math.round(height * scale);
  }

  // Draw on canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('No se pudo preparar el canvas.');

  // White background to avoid transparency issues when converting to JPG
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetW, targetH);

  ctx.drawImage(img, 0, 0, targetW, targetH);

  // Export as JPEG to reduce size
  const out = canvas.toDataURL('image/jpeg', quality);

  return out;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({
  label,
  onImageSelect,
  imagePreview,
  className = ""
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, sube un archivo de imagen.');
      return;
    }

    try {
      setIsProcessing(true);

      // Compress/resize automatically
      const compressed = await fileToCompressedDataURL(file, {
        maxSide: 1200,
        quality: 0.75,
      });

      onImageSelect(compressed);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'No se pudo procesar la imagen.');
    } finally {
      setIsProcessing(false);
    }
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
      onClick={() => !isProcessing && fileInputRef.current?.click()}
      title={isProcessing ? 'Procesando imagen…' : 'Haz clic para seleccionar una imagen'}
    >
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          // para poder seleccionar el mismo archivo otra vez:
          e.currentTarget.value = '';
          if (file) handleFile(file);
        }}
      />

      {isProcessing ? (
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-gray-700">Optimizando imagen…</p>
          <p className="text-[11px] text-gray-500 mt-1">Reduciendo tamaño para que Vercel no falle</p>
        </div>
      ) : imagePreview ? (
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
          <p className="text-xs text-gray-500 mt-1">Arrastra y suelta o haz clic para elegir</p>
          <p className="text-[11px] text-gray-400 mt-1">Se optimiza automáticamente</p>
        </div>
      )}
    </div>
  );
};

export default FileDropzone;
