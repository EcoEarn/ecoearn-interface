import axios from 'axios';
import { message } from 'antd';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import WalletAndTokenInfo from 'utils/walletAndTokenInfo';

interface ResponseType<T> {
  code: string;
  message: string;
  data: T;
}

class Request {
  instance: AxiosInstance;
  baseConfig: AxiosRequestConfig = { baseURL: '/api', timeout: 120000 };

  constructor(config: AxiosRequestConfig) {
    this.instance = axios.create(Object.assign({}, this.baseConfig, config));

    this.instance.interceptors.request.use(
      async (config: AxiosRequestConfig) => {
        // add token
        const baseURL = config.baseURL || '';
        if (!['/connect', '/cms'].includes(baseURL) && ['/api'].includes(baseURL)) {
          const token = await WalletAndTokenInfo.getToken(config.url || '');
          if (token) {
            config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
          }
        }
        return config;
      },
      (error) => {
        console.error(`something were wrong when fetch ${config?.url}`, error);
        return Promise.reject(error);
      },
    );

    this.instance.interceptors.response.use(
      <T>(response: AxiosResponse<ResponseType<T>>) => {
        const res = response.data;
        const { code, data, message: errorMessage } = response.data;
        if (response.config.url?.includes('api.etherscan.io')) {
          return res;
        }
        if (config.baseURL?.includes('cms')) {
          return data;
        }
        if (config.baseURL?.includes('connect')) {
          return res;
        }

        switch (code) {
          case '20000':
            return data;
          case '20001':
            return {};
          case '50000':
            return null;
          default:
            message.error(errorMessage);
            return res;
        }
      },
      (error) => {
        let errMessage = '';
        switch (error?.response?.status) {
          case 400:
            errMessage = 'Bad Request';
            break;

          case 401:
            message.error('The signature has expired. Please log in again.');
            setTimeout(() => {
              location.pathname = '/';
            }, 3000);
            break;

          case 404:
            errMessage = 'Not Found';
            break;

          case 500:
          case 501:
          case 502:
          case 503:
          case 504:
            errMessage = `${error?.response?.status}: something is wrong in server`;
            break;

          default:
            errMessage = `${error?.response?.status}: something is wrong, please try again later`;
            break;
        }

        message.error(errMessage);
        return Promise.reject(errMessage);
      },
    );
  }

  public async request(config: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.instance.request(config);
  }

  public get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get(url, config);
  }

  public post<T, R>(url: string, data?: T, config?: AxiosRequestConfig): Promise<R> {
    return this.instance.post(url, data, config);
  }

  public put<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<R> {
    return this.instance.put(url, data, config);
  }

  public delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete(url, config);
  }
}

const tokenRequest = new Request({
  baseURL: '/connect',
});

const cmsRequest = new Request({
  baseURL: '/cms',
});

export default new Request({});
export { tokenRequest, cmsRequest };
