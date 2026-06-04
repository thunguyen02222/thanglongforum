import React, { useRef, useEffect, useCallback } from 'react';
import {
  Bold, Italic, Code, Link2, Paperclip,
  List, ListOrdered, Quote, Minus
} from 'lucide-react';
import { fileService } from '@services/file.service';

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function RichEditor({
  value, onChange, placeholder = 'Nhập nội dung...', minHeight = 220
}: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);
  const hasInitialized = useRef(false);

  // Sync external value → editor
  useEffect(() => {
    if (!editorRef.current) return;
    // Reset form
    if (value === '' && editorRef.current.innerHTML !== '') {
      editorRef.current.innerHTML = '';
      hasInitialized.current = false;
    }
    // Gán nội dung ban đầu (khi edit câu hỏi)
    if (value && !hasInitialized.current && editorRef.current.innerHTML === '') {
      editorRef.current.innerHTML = value;
      hasInitialized.current = true;
    }
  }, [value]);

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    triggerChange();
  };

  const triggerChange = useCallback(() => {
    if (!editorRef.current) return;
    isInternalUpdate.current = true;
    onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (!file) continue;

        fileService.upload(file, 'image').then((uploaded) => {
          const imgUrl = (uploaded as any).data?.url || (uploaded as any).url || (uploaded as any).path || '';
          const img = `<br/><img src="${imgUrl}" style="max-width:100%;border-radius:8px;margin:8px 0;" alt="ảnh đính kèm" /><br/>`;
          editorRef.current?.focus();
          document.execCommand('insertHTML', false, img);
          triggerChange();
        }).catch(() => {});
        return;
      } if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          fileService.upload(file, 'document').then((uploaded) => {
            const fileUrl = uploaded.url || (uploaded as any).path || '';
            const link = `<br/><a href="${fileUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;color:#334155;font-weight:600;font-size:14px;text-decoration:none;margin:8px 0;">📎 ${file.name}</a><br/>`;
            editorRef.current?.focus();
            document.execCommand('insertHTML', false, link);
            triggerChange();
          }).catch(() => {});
          return;
        }
      }
    }

    // Paste text: strip HTML formatting từ bên ngoài, giữ nguyên text
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type === 'text/plain') {
          e.preventDefault();
          const text = e.clipboardData.getData('text/plain');
          document.execCommand('insertText', false, text);
          triggerChange();
          return;
        }
      }
    }
  }, [triggerChange]);

  const handleInput = useCallback(() => {
    triggerChange();
  }, [triggerChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Tab → indent
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
      triggerChange();
    }
  };

  const insertLink = () => {
    const url = prompt('Nhập URL:');
    if (url) exec('createLink', url);
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-slate-50 border-b border-gray-200">
        <ToolBtn title="Bold (Ctrl+B)" onClick={() => exec('bold')}>
          <Bold className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Italic (Ctrl+I)" onClick={() => exec('italic')}>
          <Italic className="w-4 h-4" />
        </ToolBtn>
        <Sep />
        <ToolBtn title="Danh sách chấm" onClick={() => exec('insertUnorderedList')}>
          <List className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Danh sách số" onClick={() => exec('insertOrderedList')}>
          <ListOrdered className="w-4 h-4" />
        </ToolBtn>
        <Sep />
        <ToolBtn title="Trích dẫn" onClick={() => exec('formatBlock', 'blockquote')}>
          <Quote className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Code inline" onClick={() => exec('formatBlock', 'pre')}>
          <Code className="w-4 h-4" />
        </ToolBtn>
        <Sep />
        <ToolBtn title="Chèn link" onClick={insertLink}>
          <Link2 className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn
          title="Đính kèm tệp / ảnh"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            input.onchange = (ev) => {
              const file = (ev.target as HTMLInputElement).files?.[0];
              if (!file) return;

              const isImage = file.type.startsWith('image/');
              if (isImage) {
                fileService.upload(file, 'image').then((uploaded: any) => {
                  const fileUrl = (uploaded as any).data?.url || (uploaded as any).url || (uploaded as any).path || '';
                  const img = `<br/><img src="${fileUrl}" style="max-width:100%;border-radius:8px;margin:8px 0;" alt="${file.name}" /><br/>`;
                  editorRef.current?.focus();
                  document.execCommand('insertHTML', false, img);
                  triggerChange();
                }).catch(() => {});
              } else {
                fileService.upload(file, 'document').then((uploaded: any) => {
                  const fileUrl = (uploaded as any).data?.url || (uploaded as any).url || (uploaded as any).path || '';
                  const link = `<br/><a href="${fileUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;color:#334155;font-weight:600;font-size:14px;text-decoration:none;margin:8px 0;">📎 ${file.name}</a><br/>`;
                  editorRef.current?.focus();
                  document.execCommand('insertHTML', false, link);
                  triggerChange();
                }).catch(() => {});
              }
            };
            input.click();
          }}
        >
          <Paperclip className="w-4 h-4" />
        </ToolBtn>
        <Sep />
        <ToolBtn title="Đường kẻ ngang" onClick={() => exec('insertHorizontalRule')}>
          <Minus className="w-4 h-4" />
        </ToolBtn>

        <span className="ml-auto text-[11px] font-medium text-slate-400 pr-1 hidden sm:block">
          Ctrl+V để dán ảnh • Ctrl+B bold • Ctrl+I italic
        </span>
      </div>

      {/* Editor area */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          style={{ minHeight }}
          className="w-full p-4 outline-none text-[14px] text-slate-800 leading-relaxed prose prose-slate max-w-none [&_blockquote]:border-l-4 [&_blockquote]:border-blue-300 [&_blockquote]:pl-3 [&_blockquote]:text-slate-500 [&_pre]:bg-slate-100 [&_pre]:rounded [&_pre]:p-2 [&_pre]:text-[13px] [&_img]:max-w-full [&_a]:text-blue-600 [&_a]:underline overflow-y-auto"
          data-placeholder={placeholder}
        />
        {!value && (
          <p className="absolute top-4 left-4 text-[14px] text-slate-400 pointer-events-none select-none">
            {placeholder}
          </p>
        )}
      </div>
    </div>
  );
}

function ToolBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className="p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded-md transition"
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-gray-300 mx-0.5" />;
}
