import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import {
    $getRoot,
    $getSelection,
    $isRangeSelection,
    FORMAT_TEXT_COMMAND,
    FORMAT_ELEMENT_COMMAND,
    UNDO_COMMAND,
    REDO_COMMAND,
    EditorState,
    KEY_TAB_COMMAND,
    COMMAND_PRIORITY_EDITOR,
    COMMAND_PRIORITY_CRITICAL,
} from 'lexical';
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
import ListMaxIndentLevelPlugin from './ListMaxIndentLevelPlugin';
import ToolbarPlugin from './ToolbarPlugin';
import ExampleTheme from './Theme';
import { $generateHtmlFromNodes } from '@lexical/html';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import ImagesPlugin, { INSERT_IMAGE_COMMAND } from './ImagesPlugin';
import { SharedHistoryContext } from './SharedHistoryContext';
import { ImageNode } from './ImageNode';

function onError(error: Error) {
    console.error(error);
}

export const Editor = () => {
    const editorStateRef = useRef();

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

    const [test, setTest] = useState();

    return (
        <>
            <div className="bg-white relative rounded-sm shadow-sm border border-gray-200 m-32">
                <LexicalComposer
                    initialConfig={initialConfig}
                >
                    <SharedHistoryContext>
                        <Toolbar />
                        <RichTextPlugin
                            contentEditable={
                                <ContentEditable className="ContentEditable__root min-h-[450px] outline-none py-6 px-5 resize-none overflow-hidden text-ellipsis" />
                            }
                            placeholder={
                                <div className="absolute top-[24px] left-[21px] pointer-events-none select-none">
                                    Enter some text...
                                </div>
                            }
                        />
                        <HistoryPlugin />
                        <ListPlugin />
                        <ImagesPlugin />
                        <ListMaxIndentLevelPlugin maxDepth={7} />
                        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                        <OnChangePlugin onChange={editorState => editorStateRef.current = editorState} />
                        <div className='bg-red-500 w-32 h-32' onClick={() => {
                            console.log('here')
                            if (editorStateRef.current) {
                                const json = JSON.stringify(editorStateRef.current.toJSON());
                                console.log(json)
                                setTest(json)
                                window.localStorage.setItem('test', json)
                            }
                        }} />
                    </SharedHistoryContext>
                </LexicalComposer>
            </div>

        </>
    );
};

const Toolbar = () => {
    const [editor] = useLexicalComposerContext();
    const [isBold, setIsBold] = React.useState(false);
    const [isItalic, setIsItalic] = React.useState(false);
    const [isStrikethrough, setIsStrikethrough] = React.useState(false);
    const [isUnderline, setIsUnderline] = React.useState(false);

    useEffect(() => {
        editor.registerCommand(
            KEY_TAB_COMMAND,
            (payload) => {
                const event = payload as KeyboardEvent;
                event.preventDefault();
                return true;
            },
            COMMAND_PRIORITY_CRITICAL,
        );

        return () => {

        }
    }, [])


    const updateToolbar = React.useCallback(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
            setIsBold(selection.hasFormat('bold'));
            setIsItalic(selection.hasFormat('italic'));
            setIsStrikethrough(selection.hasFormat('strikethrough'));
            setIsUnderline(selection.hasFormat('underline'));
        }
    }, [editor]);

    React.useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateToolbar();
                });
            })
        );
    }, [updateToolbar, editor]);



    return (
        <div className="fixed z-20 shadow bottom-8 left-1/2 transform -translate-x-1/2 min-w-52 h-10 px-2 py-2 bg-slate-800 mb-4 space-x-2 flex items-center">
            <button
                className={clsx(
                    'px-1 hover:bg-gray-700 transition-colors duration-100 ease-in',
                    isBold ? 'bg-gray-700' : 'bg-transparent'
                )}
                onClick={() => {
                    editor.dispatchCommand(INSERT_IMAGE_COMMAND, { altText: 'image', src: 'https://source.unsplash.com/random' });
                }}
            >
                *
            </button>
            <button
                className={clsx(
                    'px-1 hover:bg-gray-700 transition-colors duration-100 ease-in',
                    isBold ? 'bg-gray-700' : 'bg-transparent'
                )}
                onClick={() => {
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
                }}
            >
                B
            </button>
            <button
                className={clsx(
                    'px-1 hover:bg-gray-700 transition-colors duration-100 ease-in',
                    isStrikethrough ? 'bg-gray-700' : 'bg-transparent'
                )}
                onClick={() => {
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
                }}
            >
                S
            </button>
            <button
                className={clsx(
                    'px-1 hover:bg-gray-700 transition-colors duration-100 ease-in',
                    isItalic ? 'bg-gray-700' : 'bg-transparent'
                )}
                onClick={() => {
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
                }}
            >
                i
            </button>
            <button
                className={clsx(
                    'px-1 hover:bg-gray-700 transition-colors duration-100 ease-in',
                    isUnderline ? 'bg-gray-700' : 'bg-transparent'
                )}
                onClick={() => {
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
                }}
            >
                U
            </button>

            <span className="w-[1px] bg-gray-600 block h-full"></span>

            <button
                className={clsx(
                    'px-1 bg-transparent hover:bg-gray-700 transition-colors duration-100 ease-in'
                )}
                onClick={() => {
                    editor.dispatchCommand(UNDO_COMMAND);
                }}
            >
                O
            </button>
            <button
                className={clsx(
                    'px-1 bg-transparent hover:bg-gray-700 transition-colors duration-100 ease-in'
                )}
                onClick={() => {
                    editor.dispatchCommand(REDO_COMMAND);
                }}
            >
                O
            </button>
        </div>
    );
};


export default Editor;