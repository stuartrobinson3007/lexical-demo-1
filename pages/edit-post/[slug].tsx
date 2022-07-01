import React, { useEffect, useRef, useState } from 'react';

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { AutoScrollPlugin } from '@lexical/react/LexicalAutoScrollPlugin';
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import ListMaxIndentLevelPlugin from '../../components/lexical/ListMaxIndentLevelPlugin';
import ToolbarPlugin from '../../components/lexical/ToolbarPlugin';
import ExampleTheme from '../../components/lexical/Theme';
import { mergeRegister } from '@lexical/utils';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import ImagesPlugin, { INSERT_IMAGE_COMMAND } from '../../components/lexical/ImagesPlugin';
import { SharedHistoryContext } from '../../components/lexical/SharedHistoryContext';
import { ImageNode } from '../../components/lexical/ImageNode';
import { PrismaClient } from '@prisma/client';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import HorizontalRulePlugin from '../../components/lexical/HorizontalRulePlugin';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { $getSelection, CLICK_COMMAND, COMMAND_PRIORITY_CRITICAL, COMMAND_PRIORITY_LOW, SELECTION_CHANGE_COMMAND } from 'lexical';
import TextFormatFloatingToolbarPlugin from '../../components/lexical/TextFormatFloatingToolbarPlugin';

function onError(error: Error) {
    console.error(error);
}

export const Editor = ({ post }) => {

    const pageTitle = `Stuart Robinson | Create`;
    const pageDescription = "Meta description.";

    const router = useRouter();
    const { slug } = router.query;

    const [test, setTest] = useState();

    const [title, setTitle] = useState('');

    const editorRef = useRef({ current: null });

    const [hasChanged, setHasChanged] = useState(false);

    const [publishing, setPublishing] = useState(false);

    useEffect(() => {
        if (post) {
            setTitle(post.title);
            editorRef.current = post.content;
        }
    }, [post])


    const initialConfig = {
        namespace: 'MyEditor',
        theme: ExampleTheme,
        onError,
        nodes: [
            ListNode,
            ListItemNode,
            ImageNode,
            HeadingNode,
            HorizontalRuleNode,
            QuoteNode,
            LinkNode
        ]
    };

    const submitForm = async () => {
        const editor = editorRef.current;

        if (!editor.toJSON()) {
            alert('No content');
            return;
        }
        if (!title) {
            alert("No title");
            return;
        }

        setPublishing(true);

        const content = JSON.stringify(editor.toJSON());

        const data = {
            title: title,
            content: content,
            id: post.id
        }

        const JSONdata = JSON.stringify(data);

        const endpoint = '/api/Post'

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSONdata,
        }

        const response = await fetch(endpoint, options)
        const result = await response.json();
        console.log(result);

        setPublishing(false);

        if (result.success == false) {
            return;
        }

        setHasChanged(false);

    }

    const titleRef = useRef();

    const updateTitleHeight = () => {
        if (titleRef.current) {
            titleRef.current.style.height = 'inherit';
            titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
        }
    }

    useEffect(() => {
        updateTitleHeight();
    }, [title])


    useEffect(() => {
        window.addEventListener("resize", updateTitleHeight);
        return () => window.removeEventListener("resize", updateTitleHeight);
    }, []);



    const SetInitialRefPlugin = () => {
        const [editor] = useLexicalComposerContext();
        editorRef.current = editor.getEditorState();

        return null;
    }

    const [enterPressed, setEnterPressed] = useState(false);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (e.key.toLowerCase() === "enter") {
                setEnterPressed(!enterPressed);
                e.preventDefault();
            }
        }
    }

    const TestPlugin = () => {
        const [editor] = useLexicalComposerContext();

        useEffect(() => {
            // Focus the editor when the effect fires!
            editor.focus();
        }, [enterPressed]);

        return null;
    }

    return (
        <>
            <div className='fixed bg-white w-full top-0 z-50 py-2'>
                <div className='max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between'>
                    <div className='font-bold flex items-center'>
                        <div className='w-8 h-8 rounded-full overflow-hidden bg-slate-300 mr-3' />
                        Stuart Robinson
                    </div>
                    <button
                        onClick={submitForm}
                        className='w-[100px] h-[40px] flex justify-center items-center bg-slate-800 hover:bg-slate-700 text-white font-bold rounded disabled:bg-slate-500 disabled:cursor-default'
                        disabled={!hasChanged || publishing}
                    >
                        {
                            publishing ?
                                <div className='animate-spin'>
                                    <FontAwesomeIcon icon={faSpinner} className='w-5' />
                                </div>
                                :
                                <>
                                    Publish
                                </>
                        }

                    </button>
                </div>
            </div>

            <div className="bg-white relative max-w-screen-md mt-32 mx-auto px-4 sm:px-6 lg:px-0">

                {!post && <div>Loading...</div>}

                {post &&
                    <>
                        <textarea
                            className='focus:outline-none w-full overflow-hidden resize-none text-6xl leading-tight'
                            rows={1}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder='Title'
                            maxLength={100}
                            ref={titleRef}
                            tabIndex={1}
                            onDrop={(e) => { e.preventDefault(); return false; }}
                            onKeyDown={handleKeyDown}
                        />

                        <div
                            className='relative mt-8 mb-36'
                        >
                            <LexicalComposer
                                initialConfig={initialConfig}
                            >
                                <SharedHistoryContext>
                                    <ToolbarPlugin />
                                    <RichTextPlugin
                                        contentEditable={
                                            <ContentEditable
                                                className="ContentEditable__root relative min-h-[450px] outline-none resize-none"
                                                tabIndex={2} />
                                        }
                                        placeholder={
                                            <div className="absolute top-[0px] text-gray-500 left-[2px] pointer-events-none select-none">
                                                Enter some text...
                                            </div>
                                        }
                                        initialEditorState={JSON.stringify(post.content)}
                                    />
                                    <HistoryPlugin />
                                    <ListPlugin />
                                    <ImagesPlugin />
                                    <LinkPlugin />
                                    <HorizontalRulePlugin />
                                    <ListMaxIndentLevelPlugin maxDepth={7} />
                                    <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                                    <OnChangePlugin onChange={editorState => { setHasChanged(true); editorRef.current = editorState }} ignoreSelectionChange={true} />
                                    <SetInitialRefPlugin />
                                    <TestPlugin />
                                </SharedHistoryContext>
                            </LexicalComposer>
                        </div>
                    </>

                }
            </div>

        </>
    );
};


export default Editor;

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