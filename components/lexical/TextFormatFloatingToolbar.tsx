import { $isCodeHighlightNode } from '@lexical/code';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    $wrapLeafNodesInElements
} from '@lexical/selection';
import {
    mergeRegister,
    $getNearestNodeOfType
} from '@lexical/utils';
import {
    $createParagraphNode,
    $getSelection,
    $isRangeSelection,
    $isTextNode,
    COMMAND_PRIORITY_LOW,
    ElementNode,
    FORMAT_TEXT_COMMAND,
    LexicalEditor,
    NodeKey,
    RangeSelection,
    SELECTION_CHANGE_COMMAND,
    TextNode,
} from 'lexical';
import {
    $createHeadingNode,
    $createQuoteNode,
    $isHeadingNode,
    HeadingTagType,
} from '@lexical/rich-text';
import {
    $isListNode,
    ListNode,
} from '@lexical/list';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import clsx from 'clsx';
import { faBold, faHeading, faItalic, faLink, faQuoteRight } from '@fortawesome/free-solid-svg-icons';
import FloatingLinkEditor from './FloatingLinkEditor';
import getSelectedNode from '../../lib/lexical/getSelectedNode';
import { usePopper } from 'react-popper';
import { blockTypeToBlockName } from './ToolbarPlugin';

function TextFormatFloatingToolbar({
    editor,
    isLink,
    isBold,
    isItalic,
    blockType
}: {
    editor: LexicalEditor;
    isBold: boolean;
    isItalic: boolean;
    isLink: boolean;
    blockType: keyof typeof blockTypeToBlockName;
}): JSX.Element {

    const [referenceElement, setReferenceElement] = useState(null);
    const referenceElementRef = useRef<HTMLDivElement | null>(null);
    const [popperElement, setPopperElement] = useState(null);
    const { styles, attributes, update } = usePopper(referenceElement, popperElement, {
        placement: "top",
        modifiers: [
            {
                name: 'offset',
                options: {
                    offset: [0, 5],
                },
            },
            {
                name: 'flip',
                options: {
                    fallbackPlacements: ['top']
                },
            },
            {
                name: 'preventOverflow',
                options: {
                    rootBoundary: 'viewport',
                    altAxis: true,
                    tether: false,
                    padding: { top: 160, bottom: 160, left: 10, right: 10 }
                },
            }]
    });

    const updateTextFormatFloatingToolbar = useCallback(async () => {
        const selection = $getSelection();

        const nativeSelection = window.getSelection();

        if (referenceElementRef.current === null) {
            return;
        }

        const rootElement = editor.getRootElement();

        if (
            selection !== null &&
            nativeSelection !== null &&
            !nativeSelection.isCollapsed &&
            rootElement !== null &&
            rootElement.contains(nativeSelection.anchorNode)
        ) {
            const domRange = nativeSelection.getRangeAt(0);
            let rect;

            if (nativeSelection.anchorNode === rootElement) {
                let inner = rootElement;
                while (inner.firstElementChild != null) {
                    inner = inner.firstElementChild as HTMLElement;
                }
                rect = inner.getBoundingClientRect();
            } else {
                rect = domRange.getBoundingClientRect();
            }

            const elem = referenceElementRef.current

            if (elem) {
                elem.style.top = `${rect.top + window.pageYOffset}px`;
                elem.style.left = `${rect.left + window.pageXOffset}px`;
                elem.style.width = `${rect.width}px`;
                elem.style.height = `${rect.height}px`;

                if (update) {
                    await update();
                }
            }

        }
    }, [editor, update]);

    const [primaryMouseButtonDown, setPrimaryMouseButtonDown] = useState(false)

    useEffect(() => {

        function setPrimaryButtonState(e: MouseEvent) {
            if (e.type == 'mousedown') {
                if (e.target.closest('.floating-toolbar')) {
                    e.stopPropagation();
                    return;
                }
            }

            var flags = e.buttons !== undefined ? e.buttons : e.which;
            setPrimaryMouseButtonDown((flags & 1) === 1);
        }

        document.addEventListener("mousedown", setPrimaryButtonState);
        document.addEventListener("mousemove", setPrimaryButtonState);
        document.addEventListener("mouseup", setPrimaryButtonState);

        return () => {

        }
    }, [editor]);

    useEffect(() => {
        editor.getEditorState().read(() => {
            updateTextFormatFloatingToolbar();
        });
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateTextFormatFloatingToolbar();
                });
            }),

            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {

                    updateTextFormatFloatingToolbar();
                    return false;
                },
                COMMAND_PRIORITY_LOW,
            ),
        );
    }, [editor, updateTextFormatFloatingToolbar]);

    const insertLink = useCallback(async () => {
        if (!isLink) {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, 'https://');
        } else {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
        }
    }, [editor, isLink]);



    return (
        <>
            <div ref={referenceElementRef} className='absolute pointer-events-none'>
                <div ref={setReferenceElement} className='h-full' />
            </div>
            <div ref={setPopperElement}
                style={styles.popper} {...attributes.popper}
                className={clsx(
                    'floating-toolbar',
                    primaryMouseButtonDown && 'pointer-events-none'
                )}>

                <div className='text-slate-400 rounded shadow-sm px-1 py-1 bg-slate-100 flex items-center'>

                    <button
                        className={clsx(
                            'py-2 px-3 hover:bg-slate-200 transition-colors duration-100 ease-in rounded disabled:text-slate-200',
                            isBold ? 'bg-slate-300 text-slate-500' : 'bg-transparent'
                        )}
                        onClick={() => {
                            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
                        }}
                        disabled={blockType == ('h2' || 'h3')}
                    >
                        <FontAwesomeIcon icon={faBold} className='h-5' />
                    </button>
                    <button
                        className={clsx(
                            'py-2 px-3 hover:bg-slate-200 transition-colors duration-100 ease-in rounded',
                            isItalic ? 'bg-slate-300 text-slate-500' : 'bg-transparent'
                        )}
                        onClick={() => {
                            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
                        }}
                    >
                        <FontAwesomeIcon icon={faItalic} className='h-5' />
                    </button>
                    <button
                        className={clsx(
                            'py-2 px-3 hover:bg-slate-200 transition-colors duration-100 ease-in rounded',
                            isLink ? 'bg-slate-300 text-slate-500' : 'bg-transparent'
                        )}
                        onClick={insertLink}
                    >
                        <FontAwesomeIcon icon={faLink} className='h-5' />
                    </button>
                </div>

            </div>
        </>
    );
}

export default TextFormatFloatingToolbar;