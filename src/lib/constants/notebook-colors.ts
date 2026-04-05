export interface CoverColor {
  hex: string;
  labelKey: string;
}

export const COVER_COLORS: CoverColor[] = [
  { hex: '#8B4513', labelKey: 'notebooks.colors.leatherBrown' },
  { hex: '#1B2A4A', labelKey: 'notebooks.colors.darkNavy' },
  { hex: '#2D5016', labelKey: 'notebooks.colors.forestGreen' },
  { hex: '#722F37', labelKey: 'notebooks.colors.burgundy' },
  { hex: '#36454F', labelKey: 'notebooks.colors.charcoal' },
  { hex: '#4A6274', labelKey: 'notebooks.colors.slateBlue' },
  { hex: '#1A5653', labelKey: 'notebooks.colors.deepTeal' },
  { hex: '#C75B39', labelKey: 'notebooks.colors.warmTerracotta' },
];

export const DEFAULT_COVER_COLOR = '#8B4513';
