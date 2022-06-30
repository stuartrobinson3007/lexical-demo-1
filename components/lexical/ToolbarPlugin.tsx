import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
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
  SELECTION_CHANGE_COMMAND,
  NodeKey,
  $createParagraphNode,
  createEditor,
  $createTextNode,
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
} from '@lexical/selection';
import React, { useEffect, useState } from 'react';
import { INSERT_IMAGE_COMMAND } from './ImagesPlugin';
import {
  mergeRegister,
  $getNearestNodeOfType
} from '@lexical/utils';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBold, faHeading, faImage, faItalic, faLink, faMinus, faQuoteRight, faUnderline } from '@fortawesome/free-solid-svg-icons';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';

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

const ToolbarPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [isBold, setIsBold] = React.useState(false);
  const [isItalic, setIsItalic] = React.useState(false);
  const [isStrikethrough, setIsStrikethrough] = React.useState(false);
  const [isUnderline, setIsUnderline] = React.useState(false);

  const [blockType, setBlockType] =
    useState<keyof typeof blockTypeToBlockName>('paragraph');
  const [selectedElementKey, setSelectedElementKey] = useState<NodeKey | null>(
    null,
  );


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


      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = activeEditor.getElementByKey(elementKey);


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

          if ($isHeadingNode(element)) {
            console.log("in a heading")
          }
          if (type in blockTypeToBlockName) {
            setBlockType(type as keyof typeof blockTypeToBlockName);
          }
        }
      }
    }


  }, [activeEditor]);

  React.useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      })
    );
  }, [updateToolbar, editor]);


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
    <div className="text-slate-400 rounded fixed z-20 shadow-sm bottom-8 left-1/2 transform -translate-x-1/2 min-w-52 px-1 py-1 bg-slate-100 mb-2 flex items-center">


      <button
        className={clsx(
          'py-2 px-3 hover:bg-slate-200 transition-colors duration-100 ease-in rounded',
          isBold ? 'bg-slate-300 text-slate-500' : 'bg-transparent'
        )}
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
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
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
        }}
      >
        <FontAwesomeIcon icon={faItalic} className='h-5' />
      </button>
      <button
        className={clsx(
          'py-2 px-3 hover:bg-slate-200 transition-colors duration-100 ease-in rounded',
          isItalic ? 'bg-slate-300 text-slate-500' : 'bg-transparent'
        )}
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
        }}
      >
        <FontAwesomeIcon icon={faLink} className='h-5' />
      </button>

      <span className="w-[1px] bg-slate-300 text-slate-500 block h-[30px] mx-1"></span>

      <button
        className={clsx(
          'py-2 px-3 hover:bg-slate-200 transition-colors duration-100 ease-in rounded',
          (blockType === 'h2') ? 'bg-slate-300 text-slate-500' : 'bg-transparent'
        )}
        onClick={() => formatHeading('h2')}
      >
        <FontAwesomeIcon icon={faHeading} className='h-5' />
      </button>
      <button
        className={clsx(
          'py-2 px-3 hover:bg-slate-200 transition-colors duration-100 ease-in rounded',
          (blockType === 'h3') ? 'bg-slate-300 text-slate-500' : 'bg-transparent'
        )}
        onClick={() => formatHeading('h3')}
      >
        <FontAwesomeIcon icon={faHeading} className='h-4' />
      </button>
      <button
        className={clsx(
          'py-2 px-3 hover:bg-slate-200 transition-colors duration-100 ease-in rounded',
          (blockType === 'quote') ? 'bg-slate-300 text-slate-500' : 'bg-transparent'
        )}
        onClick={formatQuote}
      >
        <FontAwesomeIcon icon={faQuoteRight} className='h-5' />
      </button>
      <button
        className={clsx(
          'py-2 px-3 hover:bg-slate-200 transition-colors duration-100 ease-in rounded',
          isStrikethrough ? 'bg-slate-300 text-slate-500' : 'bg-transparent'
        )}
        onClick={() => {
          activeEditor.dispatchCommand(
            INSERT_HORIZONTAL_RULE_COMMAND,
            undefined,
          );
        }}
      >
        <FontAwesomeIcon icon={faMinus} className='h-5' />
      </button>

      <button
        className='py-2 px-3 hover:bg-slate-200 transition-colors duration-100 ease-in rounded'
        onClick={() => {
          const test = createEditor();
          /*
          test.update(() => {
            $getRoot().append(
              $createParagraphNode().append(
                $createTextNode('Hello world')
              )
            )
          });
          */

          activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND,
            {
              altText: 'image',
              src: 'https://source.unsplash.com/random',
              caption: test
            });
        }}
      >
        <FontAwesomeIcon icon={faImage} className='h-5' />
      </button>

    </div>
  );
};

export default ToolbarPlugin;