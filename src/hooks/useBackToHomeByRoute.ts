import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { NEED_LOGIN_PAGE } from 'constants/router';

const useBackToHomeByRoute = () => {
  const pathname = usePathname();
  const router = useRouter();
  const backToHomeByRoute = useCallback(() => {
    try {
      const firstPathName = '/' + pathname.split('/')[1];
      if (NEED_LOGIN_PAGE.includes(firstPathName)) {
        router.push('/');
      }
    } catch (e) {
      console.log(e);
    }
  }, [pathname, router]);

  return backToHomeByRoute;
};

export default useBackToHomeByRoute;
