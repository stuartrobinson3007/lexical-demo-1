import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import clsx from 'clsx';

import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $createCodeNode, $isCodeNode, registerCodeHighlighting } from '@lexical/code';

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
  $getNodeByKey,
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
import React, { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { INSERT_IMAGE_COMMAND } from './ImagesPlugin';
import {
  mergeRegister,
  $getNearestNodeOfType
} from '@lexical/utils';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBold, faCode, faEdit, faHeading, faImage, faItalic, faLink, faMinus, faQuoteRight } from '@fortawesome/free-solid-svg-icons';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { createPortal } from 'react-dom';
import TextFormatFloatingToolbarPlugin from './TextFormatFloatingToolbarPlugin';


export const blockTypeToBlockName = {
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

const CODE_LANGUAGE_OPTIONS: [string, string][] = [
  ['', '- Select language -'],
  ['c', 'C'],
  ['clike', 'C-like'],
  ['css', 'CSS'],
  ['html', 'HTML'],
  ['js', 'JavaScript'],
  ['markdown', 'Markdown'],
  ['objc', 'Objective-C'],
  ['plain', 'Plain Text'],
  ['py', 'Python'],
  ['rust', 'Rust'],
  ['sql', 'SQL'],
  ['swift', 'Swift'],
  ['xml', 'XML'],
];

const CODE_LANGUAGE_MAP = {
  javascript: 'js',
  md: 'markdown',
  plaintext: 'plain',
  python: 'py',
  text: 'plain',
};

const ToolbarPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);


  const [blockType, setBlockType] =
    useState<keyof typeof blockTypeToBlockName>('paragraph');
  const [selectedElementKey, setSelectedElementKey] = useState<NodeKey | null>(
    null,
  );

  const [isCode, setIsCode] = useState(false);

  const [codeLanguage, setCodeLanguage] = useState<string>('');


  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = activeEditor.getElementByKey(elementKey);


      setIsCode(selection.hasFormat('code'));


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

          if ($isCodeNode(element)) {
            const language =
              element.getLanguage() as keyof typeof CODE_LANGUAGE_MAP;
            setCodeLanguage(
              language ? CODE_LANGUAGE_MAP[language] || language : '',
            );
            return;
          }
        }
      }
    }
  }, [activeEditor]);

  const updateTabListener = useCallback(() => {
    return (blockType !== 'code');
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateTabListener();
        });
      }),

      editor.registerCommand(
        KEY_TAB_COMMAND,
        (payload) => {
          const event = payload as KeyboardEvent;

          const inCodeBlock = updateTabListener();

          if (inCodeBlock) {
            event.preventDefault();
            return true;
          }
        },
        COMMAND_PRIORITY_CRITICAL,
      )
    );
  }, [editor, updateTabListener]);


  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        updateToolbar();
        setActiveEditor(newEditor);
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, updateToolbar]);

  useEffect(() => {
    return mergeRegister(
      activeEditor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
    );
  }, [activeEditor, updateToolbar]);

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

  const formatCode = () => {
    if (blockType !== 'code') {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          if (selection.isCollapsed()) {
            $wrapLeafNodesInElements(selection, () => $createCodeNode());
          } else {
            const textContent = selection.getTextContent();
            const codeNode = $createCodeNode();
            selection.insertNodes([codeNode]);
            selection.insertRawText(textContent);
          }
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

  const onCodeLanguageSelect = useCallback(
    (e: ChangeEvent) => {
      activeEditor.update(() => {
        if (selectedElementKey !== null) {
          const node = $getNodeByKey(selectedElementKey);
          if ($isCodeNode(node)) {
            node.setLanguage((e.target as HTMLSelectElement).value);
          }
        }
      });
    },
    [activeEditor, selectedElementKey],
  );

  return (
    <div className="text-slate-400 rounded fixed z-20 shadow-sm bottom-8 left-1/2 transform -translate-x-1/2 px-1 py-1 bg-slate-100 mb-2 flex items-center">

      <TextFormatFloatingToolbarPlugin
        editor={activeEditor}
        blockType={blockType}
        isCode={isCode}
      />


      <button
        className='py-2 px-3 hover:bg-slate-200 transition-colors duration-100 ease-in rounded disabled:text-slate-300 disabled:hover:bg-inherit'
        onClick={formatCode}
        disabled={!!activeEditor._parentEditor}
      >
        <FontAwesomeIcon icon={faCode} className='h-5' />
      </button>
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


      <span className="w-[1px] bg-slate-300 text-slate-500 block h-[30px] mx-1"></span>

      <button
        className={clsx(
          'py-2 px-3 hover:bg-slate-200 transition-colors duration-100 ease-in rounded disabled:text-slate-300 disabled:hover:bg-inherit',
          (blockType === 'h2') ? 'bg-slate-300 text-slate-500' : 'bg-transparent'
        )}
        onClick={() => formatHeading('h2')}
        disabled={!!activeEditor._parentEditor}
      >
        <FontAwesomeIcon icon={faHeading} className='h-5' />
      </button>
      <button
        className={clsx(
          'py-2 px-3 hover:bg-slate-200 transition-colors duration-100 ease-in rounded disabled:text-slate-300 disabled:hover:bg-inherit',
          (blockType === 'h3') ? 'bg-slate-300 text-slate-500' : 'bg-transparent'
        )}
        onClick={() => formatHeading('h3')}
        disabled={!!activeEditor._parentEditor}
      >
        <FontAwesomeIcon icon={faHeading} className='h-4' />
      </button>
      <button
        className={clsx(
          'py-2 px-3 hover:bg-slate-200 transition-colors duration-100 ease-in rounded disabled:text-slate-300 disabled:hover:bg-inherit',
          (blockType === 'quote') ? 'bg-slate-300 text-slate-500' : 'bg-transparent'
        )}
        onClick={formatQuote}
        disabled={!!activeEditor._parentEditor}
      >
        <FontAwesomeIcon icon={faQuoteRight} className='h-5' />
      </button>



      {/*
        blockType === 'code' && (
          <>
            <Select
              className="toolbar-item code-language"
              onChange={onCodeLanguageSelect}
              options={CODE_LANGUAGE_OPTIONS}
              value={codeLanguage}
            />
            <i className="chevron-down inside" />
          </>
        )
        */
      }
    </div>
  );
};

export default ToolbarPlugin;