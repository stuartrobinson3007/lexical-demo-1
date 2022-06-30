import type { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';

const NewPost: NextPage = () => {
    const pageTitle = `Stuart Robinson | Create`;
    const pageDescription = "Meta description.";

    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('')
    const [content, setContent] = useState('');

    const submitForm = async (e: any) => {
        e.preventDefault();

        // Get data from the form.
        const data = {
            title: title,
            slug: slug,
            content: content,
        }

        // Send the data to the server in JSON format.
        const JSONdata = JSON.stringify(data)

        // API endpoint where we send form data.
        const endpoint = '/api/Post'

        // Form the request for sending data to the server.
        const options = {
            // The method is POST because we are sending data.
            method: 'POST',
            // Tell the server we're sending JSON.
            headers: {
                'Content-Type': 'application/json',
            },
            // Body of the request is the JSON data we created above.
            body: JSONdata,
        }

        // Send the form data to our forms API on Vercel and get a response.
        const response = await fetch(endpoint, options)

        // Get the response data from server as JSON.
        // If server returns the name submitted, that means the form works.
        const result = await response.json();

        console.log(result)

        if (result.success != true) {
            // Go to new blog post page
            window.location.href = `/blog/${slug}`
        }
    }

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

                    <h1 className='text-4xl font-bold'>Write a new post</h1>
                    <div className='mt-6'>
                        <form
                            onSubmit={submitForm}
                            className='grid grid-cols-1 gap-6'
                        >
                            <div className=''>
                                <label className='block text-sm font-bold mb-2'>
                                    Title
                                </label>
                                <input
                                    className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 '
                                    type='text'
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div className=''>
                                <label className='block text-sm font-bold mb-2'>
                                    Slug
                                </label>
                                <input
                                    className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 '
                                    type='text'
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                />
                            </div>
                            <div className=''>
                                <label className='block text-sm font-bold mb-2'>
                                    Content
                                </label>
                                <textarea
                                    className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 '
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                />
                            </div>
                            <div className=''>
                                <button
                                    className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline'
                                    type='submit'
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default NewPost;
