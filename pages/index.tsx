import type { NextPage } from 'next';
import Head from 'next/head';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

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
];

type IHome = {
  allPosts: any
}

const Home: NextPage<IHome> = ({ allPosts }) => {
  const pageTitle = "Stuart Robinson | Home";
  const pageDescription = "Meta description.";

  const _allPosts = JSON.parse(allPosts);

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
          {_allPosts.map((data, index) => {
            return (
              <Link href={`/blog/${data.slug}`} key={index}>
                <a className='border-2 border-slate-400 rounded p-4 hover:bg-slate-100'>
                  <div className='font-bold'>{data.title}</div>
                </a>
              </Link>
            )
          })}
        </div>

        <div className='mt-12 flex justify-center'>
          <Link href='/new-post'>
            <a className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline'>
              Create a new post
            </a>
          </Link>
        </div>
      </div>

    </div >
  )
}

export default Home;


// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export async function getStaticProps() {
  const prisma = new PrismaClient();
  const allPosts = JSON.stringify(await prisma.post.findMany());

  return {
    props: { allPosts },
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 10 seconds
    revalidate: 1000
  }
}
