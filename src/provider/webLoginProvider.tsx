import { WebLoginProvider, init } from '@aelf-web-login/wallet-adapter-react';
import useWebLoginConfig from 'hooks/useWebLoginConfig';

export default function App({ children }: { children: React.ReactNode }) {
  const config = useWebLoginConfig();
  const bridgeAPI = init(config);
  return <WebLoginProvider bridgeAPI={bridgeAPI}>{children}</WebLoginProvider>;
}
