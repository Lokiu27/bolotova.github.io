export interface GlassCardProps {
  blur?: number;
  opacity?: number;
  borderOpacity?: number;
  glowOnHover?: boolean;
  cyberCorners?: boolean;
  padding?: string;
}

export interface WebGLBackgroundProps {
  enabled?: boolean;
  particleCount?: number;
  particleSpeed?: number;
  particleColor?: string;
  fpsThreshold?: number;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface StatusPanelProps {
  status: 'online' | 'offline' | 'away';
  statusText?: string;
  showDot?: boolean;
}

export interface ScanlineOverlayProps {
  enabled?: boolean;
  opacity?: number;
  lineHeight?: number;
}
