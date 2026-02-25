import { ref, onMounted, onUnmounted, type Ref } from 'vue';

export interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  onIntersect?: (isIntersecting: boolean) => void;
}

export function useIntersectionObserver(
  target: Ref<Element | null>,
  options: UseIntersectionObserverOptions = {}
) {
  const isIntersecting = ref(false);
  const isSupported = ref(false);
  let observer: IntersectionObserver | null = null;

  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    onIntersect
  } = options;

  const cleanup = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  };

  const observe = () => {
    cleanup();

    if (!target.value) return;

    // Check if IntersectionObserver is supported
    if (typeof IntersectionObserver === 'undefined') {
      isSupported.value = false;
      // Fallback: assume element is always visible
      isIntersecting.value = true;
      onIntersect?.(true);
      return;
    }

    isSupported.value = true;

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isIntersecting.value = entry.isIntersecting;
          onIntersect?.(entry.isIntersecting);
        });
      },
      {
        threshold,
        root,
        rootMargin
      }
    );

    observer.observe(target.value);
  };

  onMounted(() => {
    observe();
  });

  onUnmounted(() => {
    cleanup();
  });

  return {
    isIntersecting,
    isSupported,
    observe,
    cleanup
  };
}
