
import React, { useState, useEffect } from 'react';
import FileDropzone from './components/FileDropzone';
import { generateProfessionalUmbrella } from './services/geminiService';
import { ProcessingState, DesignConfig, SavedComponent, MaterialType, MaterialFinish, WoodType, ExportFormat } from './types';

const App: React.FC = () => {
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [patternImage, setPatternImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [state, setState] = useState<ProcessingState>(ProcessingState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [library, setLibrary] = useState<SavedComponent[]>([]);

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

  useEffect(() => {
    const checkKeyStatus = async () => {
      // @ts-ignore
      if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
        // No marcamos quotaExceeded aquí para no asustar al usuario al inicio, 
        // pero estamos listos para pedirla si falla la primera vez.
      }
    };
    checkKeyStatus();
  }, []);

  const handleSelectKey = async () => {
    try {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setQuotaExceeded(false);
      setError(null);
      setState(ProcessingState.IDLE);
    } catch (e) {
      console.error("Error seleccionando clave:", e);
    }
  };

  const addToLibrary = (base64: string, type: 'HANDLE' | 'TIP') => {
    const newItem: SavedComponent = { id: Date.now().toString(), name: `${type} ${library.length + 1}`, imageBase64: base64, type };
    setLibrary(prev => [...prev, newItem]);
    if (type === 'HANDLE') setConfig(c => ({...c, handleImageBase64: base64}));
    else setConfig(c => ({...c, tipImageBase64: base64}));
  };

  const handleGenerate = async () => {
    if (!baseImage) return;
    setState(ProcessingState.GENERATING);
    setError(null);
    setQuotaExceeded(false);

    try {
      const res = await generateProfessionalUmbrella(baseImage, patternImage, config);
      if (res) {
        setResultImage(res);
        setState(ProcessingState.SUCCESS);
      }
    } catch (err: any) {
      const errorMsg = err.message || "";
      console.error("Render error detected:", errorMsg);
      
      // Detección proactiva de 429 o falta de recursos
      if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota")) {
        setError("Límite de cuota alcanzado. Se requiere una API Key de un proyecto de pago.");
        setQuotaExceeded(true);
        setState(ProcessingState.ERROR);
        // Abrir automáticamente el selector para mejorar el flujo de trabajo
        // @ts-ignore
        if (window.aistudio) {
          await window.aistudio.openSelectKey();
        }
      } else if (errorMsg.includes("Requested entity was not found")) {
        setError("Configuración de API incorrecta.");
        setQuotaExceeded(true);
        setState(ProcessingState.ERROR);
        // @ts-ignore
        await window.aistudio.openSelectKey();
      } else {
        setError(errorMsg || "Error inesperado en el motor de renderizado.");
        setState(ProcessingState.ERROR);
      }
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
          <h1 className="text-xs font-black uppercase tracking-widest text-slate-400">Umbrella <span className="text-blue-600">Studio PRO</span></h1>
        </div>

        <div className="flex items-center space-x-6">
          <button 
            onClick={handleSelectKey}
            className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 border rounded-lg transition-all ${quotaExceeded ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
          >
            {quotaExceeded ? 'Cambiar API Key (Requerido)' : 'Configurar Clave'}
          </button>
          
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {(['PNG_72', 'JPG_72', 'TIFF_300'] as ExportFormat[]).map(f => (
              <button 
                key={f} 
                onClick={() => setConfig({...config, exportFormat: f})}
                className={`px-3 py-1 text-[9px] font-black rounded transition-all ${config.exportFormat === f ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
          
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
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">01. Estructura Industrial</h3>
            <FileDropzone 
              label="Modelo Base" 
              onImageSelect={(img) => { setBaseImage(img); setResultImage(null); }} 
              imagePreview={baseImage} 
              className="min-h-[140px]"
            />
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">02. Ajustes de Precisión</h3>
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
              <textarea 
                value={config.specialInstructions}
                onChange={e => setConfig({...config, specialInstructions: e.target.value})}
                placeholder="Ej: Respeta las costuras y la correa del puño..."
                className="w-full h-20 bg-white border border-blue-100 rounded-xl px-4 py-3 text-[11px] focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
              />
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">03. Configuración Textil</h3>
            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button onClick={() => setConfig({...config, canopyMode: 'PATTERN'})} className={`flex-1 py-2 text-[10px] font-bold rounded-lg ${config.canopyMode === 'PATTERN' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}>ESTAMPADO</button>
              <button onClick={() => setConfig({...config, canopyMode: 'COLOR'})} className={`flex-1 py-2 text-[10px] font-bold rounded-lg ${config.canopyMode === 'COLOR' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}>LISO</button>
            </div>

            {config.canopyMode === 'PATTERN' ? (
              <div className="space-y-4">
                <FileDropzone label="Cargar Estampado" onImageSelect={setPatternImage} imagePreview={patternImage} className="min-h-[100px]" />
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase mb-1"><span>Escala</span><span>{config.patternScale}x</span></div>
                  <input type="range" min="0.1" max="5" step="0.1" value={config.patternScale} onChange={e => setConfig({...config, patternScale: parseFloat(e.target.value)})} className="w-full" />
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center space-x-4">
                <input type="color" value={config.solidColor} onChange={e => setConfig({...config, solidColor: e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer" />
                <span className="text-[10px] font-mono font-black text-gray-400 uppercase">{config.solidColor}</span>
              </div>
            )}
          </section>

          <section className="space-y-6">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">04. Hardware & Puño</h3>
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
               <div className="grid grid-cols-2 gap-3">
                  <select value={config.handleMaterial} onChange={e => setConfig({...config, handleMaterial: e.target.value as MaterialType})} className="text-[10px] font-black border border-gray-200 rounded-lg px-2 py-2 bg-white uppercase">
                    <option value="PLASTIC">PLÁSTICO</option>
                    <option value="METAL">METAL</option>
                    <option value="WOOD">MADERA</option>
                  </select>
                  <select value={config.handleFinish} onChange={e => setConfig({...config, handleFinish: e.target.value as MaterialFinish})} className="text-[10px] font-black border border-gray-200 rounded-lg px-2 py-2 bg-white uppercase">
                    <option value="MATTE">MATE</option>
                    <option value="GLOSSY">BRILLO</option>
                  </select>
               </div>
               <input type="color" value={config.handleColor} onChange={e => setConfig({...config, handleColor: e.target.value})} className="w-full h-8 rounded-md cursor-pointer border border-gray-200" />
            </div>
          </section>

          <div className="pt-6 pb-20 sticky bottom-0 bg-white border-t border-gray-100">
            {quotaExceeded && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-pulse">
                <p className="text-[9px] font-bold text-amber-800 uppercase leading-tight mb-2">
                  LÍMITE DE CUOTA EXCEDIDO
                </p>
                <p className="text-[8px] text-amber-700 leading-normal mb-3">
                  Debes usar una clave de API de un <strong>proyecto de pago</strong> de Google Cloud para renderizar sin interrupciones.
                </p>
                <div className="space-y-1.5">
                  <button onClick={handleSelectKey} className="w-full py-2 bg-amber-600 text-white rounded-lg text-[9px] font-black uppercase hover:bg-amber-700 transition-all">
                    Seleccionar Clave de Pago
                  </button>
                  <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="block text-center text-[8px] text-amber-500 underline uppercase font-bold">
                    Ver Documentación de Facturación
                  </a>
                </div>
              </div>
            )}

            <button 
              onClick={handleGenerate}
              disabled={!baseImage || state === ProcessingState.GENERATING}
              className={`w-full py-5 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] transition-all
                ${state === ProcessingState.GENERATING ? 'bg-gray-100 text-gray-300 cursor-wait' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-100'}
                ${!baseImage ? 'opacity-30 pointer-events-none' : ''}
              `}
            >
              {state === ProcessingState.GENERATING ? 'Generando Render...' : 'Actualizar Diseño'}
            </button>
            
            {error && !quotaExceeded && (
              <p className="text-[9px] text-red-500 font-bold mt-4 text-center bg-red-50 p-2 rounded border border-red-100">
                {error}
              </p>
            )}
          </div>
        </aside>

        <main className="flex-1 bg-white flex flex-col items-center justify-center p-12 relative overflow-hidden">
          <div className="w-full h-full max-w-6xl bg-gray-50/50 rounded-[3rem] border border-gray-100 flex flex-col relative overflow-hidden shadow-inner">
            <div className="flex-1 relative flex items-center justify-center p-12">
              {state === ProcessingState.GENERATING ? (
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin mx-auto mb-8"></div>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Motor Industrial Activo</h2>
                </div>
              ) : resultImage ? (
                <div className="w-full h-full flex items-center justify-center animate-in fade-in duration-1000">
                  <img src={resultImage} alt="Render Result" className="max-w-full max-h-full object-contain drop-shadow-2xl" />
                </div>
              ) : baseImage ? (
                <div className="w-full h-full flex items-center justify-center opacity-40">
                  <img src={baseImage} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                </div>
              ) : (
                <div className="text-center opacity-20">
                  <div className="w-16 h-16 bg-gray-200 rounded-2xl mx-auto mb-6"></div>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.4em]">Esperando Datos</h2>
                </div>
              )}
            </div>

            <footer className="h-14 border-t border-gray-100 bg-white/50 px-12 flex items-center justify-between text-[8px] font-black text-gray-300 uppercase tracking-[0.3em]">
              <div className="flex items-center space-x-6">
                <span>ENGINE: GEMINI 2.5 FLASH</span>
                <span className={quotaExceeded ? "text-amber-500" : "text-blue-400"}>STATUS: {state}</span>
              </div>
              <div className="flex space-x-12">
                <span>READY FOR EXPORT</span>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
