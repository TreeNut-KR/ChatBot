import { useEffect, useState } from 'react';

const useResponsiveScale = () => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const width = window.innerWidth;

      if (width >= 3840) {
        setScale(1.5); // UHD
      } else if (width >= 2560) {
        setScale(1.25); // QHD
      } else {
        setScale(1); // FHD or lower
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);

    return () => {
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  return scale;
};

export default useResponsiveScale;