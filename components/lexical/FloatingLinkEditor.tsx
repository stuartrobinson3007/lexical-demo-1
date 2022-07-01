import { faArrowRight, faCircleMinus, faEdit, faLinkSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { LexicalEditor, $getSelection, $isRangeSelection, SELECTION_CHANGE_COMMAND, COMMAND_PRIORITY_LOW } from "lexical";
import { useRef, useState, useCallback, useEffect } from "react";
import getSelectedNode from "../../lib/lexical/getSelectedNode";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import {
    mergeRegister
} from '@lexical/utils';
import { usePopper } from "react-popper";
import clsx from "clsx";


function FloatingLinkEditor({ editor }: { editor: LexicalEditor }): JSX.Element {
    const editorRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef(null);
    const [linkUrl, setLinkUrl] = useState('');
    const [isEditMode, setEditMode] = useState(false);
    const [lastSelection, setLastSelection] = useState(null);
    const [showFloatingLink, setShowFloatingLink] = useState(false);

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

    const updateLinkEditor = useCallback(async () => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            const node = getSelectedNode(selection);
            const parent = node.getParent();
            if ($isLinkNode(parent)) {
                setLinkUrl(parent.getURL());
            } else if ($isLinkNode(node)) {
                setLinkUrl(node.getURL());
            } else {
                setLinkUrl('');
            }
        }
        const editorElem = editorRef.current;
        const nativeSelection = window.getSelection();
        const activeElement = document.activeElement;

        if (editorElem === null || !nativeSelection) {
            return;
        }

        const rootElement = editor.getRootElement();

        const elem = referenceElementRef.current;


        if (
            selection !== null &&
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

            if (elem) {
                elem.style.top = `${rect.top + window.pageYOffset}px`;
                elem.style.left = `${rect.left + window.pageXOffset}px`;
                elem.style.width = `${rect.width}px`;
                elem.style.height = `${rect.height}px`;
                setShowFloatingLink(true);

                if (update) {
                    await update();
                }
            }

            setLastSelection(selection);
        } else if ((!activeElement || !activeElement.classList.contains('link-input'))) {

            setShowFloatingLink(false);

            setLastSelection(null);
            setEditMode(false);
            setLinkUrl('');
        }

        return true;
    }, [editor, update]);

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateLinkEditor();
                });
            }),

            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    updateLinkEditor();
                    return true;
                },
                COMMAND_PRIORITY_LOW,
            ),
        );
    }, [editor, updateLinkEditor]);

    useEffect(() => {
        editor.getEditorState().read(() => {
            updateLinkEditor();
        });
    }, [editor, updateLinkEditor]);

    useEffect(() => {
        console.log("is edit mode", isEditMode)
        if (isEditMode && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditMode]);
    
    useEffect(() => {
      setEditMode(true)
    }, [])
    


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

    
    return (
        <>
            <div ref={referenceElementRef} className='absolute pointer-events-none'>
                <div ref={setReferenceElement} className='h-full' />
            </div>

            <div ref={setPopperElement}
                style={styles.popper} {...attributes.popper}
                className={clsx(
                    'floating-toolbar transition-opacity pointer-events-none',
                    showFloatingLink ? 'opacity-100 pointer-events-auto block' : 'hidden opacity-0',
                    primaryMouseButtonDown && 'pointer-events-none',
                )}>
                <div
                    ref={editorRef}
                    className='bg-slate-100 px-2 py-2 rounded shadow-sm flex items-center'
                >
                    {isEditMode ? (
                        <>
                            <input
                                ref={inputRef}
                                className='link-input min-w-[200px] pl-1 bg-transparent border-none outline-none focus:outline-none'
                                value={linkUrl}
                                onChange={(event) => {
                                    setLinkUrl(event.target.value);
                                }}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        if (lastSelection !== null) {
                                            editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl ? linkUrl : null);
                                            setEditMode(false);
                                        }
                                    } else if (event.key === 'Escape') {
                                        event.preventDefault();
                                        setEditMode(false);
                                    }
                                }}
                            />

                            <div
                                className='py-2 px-3 hover:bg-slate-200 transition-colors duration-100 ease-in rounded'
                                role="button"
                                tabIndex={0}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                    if (lastSelection !== null) {
                                            editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl ? linkUrl : null);
                                        
                                        setEditMode(false);
                                    }
                                }}
                            >
                                <FontAwesomeIcon icon={faArrowRight} className='h-4' />
                            </div>
                        </>
                    ) : (
                        <>
                            <a
                                className="min-w-[200px] pl-1 text-blue-600"
                                href={linkUrl}
                                target="_blank"
                                rel="noopener noreferrer">
                                {linkUrl}
                            </a>
                            <div
                                className='py-2 px-3 hover:bg-slate-200 transition-colors duration-100 ease-in rounded'
                                role="button"
                                tabIndex={0}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                    setEditMode(true);
                                }}
                            >
                                <FontAwesomeIcon icon={faEdit} className='h-4' />
                            </div>
                            <div
                                className='py-2 px-3 hover:bg-slate-200 transition-colors duration-100 ease-in rounded'
                                role="button"
                                tabIndex={0}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                    if (lastSelection !== null) {
                                            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
                                        
                                        setEditMode(false);
                                    }
                                }}
                            >
                                <FontAwesomeIcon icon={faLinkSlash} className='h-4' />
                            </div>
                        </>
                    )}

                </div>
            </div>
        </>
    );
}

export default FloatingLinkEditor;