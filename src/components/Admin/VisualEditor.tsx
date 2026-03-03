import React, { useCallback, useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { Markdown } from 'tiptap-markdown';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  Image as ImageIcon, 
  Link as LinkIcon,
  Heading1,
  Heading2,
  Undo,
  Redo
} from 'lucide-react';
import { AssetPicker } from './AssetSelector';
import { useAssets } from '../../hooks/useAssets';
import { useLanguage } from '../../hooks/useLanguage';

/** Tiptap storage shape for the markdown extension */
interface MarkdownStorage {
  markdown: {
    getMarkdown: () => string;
  };
}

interface VisualEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export const VisualEditor: React.FC<VisualEditorProps> = ({ content, onChange }) => {
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const { resolveAsset } = useAssets();
  const { t } = useLanguage();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        validate: (url) => /^https?:\/\//.test(url) || url.startsWith('audio:') || url.startsWith('video:'),
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Markdown,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange((editor.storage as unknown as MarkdownStorage).markdown.getMarkdown());
    },
  });

  const selectMedia = (id: string) => {
    const asset = resolveAsset(id);
    if (!asset) return;

    const filename = asset.name || t('mediaLabel');
    
    if (asset.type === 'image') {
      editor?.chain().focus().setImage({ src: id }).run();
    } else if (asset.type === 'audio') {
      // Use the custom markdown syntax for audio
      editor?.chain().focus().insertContent(`[Audio: ${filename}](audio:${id})`).run();
    } else if (asset.type === 'video') {
      // Use the custom markdown syntax for video
      editor?.chain().focus().insertContent(`[Video: ${filename}](video:${id})`).run();
    } else {
      editor?.chain().focus().setLink({ href: id }).insertContent(filename).run();
    }
    setShowAssetPicker(false);
  };

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  useEffect(() => {
    if (editor && !editor.isFocused && content !== (editor.storage as unknown as MarkdownStorage).markdown?.getMarkdown()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const MenuButton = ({ onClick, isActive, children, title }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded hover:bg-neutral-100 transition-colors ${
        isActive ? 'bg-neutral-200 text-primary-600' : 'text-neutral-600'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="border rounded-md overflow-hidden bg-white relative">
      <div className="flex flex-wrap gap-1 p-2 border-b bg-neutral-50">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title={t('bold')}
        >
          <Bold className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title={t('italic')}
        >
          <Italic className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title={t('underline')}
        >
          <UnderlineIcon className="h-4 w-4" />
        </MenuButton>
        <div className="w-px h-6 bg-neutral-300 mx-1" />
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title={t('heading1')}
        >
          <Heading1 className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title={t('heading2')}
        >
          <Heading2 className="h-4 w-4" />
        </MenuButton>
        <div className="w-px h-6 bg-neutral-300 mx-1" />
        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title={t('bulletList')}
        >
          <List className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title={t('orderedList')}
        >
          <ListOrdered className="h-4 w-4" />
        </MenuButton>
        <div className="w-px h-6 bg-neutral-300 mx-1" />
        <MenuButton onClick={setLink} isActive={editor.isActive('link')} title={t('link')}>
          <LinkIcon className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={() => setShowAssetPicker(true)} title={t('insertMedia')}>
          <ImageIcon className="h-4 w-4" />
        </MenuButton>
        <div className="w-px h-6 bg-neutral-300 mx-1" />
        <MenuButton onClick={() => editor.chain().focus().undo().run()} title={t('undo')}>
          <Undo className="h-4 w-4" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().redo().run()} title={t('redo')}>
          <Redo className="h-4 w-4" />
        </MenuButton>
      </div>

      <AssetPicker
        isOpen={showAssetPicker}
        onClose={() => setShowAssetPicker(false)}
        onSelect={selectMedia}
        assetType="all"
      />

      <EditorContent 
        editor={editor} 
        className="prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none"
      />
      <style>{`
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
        }
      `}</style>
    </div>
  );
};
