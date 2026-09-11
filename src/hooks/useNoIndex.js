import { useEffect } from 'react';

/**
 * Custom hook to dynamically add <meta name="robots" content="noindex, nofollow" />
 * when sensitive pages (Admin, Login) are active, and clean up when leaving.
 */
export function useNoIndex() {
  useEffect(() => {
    let metaTag = document.querySelector('meta[name="robots"]');
    const previousContent = metaTag ? metaTag.getAttribute('content') : null;

    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = 'robots';
      document.head.appendChild(metaTag);
    }

    metaTag.setAttribute('content', 'noindex, nofollow');

    return () => {
      if (previousContent !== null) {
        metaTag.setAttribute('content', previousContent);
      } else {
        metaTag.setAttribute('content', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
      }
    };
  }, []);
}

export default useNoIndex;
