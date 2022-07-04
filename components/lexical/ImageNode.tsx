import {
  $isRangeSelection,
  $isTextNode,
  EditorConfig,
  ElementNode,
  GridSelection,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ARROW_UP_COMMAND,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  NodeSelection,
  RangeSelection,
  SerializedEditor,
  SerializedLexicalNode,
  Spread,
  TextNode,
} from 'lexical';


import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  createEditor,
  DecoratorNode,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
} from 'lexical';
import * as React from 'react';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

import {
  $isAtNodeEnd,
} from '@lexical/selection';
import {
  $isHeadingNode
} from '@lexical/rich-text';

export interface ImagePayload {
  altText: string;
  caption?: LexicalEditor;
  height?: number;
  key?: NodeKey;
  showCaption?: boolean;
  src: string;
  width?: number;
}

const imageCache = new Set();

function useSuspenseImage(src: string) {
  if (!imageCache.has(src)) {
    throw new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        imageCache.add(src);
        resolve(null);
      };
    });
  }
}

function LazyImage({
  altText,
  className,
  imageRef,
  src,
  width,
  height,
}: {
  altText: string;
  className: string | null;
  height: 'inherit' | number;
  imageRef: { current: null | HTMLImageElement };
  src: string;
  width: 'inherit' | number;
}): JSX.Element {
  useSuspenseImage(src);
  return (
    <img
      className={className || undefined}
      src={src}
      alt={altText}
      ref={imageRef}
      style={{
        height,
        width,
      }}
      draggable="false"
    />
  );
}

function ImageComponent({
  src,
  altText,
  nodeKey,
  width,
  height,
  showCaption,
  caption,
}: {
  altText: string;
  caption: LexicalEditor;
  height: 'inherit' | number;
  nodeKey: NodeKey;
  showCaption: boolean;
  src: string;
  width: 'inherit' | number;
}): JSX.Element {
  const ref = useRef(null);
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const [editor] = useLexicalComposerContext();
  const [selection, setSelection] = useState<
    RangeSelection | NodeSelection | GridSelection | null
  >(null);

  // Remove the image and select the node before it
  const deleteImage = useCallback(
    (payload: KeyboardEvent) => {

      // Check that we've got the image selected
      if (isSelected && $isNodeSelection($getSelection())) {

        // Prevent any default keyboard action as we want to handle the node removal manually
        const event: KeyboardEvent = payload;
        event.preventDefault();

        // Get the node, check it's an image, remove it, and select the node before it so the user can keep typing
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) {
          deselectBackwards(payload);
          node.remove();
          return true;
        }
        setSelected(false);
      }
      return false;

    },
    [isSelected, nodeKey, setSelected],
  );

  // If the user presses backspace, left, or up
  // We want to check if we're selecting the node after the image and we want to move the selection to the image
  // Or check if we're selecting the image and we want to move the selection to the node before it
  const onBack = useCallback(
    (payload: KeyboardEvent) => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {

        // This currently only works properly when the user presses backspace or left because the following line tries to make sure that the caret is at the start of the line.
        // E.g. the caret is at the start of the line that is directly after the image, so pressing backspace or left will select the image above.
        if (selection.anchor.offset > 0) {
          return false;
        }
        // Additionally to that check, we also want the up key to select the image above if the caret is on the first line of the following paragraph.
        /* E.g.
        if (payload.key = 'ArrowUp' && !selection.anchor.notOnFirstLine()) {
          return false;
        }
        */

        let anchorNode: (TextNode | ElementNode | null) = selection.anchor.getNode();

        // If the anchor node is a text node, we need to get the parent node to get the image node above it using getPreviousSibling()
        if ($isTextNode(anchorNode) || $isHeadingNode(anchorNode)) {
          anchorNode = anchorNode.getParent() ? anchorNode.getParent() : null;
        }
        if (!anchorNode) return false;

        // Select the image node above the current node
        const previousKey = anchorNode.getPreviousSibling()?.getKey();
        if (previousKey === nodeKey) {
          setSelected(true);

          const event: KeyboardEvent = payload;
          event.preventDefault();
          return true;
        }
      }

      // If we've reached this point, it means that we're not in a range selection
      // That means we might be in a node selection which might be this image
      if (payload.key == 'Backspace') {
        // If we're handling a backspace key press, run the delete function to see if we're trying to delete this image
        return deleteImage(payload);
      } else {
        // Otherwise we're handling a left or up key press so we want to deselect the image and select the node above it
        return deselectBackwards(payload);
      }
    }, [isSelected, nodeKey, setSelected]);

  // If the user presses delete, right, or down
  // We want to check if we're selecting the node before the image and we want to move the selection to the image
  // Or check if we're selecting the image and we want to move the selection to the node after it
  const onForwards = useCallback(
    (payload: KeyboardEvent) => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {

        // This currently only works properly when the user presses delete or right because the following line tries to make sure that the caret is at the end of the line.
        // E.g. the caret is at the end of the line that is directly before the image, so pressing delete or right will select the image above.
        if (!$isAtNodeEnd(selection.anchor)) {
          return false;
        }
        // Additionally to that check, we also want the down key to select the image below if the caret is on the last line of the paragraph right before it.
        /* E.g.
        if (payload.key = 'ArrowDown' && !selection.anchor.notOnLastLine()) {
          return false;
        }
        */

        let anchorNode: (TextNode | ElementNode | null) = selection.anchor.getNode();

        // If the anchor node is a text node, we need to get the parent node to get the image node above it using getNextSibling()
        if ($isTextNode(anchorNode) || $isHeadingNode(anchorNode)) {
          anchorNode = anchorNode.getParent() ? anchorNode.getParent() : null;
        }
        if (!anchorNode) return false;

        // Select the image node below the current node
        const nextKey = anchorNode.getNextSibling()?.getKey();

        if (nextKey === nodeKey) {
          setSelected(true);

          const event: KeyboardEvent = payload;
          event.preventDefault();
          return true;
        }
      }

      // If we've reached this point, it means that we're not in a range selection
      // That means we might be in a node selection which might be this image
      if (payload.key == 'Delete') {
        // If we're handling a backspace key press, run the delete function to see if we're trying to delete this image
        return deleteImage(payload);
      } else {
        // Otherwise we're handling a right or down key press so we want to deselect the image and select the node above it
        return deselectForwards(payload);
      }

    }, [isSelected, nodeKey, setSelected]);

  // Select the node below the current image
  const deselectForwards = useCallback(
    (payload: KeyboardEvent) => {
      const selection = $getSelection();

      if (isSelected && $isNodeSelection(selection)) {
        const event: KeyboardEvent = payload;
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) {
          const nextSibling = node.getNextSibling();

          if (nextSibling !== null) {
            node.selectNext();
            return true;
          }
        }
      }
      return false;
    }, [isSelected, nodeKey, setSelected]);

  // Select the node above the current image
  const deselectBackwards = useCallback(
    (payload: KeyboardEvent) => {
      const selection = $getSelection();

      if (isSelected && $isNodeSelection(selection)) {
        const event: KeyboardEvent = payload;
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) {
          const previousSibling = node.getPreviousSibling();

          if (previousSibling !== null) {
            node.selectPrevious();
            return true;
          }
        }
      }
      return false;

    }, [isSelected, nodeKey, setSelected]);


  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        setSelection(editorState.read(() => $getSelection()));
      }),
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        (payload) => {
          const event = payload;

          if (event.target === ref.current) {
            if (!event.shiftKey) {
              clearSelection();
            }
            setSelected(true);
            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        onForwards,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        onBack,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ARROW_LEFT_COMMAND,
        onBack,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        onBack,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ARROW_RIGHT_COMMAND,
        onForwards,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        onForwards,
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [
    clearSelection,
    editor,
    isSelected,
    nodeKey,
    setSelected,
  ]);

  const draggable = isSelected && $isNodeSelection(selection);
  const isFocused = ($isNodeSelection(selection) && (isSelected));


  return (
    <Suspense fallback={null}>
      <>
        <div
          draggable={draggable}
          className="image-wrapper"
        >
          <LazyImage
            className={isFocused ? 'focused' : null}
            src={src}
            altText={altText}
            imageRef={ref}
            width={width}
            height={height}
          />
        </div>

      </>
    </Suspense>
  );
}


