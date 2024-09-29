'use client';
import useNotification from 'hooks/useNotification';
import useUpdateLoginStatus from 'hooks/useUpdateLoginStatus';
import { useEffect } from 'react';

const Updater = () => {
  const notification = useNotification();
  useEffect(() => {
    window.notification = notification;
  }, [notification]);
  useUpdateLoginStatus();
  return null;
};

export default Updater;
