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


const blockTypeToBlockName = {
  bullet: 'Bulleted List',
  check: 'Check List',
  code: 'Code Block',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  h5: 'Heading 5',
  h6: 'Heading 6',
  number: 'Numbered List',
  paragraph: 'Normal',
  quote: 'Quote',
};


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
  blockType: string;
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
          padding: { top: 160, bottom: 160 }
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
  }, [editor])

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

  const formatHeading = (headingSize: HeadingTagType) => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapLeafNodesInElements(selection, () =>
            $createHeadingNode(headingSize),
          );
        }
      });
    } else {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapLeafNodesInElements(selection, () =>
            $createParagraphNode(),
          );
        }
      });
    }
  };

  const formatQuote = () => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapLeafNodesInElements(selection, () => $createQuoteNode());
        }
      });
    } else {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapLeafNodesInElements(selection, () =>
            $createParagraphNode(),
          );
        }
      });
    }
  };


  return (
    <>
      <div ref={referenceElementRef} className='absolute'>
        <div ref={setReferenceElement} className='h-full' />
      </div>
      <div ref={setPopperElement}
        style={styles.popper} {...attributes.popper}
        className={clsx(
          'floating-toolbar',
          primaryMouseButtonDown && 'pointer-events-none'
        )}>

        <div className={clsx(
          'text-slate-400 rounded shadow-sm px-1 py-1 bg-slate-100 flex items-center'
        )}>

          <button
            className={clsx(
              'py-2 px-3 hover:bg-slate-200 transition-colors duration-100 ease-in rounded',
              isBold ? 'bg-slate-300 text-slate-500' : 'bg-transparent'
            )}
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
            }}
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

          <span className="w-[1px] bg-slate-300 text-slate-500 block h-[30px] mx-1"></span>

          <button
            className={clsx(
              'py-2 px-3 hover:bg-slate-200 transition-colors duration-100 ease-in rounded disabled:text-slate-300 disabled:hover:bg-inherit',
              (blockType === 'h2') ? 'bg-slate-300 text-slate-500' : 'bg-transparent'
            )}
            onClick={() => formatHeading('h2')}
            disabled={!!editor._parentEditor}
          >
            <FontAwesomeIcon icon={faHeading} className='h-5' />
          </button>
          <button
            className={clsx(
              'py-2 px-3 hover:bg-slate-200 transition-colors duration-100 ease-in rounded disabled:text-slate-300 disabled:hover:bg-inherit',
              (blockType === 'h3') ? 'bg-slate-300 text-slate-500' : 'bg-transparent'
            )}
            onClick={() => formatHeading('h3')}
            disabled={!!editor._parentEditor}
          >
            <FontAwesomeIcon icon={faHeading} className='h-4' />
          </button>
          <button
            className={clsx(
              'py-2 px-3 hover:bg-slate-200 transition-colors duration-100 ease-in rounded disabled:text-slate-300 disabled:hover:bg-inherit',
              (blockType === 'quote') ? 'bg-slate-300 text-slate-500' : 'bg-transparent'
            )}
            onClick={formatQuote}
            disabled={!!editor._parentEditor}
          >
            <FontAwesomeIcon icon={faQuoteRight} className='h-5' />
          </button>
        </div>

      </div>
    </>
  );
}

function useTextFormatFloatingToolbar(
  editor: LexicalEditor,
): JSX.Element | null {
  const [isText, setIsText] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);

  const [blockType, setBlockType] =
    useState<keyof typeof blockTypeToBlockName>('paragraph');
  const [selectedElementKey, setSelectedElementKey] = useState<NodeKey | null>(
    null,
  );

  const updatePopup = useCallback(() => {
    editor.getEditorState().read(() => {
      // Should not to pop up the floating toolbar when using IME input
      if (editor.isComposing()) {
        return;
      }
      const selection = $getSelection();
      const nativeSelection = window.getSelection();
      const rootElement = editor.getRootElement();

      if (
        nativeSelection !== null &&
        (!$isRangeSelection(selection) ||
          rootElement === null ||
          !rootElement.contains(nativeSelection.anchorNode))
      ) {
        setIsText(false);
        return;
      }

      if (!$isRangeSelection(selection)) {
        return;
      }

      const node = getSelectedNode(selection);

      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));

      // Update links
      const parent = node.getParent();
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }

      ///// Added from ToolbarPlugin


      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);


      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(
            anchorNode,
            ListNode,
          );
          const type = parentList
            ? parentList.getListType()
            : element.getListType();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();

          if (type in blockTypeToBlockName) {
            setBlockType(type as keyof typeof blockTypeToBlockName);
          }
        }
      }

      ///// End added from ToolbarPlugin

      if (
        !$isCodeHighlightNode(selection.anchor.getNode()) &&
        selection.getTextContent() !== ''
      ) {
        setIsText($isTextNode(node));
      } else {
        setIsText(false);
      }
    });
  }, [editor]);

  useEffect(() => {
    document.addEventListener('selectionchange', updatePopup);
    return () => {
      document.removeEventListener('selectionchange', updatePopup);
    };
  }, [updatePopup]);

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      updatePopup();
    });
  }, [editor, updatePopup]);



  if (!isText && !isLink) {
    return null;
  }

  return (
    <>
      {
        isLink ?
          createPortal(
            <FloatingLinkEditor editor={editor} />,
            document.body,
          )
          :
          createPortal(
            <TextFormatFloatingToolbar
              editor={editor}
              isLink={isLink}
              isBold={isBold}
              isItalic={isItalic}
              blockType={blockType}
            />,
            document.body,
          )

      }

    </>
  )
}

export default function TextFormatFloatingToolbarPlugin({ editor }: { editor: LexicalEditor }): JSX.Element | null {
  //const [editor] = useLexicalComposerContext();
  return useTextFormatFloatingToolbar(editor);
}