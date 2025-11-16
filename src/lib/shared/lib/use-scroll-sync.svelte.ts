/**
 * Composable for synchronizing scroll position across multiple viewports
 * Also persists scroll position to localStorage
 *
 * @param storageKey - Key for localStorage persistence
 * @param viewportCount - Number of viewports to sync
 * @param currentIndex - Function to get the currently active viewport index
 * @param initialized - Whether the component is initialized
 */

import { debounce } from "@/shared/event-functions";

export function useScrollSync(
  storageKey: string,
  viewportCount: number,
  getCurrentIndex: () => number,
  initialized: boolean
) {
  const isBrowser = typeof window !== "undefined";

  // Synchronized scroll position across all viewports
  let savedScrollTop = $state(0);

  // Array of viewport references
  let scrollViewportRefs = $state<(HTMLElement | null)[]>(Array(viewportCount).fill(null));

  // Load scroll position from localStorage before first render (client-side only)
  $effect.pre(() => {
    if (isBrowser && initialized) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const scrollPos = parseInt(saved, 10);
        if (!isNaN(scrollPos)) {
          savedScrollTop = scrollPos;
        }
      }
    }
  });

  // Save scroll position to localStorage whenever it changes
  $effect(() => {
    if (isBrowser && initialized && savedScrollTop > 0) {
      localStorage.setItem(storageKey, savedScrollTop.toString());
    }
  });

  // Restore saved scroll position to current viewport after initialization
  function restoreScrollPosition() {
    const currentIndex = getCurrentIndex();
    const currentViewport = scrollViewportRefs[currentIndex];

    if (currentViewport && savedScrollTop > 0) {
      currentViewport.scrollTop = savedScrollTop;
    }
  }

  // Track scroll position on the currently active viewport
  function setupScrollSync() {
    const currentIndex = getCurrentIndex();
    const currentViewport = scrollViewportRefs[currentIndex];

    if (!currentViewport) return;

    // Update saved position immediately
    const handleScroll = () => {
      if (currentViewport) {
        savedScrollTop = currentViewport.scrollTop;
      }
    };

    // Sync all viewports with debounce to avoid performance issues
    const syncAllViewports = debounce(() => {
      // Use requestAnimationFrame to batch DOM updates and sync with browser refresh
      requestAnimationFrame(() => {
        for (let i = 0; i < scrollViewportRefs.length; i++) {
          const scrollArea = scrollViewportRefs[i];
          // Don't update current viewport to avoid scroll loop
          if (scrollArea && i !== currentIndex) {
            scrollArea.scrollTop = savedScrollTop;
          }
        }
      });
    }, 150);

    currentViewport.addEventListener("scroll", handleScroll, { passive: true });
    currentViewport.addEventListener("scroll", syncAllViewports, { passive: true });

    return () => {
      currentViewport?.removeEventListener("scroll", handleScroll);
      currentViewport?.removeEventListener("scroll", syncAllViewports);
    };
  }

  return {
    get scrollViewportRefs() {
      return scrollViewportRefs;
    },
    set scrollViewportRefs(value) {
      scrollViewportRefs = value;
    },
    get savedScrollTop() {
      return savedScrollTop;
    },
    restoreScrollPosition,
    setupScrollSync,
  };
}
