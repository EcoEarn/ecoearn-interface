import { useCallback } from 'react';
import { TelegramPlatform } from '@portkey/did-ui-react';

export default function useTelegram() {
  const isInTelegram = useCallback(() => {
    return TelegramPlatform.isTelegramPlatform();
  }, []);

  return {
    isInTelegram,
  };
}
