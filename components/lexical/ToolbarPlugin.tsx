import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import clsx from 'clsx';

import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
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
  SELECTION_CHANGE_COMMAND,
  NodeKey,
  $createParagraphNode,
  createEditor,
  $createTextNode,
  LexicalEditor,
  RangeSelection,
  TextNode,
  ElementNode,
  COMMAND_PRIORITY_LOW,
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
import {
  $wrapLeafNodesInElements,
  $isAtNodeEnd,
} from '@lexical/selection';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { INSERT_IMAGE_COMMAND } from './ImagesPlugin';
import {
  mergeRegister,
  $getNearestNodeOfType
} from '@lexical/utils';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBold, faEdit, faHeading, faImage, faItalic, faLink, faMinus, faQuoteRight } from '@fortawesome/free-solid-svg-icons';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { createPortal } from 'react-dom';
import TextFormatFloatingToolbarPlugin from './TextFormatFloatingToolbarPlugin';




function getSelectedNode(selection: RangeSelection): TextNode | ElementNode {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode;
  } else {
    return $isAtNodeEnd(anchor) ? focusNode : anchorNode;
  }
}


const ToolbarPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);

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


  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        setActiveEditor(newEditor);
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor]);


  return (
    <div className="text-slate-400 rounded fixed z-20 shadow-sm bottom-8 left-1/2 transform -translate-x-1/2 px-1 py-1 bg-slate-100 mb-2 flex items-center">

      <TextFormatFloatingToolbarPlugin editor={activeEditor} />

      <button
        className='py-2 px-3 hover:bg-slate-200 transition-colors duration-100 ease-in rounded disabled:text-slate-300 disabled:hover:bg-inherit'
        onClick={() => {
          activeEditor.dispatchCommand(
            INSERT_HORIZONTAL_RULE_COMMAND,
            undefined,
          );
        }}
        disabled={!!activeEditor._parentEditor}
      >
        <FontAwesomeIcon icon={faMinus} className='h-5' />
      </button>

      <button
        className='py-2 px-3 hover:bg-slate-200 transition-colors duration-100 ease-in rounded disabled:text-slate-300 disabled:hover:bg-inherit'
        onClick={() => {
          const test = createEditor();

          activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND,
            {
              altText: 'image',
              src: 'https://source.unsplash.com/random',
              caption: test
            });
        }}
        disabled={!!activeEditor._parentEditor}
      >
        <FontAwesomeIcon icon={faImage} className='h-5' />
      </button>

    </div>
  );
};

export default ToolbarPlugin;