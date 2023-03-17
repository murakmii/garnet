import { useEffect, useState } from "react";

// ウィンドウリサイズ中はtrueになる状態を返す
export const useResizing = () => {
  const [resizing, setResizing] = useState(false);

  useEffect(() => {
    let endOfResize: NodeJS.Timeout | undefined;

    const listener = () => {
      setResizing(true);

      clearTimeout(endOfResize);
      endOfResize = setTimeout(() => {
        setResizing(false);
        endOfResize = undefined;
      }, 100);
    };

    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
  }, []);

  return resizing;
};
