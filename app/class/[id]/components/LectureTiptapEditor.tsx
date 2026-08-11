'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { NodeSelection, TextSelection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import { App, Button, Divider, Select, Tooltip, Upload } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  LinkOutlined,
  DisconnectOutlined,
  PictureOutlined,
  UndoOutlined,
  RedoOutlined,
  ClearOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import { useEffect, useRef } from 'react';
import {
  getImageUploadRejectMessage,
  getImageUploadRejectReason,
  uploadSessionImage,
  type UploadedImage,
} from '@/lib/utils/upload-session-image';
import { getErrorMessage } from '@/lib/utils/get-error-message';
import {
  LectureImage,
  type LectureImageAlign,
} from './lecture-image-extension';
import styles from './lecture-editor.module.scss';

type Props = {
  value: string;
  onChange: (html: string) => void;
  onImageUploaded?: (file: UploadedImage) => void;
  disabled?: boolean;
};

type BlockValue = 'paragraph' | 'h1' | 'h2' | 'h3';

function getBlockValue(editor: {
  isActive: (name: string, attrs?: Record<string, unknown>) => boolean;
}): BlockValue {
  if (editor.isActive('heading', { level: 1 })) return 'h1';
  if (editor.isActive('heading', { level: 2 })) return 'h2';
  if (editor.isActive('heading', { level: 3 })) return 'h3';
  return 'paragraph';
}

function moveCursorAfterImageSelection(view: EditorView): boolean {
  const { state } = view;
  const { selection, schema, doc } = state;
  if (!(selection instanceof NodeSelection) || selection.node.type.name !== 'image') {
    return false;
  }

  const insertAt = selection.to;
  const paragraph = schema.nodes.paragraph;
  if (!paragraph) return false;

  let tr = state.tr;
  const nodeAfter = doc.nodeAt(insertAt);
  if (!nodeAfter || !nodeAfter.isTextblock) {
    tr = tr.insert(insertAt, paragraph.create());
  }
  const $pos = tr.doc.resolve(Math.min(insertAt + 1, tr.doc.content.size));
  tr = tr.setSelection(TextSelection.near($pos, 1)).scrollIntoView();
  view.dispatch(tr);
  return true;
}

function moveCursorAfterImage(editor: Editor): boolean {
  return moveCursorAfterImageSelection(editor.view);
}

function isTypingKey(event: KeyboardEvent): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  if (event.key === 'Enter') return true;
  if (event.key.length === 1) return true;
  return false;
}

