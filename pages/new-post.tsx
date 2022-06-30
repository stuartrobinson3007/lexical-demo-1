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
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import ListMaxIndentLevelPlugin from '../components/lexical/ListMaxIndentLevelPlugin';
import ToolbarPlugin from '../components/lexical/ToolbarPlugin';
import ExampleTheme from '../components/lexical/Theme';
import { $generateHtmlFromNodes } from '@lexical/html';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import ImagesPlugin, { INSERT_IMAGE_COMMAND } from '../components/lexical/ImagesPlugin';
import { SharedHistoryContext } from '../components/lexical/SharedHistoryContext';
import { ImageNode } from '../components/lexical/ImageNode';

function onError(error: Error) {
    console.error(error);
}

export const Editor = () => {

    const pageTitle = `Stuart Robinson | Create`;
    const pageDescription = "Meta description.";

    const [test, setTest] = useState();

    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('')
    const [content, setContent] = useState('');

    const editorRef = useRef({ current: null });

    const initialConfig = {
        namespace: 'MyEditor',
        theme: ExampleTheme,
        onError,
        nodes: [
            ListNode,
            ListItemNode,
            ImageNode
        ]
    };

    const submitForm = async () => {
        const editor = editorRef.current;
        if (!editor) {
            alert('No content');
            return;
        }
        if (!title) {
            alert("No title");
            return;
        }

        const content = JSON.stringify(editor.toJSON());

        const data = {
            title: title,
            content: content,
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
        console.log(result)

        if (result.success == false) {
            return;
        }
        const slug = result.slug;
        window.location.href = `/edit-post/${slug}`;

    }

    const handleKeyDown = (e) => {
        e.target.style.height = 'inherit';
        e.target.style.height = `${e.target.scrollHeight}px`;
    }

    return (
        <>
            <div className='fixed bg-white w-full top-0 z-50 h-16'>
                <button
                    onClick={submitForm}
                    className='absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded'>
                    Submit
                </button>
            </div>


            <div className="bg-white relative max-w-3xl m-auto mt-28 px-8">

                <textarea
                    className='text-6xl focus:outline-none w-full overflow-hidden resize-none'
                    rows={1}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder='Title'
                    onKeyDown={handleKeyDown}
                    maxLength={100}
                />

                <div className='relative mt-12'>
                    <LexicalComposer
                        initialConfig={initialConfig}
                    >
                        <SharedHistoryContext>
                            <ToolbarPlugin />
                            <RichTextPlugin
                                contentEditable={
                                    <ContentEditable className="ContentEditable__root relative min-h-[450px] outline-none resize-none overflow-hidden text-ellipsis" />
                                }
                                placeholder={
                                    <div className="absolute top-[0px] text-gray-500 left-[2px] pointer-events-none select-none">
                                        Enter some text...
                                    </div>
                                }
                            />
                            <HistoryPlugin />
                            <ListPlugin />
                            <ImagesPlugin />
                            <ListMaxIndentLevelPlugin maxDepth={7} />
                            <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                            <OnChangePlugin onChange={editorState => editorRef.current = editorState} />
                        </SharedHistoryContext>
                    </LexicalComposer>
                </div>


            </div>

        </>
    );
};




export default Editor;