export type SerializedImageNode = Spread<
  {
    altText: string;
    caption: SerializedEditor;
    height?: number;
    showCaption: boolean;
    src: string;
    width?: number;
    type: 'image';
    version: 1;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width: 'inherit' | number;
  __height: 'inherit' | number;
  __showCaption: boolean;
  __caption: LexicalEditor;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__showCaption,
      node.__caption,
      node.__key,
    );
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { altText, height, width, caption, src, showCaption } =
      serializedNode;
    const node = $createImageNode({
      altText,
      height,
      showCaption,
      src,
      width,
    });
    const nestedEditor = node.__caption;
    const editorState = nestedEditor.parseEditorState(caption.editorState);
    if (!editorState.isEmpty()) {
      nestedEditor.setEditorState(editorState);
    }
    return node;
  }

  constructor(
    src: string,
    altText: string,
    width?: 'inherit' | number,
    height?: 'inherit' | number,
    showCaption?: boolean,
    caption?: LexicalEditor,
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width || 'inherit';
    this.__height = height || 'inherit';
    this.__showCaption = showCaption || false;
    this.__caption = caption || createEditor();
  }

  exportJSON(): SerializedImageNode {
    return {
      altText: this.getAltText(),
      caption: this.__caption.toJSON(),
      height: this.__height === 'inherit' ? 0 : this.__height,
      showCaption: this.__showCaption,
      src: this.getSrc(),
      type: 'image',
      version: 1,
      width: this.__width === 'inherit' ? 0 : this.__width,
    };
  }

  setWidthAndHeight(
    width: 'inherit' | number,
    height: 'inherit' | number,
  ): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  setShowCaption(showCaption: boolean): void {
    const writable = this.getWritable();
    writable.__showCaption = showCaption;
  }

  // View

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  decorate(): JSX.Element {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        nodeKey={this.getKey()}
        showCaption={this.__showCaption}
        caption={this.__caption}
      />
    );
  }
}

export function $createImageNode({
  altText,
  height,
  src,
  width,
  showCaption,
  caption,
  key,
}: ImagePayload): ImageNode {
  return new ImageNode(
    src,
    altText,
    width,
    height,
    showCaption,
    caption,
    key,
  );
}

export function $isImageNode(
  node: LexicalNode | null | undefined,
): node is ImageNode {
  return node instanceof ImageNode;
}