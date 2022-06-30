import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { PrismaClient } from '@prisma/client';
import { useRouter } from 'next/router';
import ImagesPlugin from '../../components/lexical/ImagesPlugin';
import { ListItemNode, ListNode } from "@lexical/list";
import { ImageNode } from '../../components/lexical/ImageNode';
import ExampleTheme from '../../components/lexical/Theme';

function onError(error: Error) {
  console.error(error);
}

const Post = ({ post }) => {
  const router = useRouter();
  const { slug } = router.query;

  console.log(post)

  const initialConfig = {
    namespace: 'MyEditor',
    theme: ExampleTheme,
    onError,
    nodes: [
      ListNode,
      ListItemNode,
      ImageNode
    ],
    readOnly: true
  };

  return (
    // `slug` is defined after hydrating client-side
    slug && post &&
    <>
      <div className='mt-40 max-w-4xl m-auto'>
        <div className=''>
          <h1 className='text-4xl font-bold'>{post.title}</h1>
          <div className='mt-2'>
            <div className='text-gray-700'>{post.author.name}</div>
          </div>
          <div className='mt-6'>
            <div className=''>

              <LexicalComposer
                initialConfig={initialConfig}
              >
                <RichTextPlugin
                  contentEditable={
                    <ContentEditable className="ContentEditable__root relative min-h-[450px] outline-none resize-none overflow-hidden text-ellipsis" />
                  }
                  placeholder={
                    <></>
                  }
                  initialEditorState={JSON.stringify(post.content)}
                />
                <HistoryPlugin />
                <ListPlugin />
                <ImagesPlugin />
              </LexicalComposer>
            </div>
          </div>
        </div>
      </div>

    </>
  )
}

export default Post;

export async function getStaticPaths() {
  return { paths: [], fallback: true }
}

export async function getStaticProps({ params }) {
  const { slug } = params;

  try {
    const prisma = new PrismaClient();
    const post = await prisma.post.findUnique({
      where: {
        slug: slug,
      },
      include: {
        author: true
      },
    });

    post.createdAt = post?.createdAt.toString();
    post.updatedAt = post?.createdAt.toString();

    return post ? { props: { post } } : { notFound: true }
  } catch (error) {
    console.error(error)
    return { notFound: true }
  }
}