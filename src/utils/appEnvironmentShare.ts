export interface IResponse<T = any> {
  status: number;
  msg?: string;
  code?: number;
  data?: T;
}

export interface ISocialShareParams {
  url: string;
  message: string;
  ctw?: 'offline' | 'onLine' | 'local';
  serviceURI?: string;
}

export interface IClient {
  invokeClientMethod(
    request: IRequest<ISocialShareParams>,
    callback: (args: IResponse) => void,
  ): void;
}

export interface IRequest<T> {
  type: string;
  params?: T;
}

export const appEnvironmentShare = ({ shareContent }: { shareContent: string }) => {
  const isAPPEnvironment = !!window?.portkeyShellApp;

  if (isAPPEnvironment) {
    const app = window?.portkeyShellApp as IClient;
    const request: IRequest<ISocialShareParams> = {
      type: 'socialShare',
      params: { url: shareContent, message: shareContent },
    };

    app.invokeClientMethod(request, (args: IResponse) => {
      if (args.status === 1) {
        // share success;
      } else {
        // share failed;
      }
    });
  } else {
    throw new Error('Non-app environment');
  }
};
