import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import getCanonicalURL from '../lib/getCanonicalURL';
import '../styles/style.css';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const canonicalURL = getCanonicalURL(router);

  return (
    <>

      <Head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="canonical" href={canonicalURL}></link>
        <meta property="og:site_name" content="NextJS" />
        <meta property="og:url" content={canonicalURL} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://image.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@sturobinson" />
        <meta name="twitter:image" content="https://image.com" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
