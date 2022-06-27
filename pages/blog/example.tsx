import type { NextPage } from 'next';
import Head from 'next/head';

const blogData = {
    title: 'Blog title 5',
    summary: 'Blog summary goes here',
    content: 'Blog content goes here'
}

const Post: NextPage = () => {
    const pageTitle = `Stuart Robinson | ${blogData.title}`;
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
                <div className=''>

                    <h1 className='text-4xl font-bold'>{blogData.title}</h1>
                    <div className='mt-6'>
                        {blogData.content}
                    </div>
                </div>
            </div>

        </div>
    )
}

export default Post;
