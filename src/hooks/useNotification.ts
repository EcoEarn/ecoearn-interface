import { NotificationContext } from 'provider';
import { useCallback, useContext, useMemo, useRef } from 'react';

interface INotificationProps {
  description: string;
  message?: string;
}

export default function useNotification() {
  const instance = useContext(NotificationContext);
  const instanceRef = useRef(instance);
  instanceRef.current = instance;

  const error = useCallback(({ message, description }: INotificationProps) => {
    if (!instanceRef.current) {
      throw new Error('useNotification must be used within a NotificationProvider');
    }
    instanceRef.current.error({
      message,
      description,
      placement: 'top',
      className: `notification-ecoearn notification-ecoearn-error ${
        !message ? 'notification-ecoearn-withoutmessage' : ''
      }`,
    });
  }, []);

  const success = useCallback(({ message, description }: INotificationProps) => {
    if (!instanceRef.current) {
      throw new Error('useNotification must be used within a NotificationProvider');
    }
    instanceRef.current.success({
      message,
      description,
      placement: 'top',
      className: `notification-ecoearn notification-ecoearn-success ${
        !message ? 'notification-ecoearn-withoutmessage' : ''
      }`,
    });
  }, []);

  const content = useMemo(() => {
    return {
      error,
      success,
    };
  }, [error, success]);

  return content;
}
