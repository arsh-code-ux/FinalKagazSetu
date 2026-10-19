import { useMemo, useState } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const push = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, type }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 2600);
  };

  return useMemo(() => ({ toasts, push }), [toasts]);
}
