
export enum ProcessingState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type CanopyMode = 'PATTERN' | 'COLOR';
export type MaterialType = 'PLASTIC' | 'METAL' | 'WOOD';
export type MaterialFinish = 'MATTE' | 'GLOSSY';
export type WoodType = 'OAK' | 'WALNUT' | 'BAMBOO' | 'EBONY';
export type ExportFormat = 'TIFF_300' | 'PNG_72' | 'JPG_72';

export interface SavedComponent {
  id: string;
  name: string;
  imageBase64: string;
  type: 'HANDLE' | 'TIP';
}

export interface DesignConfig {
  canopyMode: CanopyMode;
  solidColor: string;
  patternScale: number;
  offsetX: number;
  offsetY: number;
  
  // Handle config
  handleImageBase64: string | null;
  handleMaterial: MaterialType;
  handleFinish: MaterialFinish;
  handleWoodType?: WoodType;
  handleColor: string;
  
  // Tip config
  tipImageBase64: string | null;
  tipMaterial: MaterialType;
  tipFinish: MaterialFinish;
  tipColor: string;
  
  // NEW: Special user instructions
  specialInstructions: string;
  
  exportFormat: ExportFormat;
}
