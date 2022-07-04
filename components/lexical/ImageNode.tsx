import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isElementNode,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_HIGH,
  EditorConfig,
  ElementNode,
  GridSelection,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
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
import { LexicalNestedComposer } from '@lexical/react/LexicalNestedComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
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

import { useSharedHistoryContext } from './SharedHistoryContext';
import ImagesPlugin from './ImagesPlugin';
import ContentEditable from './ContentEditable';
import Placeholder from './Placeholder';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import clsx from 'clsx';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { faAnchorLock } from '@fortawesome/free-solid-svg-icons';
import {
  $isAtNodeEnd,
} from '@lexical/selection';
import {
  $isHeadingNode
} from '@lexical/rich-text';
import { triggerAsyncId } from 'async_hooks';

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

  const captionRef = useRef(null);

  const [captionSelected, setCaptionSelected] = useState(false);

  const deleteImage = useCallback(
    (payload: KeyboardEvent) => {

      if (isSelected && $isNodeSelection($getSelection())) {
        const event: KeyboardEvent = payload;
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) {

          unselectBackwards(payload);
          node.remove();
          return true;
        }
        setSelected(false);
      }
      return false;

    },
    [isSelected, nodeKey, setSelected],
  );

  const onBack = useCallback(
    (payload: KeyboardEvent) => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {

        if (selection.anchor.offset > 0) {
          return false;
        }

        let anchorNode: (TextNode | ElementNode | null) = selection.anchor.getNode();

        if ($isTextNode(anchorNode) || $isHeadingNode(anchorNode)) {
          anchorNode = anchorNode.getParent() ? anchorNode.getParent() : null;
        }
        if (!anchorNode) return false;

        const previousKey = anchorNode.getPreviousSibling()?.getKey();

        if (previousKey === nodeKey) {
          setSelected(true);
          setCaptionSelected(true);

          const event: KeyboardEvent = payload;
          event.preventDefault();
          return true;
        }
      }

      if (payload.key == 'Backspace') {
        return deleteImage(payload);
      } else {
        return unselectBackwards(payload);
      }
    }, [isSelected, nodeKey, setSelected]);

  const onDelete = useCallback(
    (payload: KeyboardEvent) => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {

        if (!$isAtNodeEnd(selection.anchor)) {
          return false;
        }

        let anchorNode: (TextNode | ElementNode | null) = selection.anchor.getNode();

        if ($isTextNode(anchorNode) || $isHeadingNode(anchorNode)) {
          anchorNode = anchorNode.getParent() ? anchorNode.getParent() : null;
        }
        if (!anchorNode) return false;

        const nextKey = anchorNode.getNextSibling()?.getKey();

        if (nextKey === nodeKey) {
          setSelected(true);
          setCaptionSelected(true);

          const event: KeyboardEvent = payload;
          event.preventDefault();
          return true;
        }
      }

      return deleteImage(payload);

    }, [isSelected, nodeKey, setSelected]);

  const unselectBackwards = useCallback(
    (payload: KeyboardEvent) => {
      const selection = $getSelection();

      if (isSelected && $isNodeSelection(selection)) {
        const event: KeyboardEvent = payload;
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) {
          const previousSibling = node.getPreviousSibling();
          console.log("here ok")

          if (previousSibling !== null) {
            console.log("here ok????")
            node.selectPrevious();
            setCaptionSelected(false);
            return true;
          }
        }
      }
      return false;

    }, [isSelected, nodeKey, setSelected]);

  const onForwards = useCallback(
    (payload: KeyboardEvent) => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {

        console.log($isAtNodeEnd(selection.anchor))
        if (!$isAtNodeEnd(selection.anchor)) {
          return false;
        }

        let anchorNode: (TextNode | ElementNode | null) = selection.anchor.getNode();
        if ($isTextNode(anchorNode) || $isHeadingNode(anchorNode)) {
          anchorNode = anchorNode.getParent() ? anchorNode.getParent() : null;
        }
        if (!anchorNode) return false;

        const nextKey = anchorNode.getNextSibling()?.getKey();

        if (nextKey === nodeKey) {
          setSelected(true);
          setCaptionSelected(true);

          const event: KeyboardEvent = payload;
          event.preventDefault();
          return true;
        }
      }

      if (isSelected && $isNodeSelection(selection)) {
        const event: KeyboardEvent = payload;
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) {
          const nextSibling = node.getNextSibling();

          if (nextSibling !== null) {
            node.selectNext();
            setCaptionSelected(false);
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

          if (captionRef.current && (event.target.closest('.image-caption-container') === captionRef.current)) {
            setCaptionSelected(true)
            return true;
          }

          if (event.target === ref.current) {
            if (!event.shiftKey) {
              clearSelection();
            }
            setSelected(true);
            setCaptionSelected(true);
            return true;
          }
          setCaptionSelected(false)

          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        onDelete,
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
    onDelete,
    setSelected,
  ]);

  const setShowCaption = (show: boolean) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        node.setShowCaption(show);
      }
    });
  };

  const { historyState } = useSharedHistoryContext();

  const draggable = isSelected && $isNodeSelection(selection);
  const isFocused = ($isNodeSelection(selection) && (isSelected));

  const TestPlugin = () => {

    const [nestedEditor] = useLexicalComposerContext();

    useEffect(() => {
      return mergeRegister(
        nestedEditor.registerUpdateListener(({ editorState }) => {
          editorState.read(() => {
            const root = $getRoot();
            if (!root.getFirstChild() || root.getFirstChild()?.isEmpty()) {
              setShowCaption(false);
            } else {
              setShowCaption(true);
            }

            const selection = $getSelection();
            console.log("selected nested");

            if ($isRangeSelection(selection)) {
            }
          });
        }),
      );
    }, [
      nestedEditor
    ]);

    return null;
  }

  const OnEnterPlugin = ({ }) => {
    const [nestedEditor] = useLexicalComposerContext();

    useEffect(() => {
      return nestedEditor.registerCommand(
        KEY_ENTER_COMMAND,
        (e: KeyboardEvent) => {
          e.preventDefault();
          return true;
        },
        COMMAND_PRIORITY_CRITICAL,
      );
    }, [nestedEditor]);

    return null;
  }

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

          <div
            className={
              clsx("image-caption-container",
                (captionSelected || showCaption) ? "show" : null)
            }
            ref={captionRef}
          >
            <LexicalNestedComposer
              initialEditor={caption}
            >
              <ImagesPlugin />

              <RichTextPlugin
                contentEditable={
                  <ContentEditable className="ImageNode__contentEditable" />
                }
                placeholder={
                  <Placeholder className="ImageNode__placeholder">
                    Image caption (optional)
                  </Placeholder>
                }
                // TODO Remove after it's inherited from the parent (LexicalComposer)
                initialEditorState={null}
              />
              <HistoryPlugin />
              <TestPlugin />
              <LinkPlugin />
              <OnEnterPlugin />
            </LexicalNestedComposer>
          </div>
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