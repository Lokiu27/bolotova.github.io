export interface DesignTokens {
  colors: {
    background: {
      void: string;
      panel: string;
      active: string;
    };
    border: {
      dim: string;
      bright: string;
    };
    accent: {
      cyan: string;
      cyanDim: string;
      cyanGlow: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
  };
  typography: {
    fontFamily: string;
    sizes: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
  };
  spacing: {
    gridUnit: string;
    sidebarWidth: string;
    topbarHeight: string;
  };
  animations: {
    transitionFast: string;
    transitionNormal: string;
    transitionSlow: string;
  };
  glassmorphism: {
    blur: string;
    opacity: number;
    borderOpacity: number;
  };
}
