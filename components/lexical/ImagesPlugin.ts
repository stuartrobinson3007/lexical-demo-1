import { $createParagraphNode, $getRoot, LexicalCommand, LexicalEditor } from 'lexical';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  $createRangeSelection,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  $isRootNode,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
} from 'lexical';
import { useEffect } from 'react';
const getSelection = (): Selection | null => window.getSelection();

import {
  $createImageNode,
  $isImageNode,
  ImageNode,
  ImagePayload,
} from './ImageNode';
import React from 'react';

export type InsertImagePayload = Readonly<ImagePayload>;

let img = null;

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
  createCommand();

export default function ImagesPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {

    const TRANSPARENT_IMAGE =
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    img = document.createElement('img');
    img.src = TRANSPARENT_IMAGE;


    if (!editor.hasNodes([ImageNode])) {
      throw new Error('ImagesPlugin: ImageNode not registered on editor');
    }


    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const selection = $getSelection();
          //console.log("selection", selection);
    
          if ($isRangeSelection(selection)) {
    
            const anchorNode = selection.anchor.getNode();
            const element =
              anchorNode.getKey() === 'root'
                ? anchorNode
                : anchorNode.getTopLevelElementOrThrow();
            const elementKey = element.getKey();
            const elementDOM = editor.getElementByKey(elementKey);
    
    
            if (elementDOM !== null) {
              if ($isImageNode(element)) {
                console.log("in an image")
              }
            }
          }
        });
      }),
      editor.registerCommand<InsertImagePayload>(
        INSERT_IMAGE_COMMAND,
        (payload) => {
          const selection = $getSelection();
          const ImageNode = $createImageNode(payload);
          if ($isRangeSelection(selection)) {
            const focusNode = selection.focus.getNode();
            focusNode.getTopLevelElementOrThrow().insertAfter(ImageNode);
          } else if ($isNodeSelection(selection)) {
            const nodes = selection.getNodes();
            nodes[nodes.length - 1]
              .getTopLevelElementOrThrow()
              .insertAfter(ImageNode);
          } else {
            const root = $getRoot();
            root.append(ImageNode);
          }
          const paragraphNode = $createParagraphNode();
          ImageNode.insertAfter(paragraphNode);
          paragraphNode.select();
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand<DragEvent>(
        DRAGSTART_COMMAND,
        (event) => {
          return onDragStart(event);
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand<DragEvent>(
        DRAGOVER_COMMAND,
        (event) => {
          return onDragover(event);
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<DragEvent>(
        DROP_COMMAND,
        (event) => {
          return onDrop(event, editor);
        },
        COMMAND_PRIORITY_HIGH,
      ),
    );




  }, [editor]);

  return null;
}

function onDragStart(event: DragEvent): boolean {
  const node = getImageNodeInSelection();
  if (!node) {
    return false;
  }
  const dataTransfer = event.dataTransfer;
  if (!dataTransfer) {
    return false;
  }
  dataTransfer.setData('text/plain', '_');
  dataTransfer.setDragImage(img, 0, 0);
  dataTransfer.setData(
    'application/x-lexical-drag',
    JSON.stringify({
      data: {
        altText: node.__altText,
        caption: node.__caption,
        height: node.__height,
        key: node.getKey(),
        maxWidth: node.__maxWidth,
        showCaption: node.__showCaption,
        src: node.__src,
        width: node.__width,
      },
      type: 'image',
    }),
  );

  return true;
}

function onDragover(event: DragEvent): boolean {
  const node = getImageNodeInSelection();
  if (!node) {
    return false;
  }
  if (!canDropImage(event)) {
    event.preventDefault();
  }
  return true;
}

function onDrop(event: DragEvent, editor: LexicalEditor): boolean {
  const node = getImageNodeInSelection();
  if (!node) {
    return false;
  }
  const data = getDragImageData(event);
  if (!data) {
    return false;
  }
  event.preventDefault();
  if (canDropImage(event)) {
    const range = getDragSelection(event);
    node.remove();
    const rangeSelection = $createRangeSelection();
    if (range !== null && range !== undefined) {
      rangeSelection.applyDOMRange(range);
    }
    $setSelection(rangeSelection);
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, data);
  }
  return true;
}

function getImageNodeInSelection(): ImageNode | null {
  const selection = $getSelection();
  if (!$isNodeSelection(selection)) {
    return null;
  }
  const nodes = selection.getNodes();
  const node = nodes[0];
  return $isImageNode(node) ? node : null;
}

function getDragImageData(event: DragEvent): null | InsertImagePayload {
  const dragData = event.dataTransfer?.getData('application/x-lexical-drag');
  if (!dragData) {
    return null;
  }
  const { type, data } = JSON.parse(dragData);
  if (type !== 'image') {
    return null;
  }

  return data;
}

declare global {
  interface DragEvent {
    rangeOffset?: number;
    rangeParent?: Node;
  }
}

function canDropImage(event: DragEvent): boolean {
  const target = event.target;
  return !!(
    target &&
    target instanceof HTMLElement &&
    !target.closest('code, span.editor-image') &&
    target.parentElement &&
    target.parentElement.closest('div.ContentEditable__root')
  );
}

function getDragSelection(event: DragEvent): Range | null | undefined {
  let range;
  const domSelection = getSelection();
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(event.clientX, event.clientY);
  } else if (event.rangeParent && domSelection !== null) {
    domSelection.collapse(event.rangeParent, event.rangeOffset || 0);
    range = domSelection.getRangeAt(0);
  } else {
    throw Error(`Cannot get the selection when dragging`);
  }

  return range;
}