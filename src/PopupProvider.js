import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import Popup from './pages/Popup';

const PopupContext = createContext({ triggerPopup: async () => {} });

export function usePopup() {
  return useContext(PopupContext);
}

export default function PopupProvider({ children }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const triggerPopup = () =>
    new Promise((resolve) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setVisible(true);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        timerRef.current = null;
        resolve();
      }, 3000);
    });

  useEffect(() => {
    triggerPopup();
  }, []);

  return (
    <PopupContext.Provider value={{ triggerPopup }}>
      {children}
      {visible && <Popup />}
    </PopupContext.Provider>
  );
}
