import React, { useState } from 'react';
import FileDropzone from './components/FileDropzone';
import { generateProfessionalUmbrella } from "./services/openaiService";
import { ProcessingState, DesignConfig, SavedComponent, MaterialType, MaterialFinish, WoodType, ExportFormat } from './types';

const App: React.FC = () => {
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [patternImage, setPatternImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [state, setState] = useState<ProcessingState>(ProcessingState.IDLE);
  const [error, setError] = useState<string | null>(null);

  const [config, setConfig] = useState<DesignConfig>({
    canopyMode: 'PATTERN',
    solidColor: '#ffffff',
    patternScale: 1.0,
    offsetX: 50,
    offsetY: 50,
    handleImageBase64: null,
    handleMaterial: 'PLASTIC',
    handleFinish: 'MATTE',
    handleWoodType: 'OAK',
    handleColor: '#1a1a1a',
    tipImageBase64: null,
    tipMaterial: 'METAL',
    tipFinish: 'GLOSSY',
    tipColor: '#333333',
    specialInstructions: '',
    exportFormat: 'PNG_72',
  });

  const handleGenerate = async () => {
    if (!baseImage) return;
    setState(ProcessingState.GENERATING);
    setError(null);

    try {
      const res = await generateProfessionalUmbrella(baseImage, patternImage, config);
      if (res) {
        setResultImage(res);
        setState(ProcessingState.SUCCESS);
      } else {
        setError("No se pudo generar la imagen.");
        setState(ProcessingState.ERROR);
      }
    } catch (err: any) {
      console.error("Render error:", err);
      setError(err.message || "Error inesperado.");
      setState(ProcessingState.ERROR);
    }
  };

  const downloadResult = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    const ext = config.exportFormat.split('_')[0].toLowerCase();
    link.href = resultImage;
    link.download = `umbrella-design-${Date.now()}.${ext === 'tiff' ? 'tif' : ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-screen bg-gray-50 text-slate-900 font-sans flex flex-col overflow-hidden">
      <header className="h-14 shrink-0 border-b border-gray-200 flex items-center justify-between px-8 bg-white z-50">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-black text-xs">US</div>
          <h1 className="text-xs font-black uppercase tracking-widest text-slate-400">
            Umbrella <span className="text-blue-600">Studio PRO</span>
          </h1>
        </div>

        <div className="flex items-center space-x-6">
          {resultImage && (
            <button 
              onClick={downloadResult}
              className="bg-blue-600 text-white px-5 py-2 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
            >
              Exportar
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[380px] shrink-0 border-r border-gray-200 overflow-y-auto bg-white p-6 space-y-10 custom-scrollbar">
          
          <section>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">01. Modelo Base</h3>
            <FileDropzone 
              label="Cargar Paraguas Base" 
              onImageSelect={(img) => { setBaseImage(img); setResultImage(null); }} 
              imagePreview={baseImage} 
              className="min-h-[140px]"
            />
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">02. Ajustes</h3>
            <textarea 
              value={config.specialInstructions}
              onChange={e => setConfig({...config, specialInstructions: e.target.value})}
              placeholder="Instrucciones adicionales..."
              className="w-full h-20 bg-white border border-blue-100 rounded-xl px-4 py-3 text-[11px] focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
            />
          </section>

          <section className="space-y-6">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">03. Textil</h3>
            <FileDropzone label="Cargar Estampado" onImageSelect={setPatternImage} imagePreview={patternImage} className="min-h-[100px]" />

            <div>
              <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                <span>Escala</span>
                <span>{config.patternScale}x</span>
              </div>
              <input 
                type="range" 
                min="0.1" 
                max="5" 
                step="0.1" 
                value={config.patternScale} 
                onChange={e => setConfig({...config, patternScale: parseFloat(e.target.value)})} 
                className="w-full" 
              />
            </div>
          </section>

          <div className="pt-6 pb-20">
            <button 
              onClick={handleGenerate}
              disabled={!baseImage || state === ProcessingState.GENERATING}
              className={`w-full py-5 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] transition-all
                ${state === ProcessingState.GENERATING ? 'bg-gray-100 text-gray-300 cursor-wait' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-100'}
                ${!baseImage ? 'opacity-30 pointer-events-none' : ''}
              `}
            >
              {state === ProcessingState.GENERATING ? 'Generando...' : 'Generar Diseño'}
            </button>

            {error && (
              <p className="text-[9px] text-red-500 font-bold mt-4 text-center bg-red-50 p-2 rounded border border-red-100">
                {error}
              </p>
            )}
          </div>
        </aside>

        <main className="flex-1 bg-white flex items-center justify-center p-12">
          {state === ProcessingState.GENERATING ? (
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin mx-auto mb-8"></div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                Renderizando con OpenAI
              </h2>
            </div>
          ) : resultImage ? (
            <img src={resultImage} alt="Resultado" className="max-w-full max-h-full object-contain drop-shadow-2xl" />
          ) : baseImage ? (
            <img src={baseImage} className="max-w-full max-h-full object-contain opacity-40" />
          ) : (
            <div className="text-center opacity-20">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em]">
                Esperando Imagen Base
              </h2>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
