import React, { createContext, useContext, useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

type NotificationType = 'success' | 'error';

interface Notification {
  type: NotificationType;
  message: string;
}

interface NotificationContextType {
  showNotification: (type: NotificationType, message: string) => void;
  notification: Notification | null;
}

const NotificationContext = createContext<NotificationContextType>({
  showNotification: () => {},
  notification: null,
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotification = (type: NotificationType, message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <NotificationContext.Provider value={{ showNotification, notification }}>
      {children}
      {notification && (
        <div className="fixed top-4 right-4 animate-fade-in">
          <div
            className={`flex items-center gap-2 p-4 rounded-lg border ${
              notification.type === 'success'
                ? 'bg-green-500/20 border-green-500 text-green-500'
                : 'bg-red-500/20 border-red-500 text-red-500'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);