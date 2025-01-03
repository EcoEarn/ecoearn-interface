import '@etransfer/ui-react/dist/assets/index.css';
import '@portkey/trader-react-ui/dist/assets/index.css';
import 'styles/tailwindBase.css';
import 'styles/global.css';
import 'styles/theme.css';
import Script from 'next/script';
import Layout from 'pageComponents/layout';
import Provider from 'provider';
import StyleRegistry from './StyleRegistry';
import Head from 'next/head';

export const metadata = {
  title: 'ecoearn',
  description: 'ecoearn',
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <Head>
        <link
          rel="preload"
          href="/font/Poppins-Regular.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/font/Poppins-Medium.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/font/Poppins-Bold.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <meta
          name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"
        />
      </Head>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-JER8ZTSQ19" />
      <Script src="https://telegram.org/js/telegram-web-app.js" />
      <Script id="google-analytics">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
 
          gtag('config', 'G-JER8ZTSQ19');
        `}
      </Script>
      <body>
        <StyleRegistry>
          <Provider>
            <Layout>{children}</Layout>
          </Provider>
        </StyleRegistry>
      </body>
    </html>
  );
};

export default RootLayout;
