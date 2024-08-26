import Script from 'next/script';
import Layout from 'pageComponents/layout';
import 'styles/tailwindBase.css';
import 'styles/global.css';
import 'styles/theme.css';

import Provider from 'provider';

export const metadata = {
  title: 'ecoearn',
  description: 'ecoearn',
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"
        />
      </head>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-JER8ZTSQ19" />
      <Script id="google-analytics">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
 
          gtag('config', 'G-JER8ZTSQ19');
        `}
      </Script>
      <body>
        <Provider>
          <Layout>{children}</Layout>
        </Provider>
      </body>
    </html>
  );
};

export default RootLayout;
