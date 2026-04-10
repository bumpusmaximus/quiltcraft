export interface DMCColor {
  id: string; // e.g., 'DMC:310'
  hex: string;
  name: string;
  perceptual_hash?: string;
}

export const DMC_117_PALETTE: DMCColor[] = [
  { id: 'DMC:310', hex: '#000000', name: 'Black' },
  { id: 'DMC:B5200', hex: '#FFFFFF', name: 'Snow White' },
  { id: 'DMC:444', hex: '#FFD200', name: 'Dark Lemon Yellow' },
  { id: 'DMC:666', hex: '#E31D1C', name: 'Christmas Red' },
  { id: 'DMC:701', hex: '#3E8E41', name: 'Light Christmas Green' },
  { id: 'DMC:798', hex: '#4E81BD', name: 'Dark Delft Blue' },
  { id: 'DMC:818', hex: '#FDE8E9', name: 'Baby Pink' },
  { id: 'DMC:725', hex: '#FFC82E', name: 'Topaz - Med Light' },
  { id: 'DMC:334', hex: '#73A1C9', name: 'Baby Blue - Med' },
  { id: 'DMC:606', hex: '#FF3300', name: 'Bright Orange-Red' },
  { id: 'DMC:987', hex: '#5B7C4C', name: 'Forest Green - Dark' },
  { id: 'DMC:434', hex: '#945E31', name: 'Brown - Light' },
  { id: 'DMC:Blanc', hex: '#F9F1E2', name: 'White' },
  { id: 'DMC:Ecru', hex: '#F0EAD6', name: 'Ecru' },
  { id: 'DMC:321', hex: '#C51C2C', name: 'Christmas Red' },
  { id: 'DMC:905', hex: '#447D1C', name: 'Parrot Green - Dark' },
];

export const findDMCColor = (id: string): DMCColor | undefined => {
  return DMC_117_PALETTE.find(c => c.id === id);
};
