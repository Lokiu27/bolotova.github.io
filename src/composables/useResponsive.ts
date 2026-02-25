import { ref, computed, onMounted, onUnmounted } from 'vue';

/**
 * Breakpoint definitions
 */
export interface Breakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

/**
 * Responsive state
 */
export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

const DEFAULT_BREAKPOINTS: Breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1024,
};

/**
 * Debounce utility function
 */
function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * Composable for responsive design
 * 
 * Provides reactive breakpoints and debounced resize listener
 * 
 * @param breakpoints - Custom breakpoint values (optional)
 * @param debounceDelay - Debounce delay in ms (default: 300)
 * @returns Reactive responsive state and utilities
 * 
 * @example
 * ```ts
 * const { isMobile, isTablet, isDesktop, width } = useResponsive();
 * ```
 */
export function useResponsive(
  breakpoints: Breakpoints = DEFAULT_BREAKPOINTS,
  debounceDelay: number = 300
) {
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : 0);
  const height = ref(typeof window !== 'undefined' ? window.innerHeight : 0);

  // Reactive breakpoint checks
  const isMobile = computed(() => width.value < breakpoints.mobile);
  const isTablet = computed(
    () => width.value >= breakpoints.mobile && width.value < breakpoints.tablet
  );
  const isDesktop = computed(() => width.value >= breakpoints.desktop);

  // Update dimensions
  const updateDimensions = () => {
    width.value = window.innerWidth;
    height.value = window.innerHeight;
  };

  // Debounced resize handler
  const debouncedResize = debounce(updateDimensions, debounceDelay);

  // Lifecycle hooks
  onMounted(() => {
    updateDimensions();
    window.addEventListener('resize', debouncedResize);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', debouncedResize);
  });

  return {
    // Reactive state
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    
    // Utilities
    breakpoints,
  };
}
