import React, {  } from 'react';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import {LinkNode} from '@lexical/link';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import ListMaxIndentLevelPlugin from '../components/lexical/ListMaxIndentLevelPlugin';
import ToolbarPlugin from '../components/lexical/ToolbarPlugin';
import ExampleTheme from '../components/lexical/Theme';

import ImagesPlugin from '../components/lexical/ImagesPlugin';
import { SharedHistoryContext } from '../components/lexical/SharedHistoryContext';
import { ImageNode } from '../components/lexical/ImageNode';
import HorizontalRulePlugin from '../components/lexical/HorizontalRulePlugin';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import CodeHighlightPlugin from '../components/lexical/CodeHighlightPlugin';

import * as content from './demo.json';

function onError(error: Error) {
    console.error(error);
}

export const Editor = () => {


    const initialConfig = {
        namespace: 'MyEditor',
        theme: ExampleTheme,
        onError,
        nodes: [
            ListNode,
            ListItemNode,
            ImageNode,
            LinkNode,
            HeadingNode,
            HorizontalRuleNode,
            QuoteNode,
            CodeNode,
            CodeHighlightNode
        ]
    };

    return (
        <div className='bg-white border-slate-200 relative max-w-screen-md mt-32 mx-auto px-4 sm:px-6 lg:px-0'>

            
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
                                    className='ContentEditable__root relative min-h-[450px] outline-none resize-none' />
                            }
                            placeholder={
                                <div className='absolute top-[0px] text-gray-500 left-[2px] pointer-events-none select-none'>
                                    Enter some text...
                                </div>
                            }
                            initialEditorState={JSON.stringify(content)}
                        />
                        <HistoryPlugin />
                        <CodeHighlightPlugin />
                        <ListPlugin />
                        <ImagesPlugin />
                        <LinkPlugin />
                        <HorizontalRulePlugin />
                        <ListMaxIndentLevelPlugin maxDepth={7} />
                        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />

                    </SharedHistoryContext>
                </LexicalComposer>
            </div>
        </div>
    );
};


export default Editor;