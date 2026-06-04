import NextDocument, {
  Html, Head, Main, NextScript
} from 'next/document';
import getConfig from 'next/config';
import type { DocumentContext } from 'next/document';

interface DocumentProps {
  locale?: string;
}

async function getDocumentInitialProps(ctx: DocumentContext) {
  const initialProps = await NextDocument.getInitialProps(ctx);
  const locale = (ctx as DocumentContext & { locale?: string }).locale ?? 'vi';
  return { ...initialProps, locale };
}

function Document(props: DocumentProps) {
  const { publicRuntimeConfig } = getConfig();
  const baseUrl = publicRuntimeConfig?.SITE_URL || 'https://admin.base-code.local';
  const locale = props.locale ?? 'vi';

  return (
    <Html lang={locale}>
      <Head>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge,chrome=1" />
        <meta charSet="utf-8" />
        <link rel="icon" href="/logo.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/logo.png" />

        <meta name="language" content="Vietnamese" />
        <meta name="geo.region" content="VN" />
        <meta name="geo.placename" content="Vietnam" />
        <meta name="theme-color" content="#3b82f6" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Base Code Admin',
              url: baseUrl,
              logo: `${baseUrl}/logo.png`,
              description: 'Hệ thống quản lý kho hàng thông minh'
            })
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

Document.getInitialProps = getDocumentInitialProps;
export default Document;
