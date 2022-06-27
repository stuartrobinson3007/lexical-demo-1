import { NextRouter } from 'next/router';
const getCanonicalURL = (router: NextRouter) => {

    const CANONICAL_DOMAIN = process.env.NEXT_PUBLIC_HOST_URL;

    const _pathSliceLength = Math.min.apply(Math, [
        router.asPath.indexOf('?') > 0 ? router.asPath.indexOf('?') : router.asPath.length,
        router.asPath.indexOf('#') > 0 ? router.asPath.indexOf('#') : router.asPath.length
    ]);

    const canonicalURL = CANONICAL_DOMAIN + router.asPath.substring(0, _pathSliceLength);

    return canonicalURL;
}

export default getCanonicalURL;

