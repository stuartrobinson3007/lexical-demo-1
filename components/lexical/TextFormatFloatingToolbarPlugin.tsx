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
import TextFormatFloatingToolbar from './TextFormatFloatingToolbar';
import { blockTypeToBlockName } from './ToolbarPlugin';


export default function TextFormatFloatingToolbarPlugin({
  editor,
  blockType
}: {
  editor: LexicalEditor,
  blockType: keyof typeof blockTypeToBlockName
}): JSX.Element | null {
  const [isText, setIsText] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);


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


      if (selection.getTextContent() !== '') {
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