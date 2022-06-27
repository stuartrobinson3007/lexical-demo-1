import type { NextPage } from 'next';
import Head from 'next/head';

const blogData = [
  {
    title: 'Blog title 1',
    summary: 'Blog summary goes here'
  },
  {
    title: 'Blog title 2',
    summary: 'Blog summary goes here'
  },
  {
    title: 'Blog title 3',
    summary: 'Blog summary goes here'
  },
  {
    title: 'Blog title 4',
    summary: 'Blog summary goes here'
  },
  {
    title: 'Blog title 5',
    summary: 'Blog summary goes here'
  },
]

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

      <div className='mt-40 max-w-4xl m-auto'>
        <div className='grid grid-cols-3 gap-16'>
          {blogData.map((data, index) => {
            return (
              <div className='border-2 border-slate-400 rounded p-4' key={index}>
                <div className='font-bold'>{data.title}</div>
                {data.summary}
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

export default Home
