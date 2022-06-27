import type { NextPage } from 'next';
import Head from 'next/head';

const Home: NextPage = () => {
  const pageTitle = "Stuart Robinson | Home";
  const pageDescription = "Meta description.";

  return (
    <div>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="keywords" content="keyword, keyword" />
      </Head>

      <div className='mt-12'>
        Hello world
      </div>

    </div>
  )
}

export default Home
