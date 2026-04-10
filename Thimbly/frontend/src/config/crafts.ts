export interface CraftMetadata {
  id: string;
  name: string;
  description: string;
  defaultGridSize: { width: number; height: number };
  featureFlags: {
    enableQuiltSeamMath: boolean;
    enableKnitGauge: boolean;
    enableDMCPrudentialCheck: boolean;
  };
}

export const CRAFT_CONFIGS: Record<string, CraftMetadata> = {
  cross_stitch: {
    id: 'cross_stitch',
    name: 'Cross Stitch',
    description: 'Traditional x-shaped embroidery patterns using DMC floss.',
    defaultGridSize: { width: 50, height: 50 },
    featureFlags: {
      enableQuiltSeamMath: false,
      enableKnitGauge: false,
      enableDMCPrudentialCheck: true,
    },
  },
  quilt: {
    id: 'quilt',
    name: 'Quilting',
    description: 'Precision fabric block patterns with seam allowance overlays.',
    defaultGridSize: { width: 40, height: 40 },
    featureFlags: {
      enableQuiltSeamMath: true,
      enableKnitGauge: false,
      enableDMCPrudentialCheck: false,
    },
  },
  knit: {
    id: 'knit',
    name: 'Knitting',
    description: 'Textile patterns with stitch symbols and row counters.',
    defaultGridSize: { width: 30, height: 45 },
    featureFlags: {
      enableQuiltSeamMath: false,
      enableKnitGauge: true,
      enableDMCPrudentialCheck: false,
    },
  },
};