export function LectureTiptapEditor({ value, onChange, onImageUploaded, disabled }: Props) {
  const { message } = App.useApp();
  const skipEmit = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Placeholder.configure({
        placeholder: 'Viết nội dung bài giảng…',
      }),
      Link.configure({ openOnClick: false, autolink: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      LectureImage.configure({
        inline: false,
        allowBase64: false,
        resize: {
          enabled: true,
          directions: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
          minWidth: 80,
          minHeight: 80,
          alwaysPreserveAspectRatio: true,
        },
      }),
    ],
    content: value || '',
    editable: !disabled,
    editorProps: {
      attributes: {
        class: 'tiptap',
      },
      handleKeyDown: (view, event) => {
        const { selection } = view.state;
        if (!(selection instanceof NodeSelection) || selection.node.type.name !== 'image') {
          return false;
        }
        if (event.key === 'Backspace' || event.key === 'Delete') return false;
        if (!isTypingKey(event)) return false;

        moveCursorAfterImageSelection(view);

        if (event.key === 'Enter') {
          return true;
        }
        if (event.key.length === 1) {
          view.dispatch(view.state.tr.insertText(event.key));
          return true;
        }
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (skipEmit.current) return;
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((value || '') !== current) {
      skipEmit.current = true;
      editor.commands.setContent(value || '', { emitUpdate: false });
      skipEmit.current = false;
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  const insertImage = async (file: File) => {
    const reason = getImageUploadRejectReason(file);
    if (reason) {
      message.error(getImageUploadRejectMessage(reason));
      return;
    }
    try {
      const uploaded = await uploadSessionImage(file);
      editor?.chain().focus().setImage({ src: uploaded.url, alt: uploaded.name }).run();
      if (editor) moveCursorAfterImage(editor);
      onImageUploaded?.(uploaded);
      onChange(editor?.getHTML() ?? '');
    } catch (error: unknown) {
      message.error(getErrorMessage(error, 'Tải ảnh thất bại'));
    }
  };

  const setBlock = (next: BlockValue) => {
    if (!editor) return;
    const chain = editor.chain().focus();
    if (next === 'paragraph') {
      chain.setParagraph().run();
      return;
    }
    const level = next === 'h1' ? 1 : next === 'h2' ? 2 : 3;
    chain.toggleHeading({ level }).run();
  };

  const setLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL liên kết', previous || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const setAlign = (align: LectureImageAlign) => {
    if (!editor) return;
    if (editor.isActive('image')) {
      const attrs = editor.getAttributes('image') as {
        width?: number | null;
        height?: number | null;
      };
      const nextAttrs: Record<string, unknown> = {
        align,
        ...(align === 'left' || align === 'right' ? { offsetX: 0 } : {}),
      };

      if (align === 'left' || align === 'right') {
        const editorWidth = editor.view.dom.clientWidth || 640;
        const maxFloatW = Math.max(120, Math.floor(editorWidth * 0.42));
        const currentW = typeof attrs.width === 'number' ? attrs.width : null;
        if (currentW == null || currentW > maxFloatW) {
          nextAttrs.width = maxFloatW;
          if (typeof attrs.width === 'number' && typeof attrs.height === 'number' && attrs.width > 0) {
            nextAttrs.height = Math.max(40, Math.round((attrs.height * maxFloatW) / attrs.width));
          }
        }
      }

      editor.chain().focus().updateAttributes('image', nextAttrs).run();
      moveCursorAfterImage(editor);
      return;
    }
    editor.chain().focus().setTextAlign(align).run();
  };

  if (!editor) return null;

  const blockValue = getBlockValue(editor);
  const canUndo = editor.can().undo();
  const canRedo = editor.can().redo();
  const imageSelected = editor.isActive('image');
  const imageAlign = (editor.getAttributes('image').align as LectureImageAlign | undefined) ?? 'center';
  const isAlignActive = (align: LectureImageAlign) => {
    if (imageSelected) return imageAlign === align;
    return editor.isActive({ textAlign: align });
  };

  return (
    <div className={styles.tiptapShell}>
      <div className={styles.tiptapToolbar}>
        <div className={styles.toolbarGroup}>
          <Tooltip title="Hoàn tác">
            <Button
              size="small"
              icon={<UndoOutlined />}
              disabled={disabled || !canUndo}
              onClick={() => editor.chain().focus().undo().run()}
            />
          </Tooltip>
          <Tooltip title="Làm lại">
            <Button
              size="small"
              icon={<RedoOutlined />}
              disabled={disabled || !canRedo}
              onClick={() => editor.chain().focus().redo().run()}
            />
          </Tooltip>
        </div>

        <Divider orientation="vertical" className={styles.toolbarDivider} />

        <Upload
          accept="image/*"
          showUploadList={false}
          beforeUpload={(file) => {
            void insertImage(file);
            return false;
          }}
          disabled={disabled}
        >
          <Button size="small" icon={<PictureOutlined />} disabled={disabled}>
            Thêm ảnh
          </Button>
        </Upload>

        <Divider orientation="vertical" className={styles.toolbarDivider} />

        <Select
          size="small"
          className={styles.blockSelect}
          value={blockValue}
          disabled={disabled}
          onChange={setBlock}
          options={[
            { value: 'paragraph', label: 'Đoạn văn' },
            { value: 'h1', label: 'Tiêu đề 1' },
            { value: 'h2', label: 'Tiêu đề 2' },
            { value: 'h3', label: 'Tiêu đề 3' },
          ]}
        />

        <Divider orientation="vertical" className={styles.toolbarDivider} />

        <div className={styles.toolbarGroup}>
          <Tooltip title="Đậm">
            <Button
              size="small"
              icon={<BoldOutlined />}
              disabled={disabled}
              type={editor.isActive('bold') ? 'primary' : 'default'}
              onClick={() => editor.chain().focus().toggleBold().run()}
            />
          </Tooltip>
          <Tooltip title="Nghiêng">
            <Button
              size="small"
              icon={<ItalicOutlined />}
              disabled={disabled}
              type={editor.isActive('italic') ? 'primary' : 'default'}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            />
          </Tooltip>
          <Tooltip title="Gạch dưới">
            <Button
              size="small"
              icon={<UnderlineOutlined />}
              disabled={disabled}
              type={editor.isActive('underline') ? 'primary' : 'default'}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            />
          </Tooltip>
          <Tooltip title="Gạch ngang">
            <Button
              size="small"
              icon={<StrikethroughOutlined />}
              disabled={disabled}
              type={editor.isActive('strike') ? 'primary' : 'default'}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            />
          </Tooltip>
        </div>

        <Divider orientation="vertical" className={styles.toolbarDivider} />

        <div className={styles.toolbarGroup}>
          <Tooltip title="Danh sách dấu đầu dòng">
            <Button
              size="small"
              icon={<UnorderedListOutlined />}
              disabled={disabled}
              type={editor.isActive('bulletList') ? 'primary' : 'default'}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            />
          </Tooltip>
          <Tooltip title="Danh sách đánh số">
            <Button
              size="small"
              icon={<OrderedListOutlined />}
              disabled={disabled}
              type={editor.isActive('orderedList') ? 'primary' : 'default'}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            />
          </Tooltip>
          <Tooltip title="Trích dẫn">
            <Button
              size="small"
              disabled={disabled}
              type={editor.isActive('blockquote') ? 'primary' : 'default'}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              “ ”
            </Button>
          </Tooltip>
          <Tooltip title="Đường kẻ ngang">
            <Button
              size="small"
              icon={<MinusOutlined />}
              disabled={disabled}
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
            />
          </Tooltip>
        </div>

        <Divider orientation="vertical" className={styles.toolbarDivider} />

        <div className={styles.toolbarGroup}>
          <Tooltip title={imageSelected ? 'Ảnh trái — chữ ôm phải (gõ ở đoạn sau ảnh)' : 'Căn trái'}>
            <Button
              size="small"
              icon={<AlignLeftOutlined />}
              disabled={disabled}
              type={isAlignActive('left') ? 'primary' : 'default'}
              onClick={() => setAlign('left')}
            />
          </Tooltip>
          <Tooltip title={imageSelected ? 'Ảnh giữa — một hàng' : 'Căn giữa'}>
            <Button
              size="small"
              icon={<AlignCenterOutlined />}
              disabled={disabled}
              type={isAlignActive('center') ? 'primary' : 'default'}
              onClick={() => setAlign('center')}
            />
          </Tooltip>
          <Tooltip title={imageSelected ? 'Ảnh phải — chữ ôm trái (gõ ở đoạn sau ảnh)' : 'Căn phải'}>
            <Button
              size="small"
              icon={<AlignRightOutlined />}
              disabled={disabled}
              type={isAlignActive('right') ? 'primary' : 'default'}
              onClick={() => setAlign('right')}
            />
          </Tooltip>
        </div>

        <Divider orientation="vertical" className={styles.toolbarDivider} />

        <div className={styles.toolbarGroup}>
          <Tooltip title="Chèn / sửa liên kết">
            <Button
              size="small"
              icon={<LinkOutlined />}
              disabled={disabled}
              type={editor.isActive('link') ? 'primary' : 'default'}
              onClick={setLink}
            />
          </Tooltip>
          <Tooltip title="Gỡ liên kết">
            <Button
              size="small"
              icon={<DisconnectOutlined />}
              disabled={disabled || !editor.isActive('link')}
              onClick={() => editor.chain().focus().unsetLink().run()}
            />
          </Tooltip>
          <Tooltip title="Xóa định dạng">
            <Button
              size="small"
              icon={<ClearOutlined />}
              disabled={disabled}
              onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            />
          </Tooltip>
        </div>
      </div>
      <EditorContent editor={editor} className={styles.tiptapContent} />
    </div>
  );
}
