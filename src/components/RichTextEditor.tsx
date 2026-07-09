import React, { useState, useEffect, useRef } from "react";
import { Bold, Italic, List, Code, Heading1, Heading2, Eye, Edit3 } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  id?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = "Type here...", id }: RichTextEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync editor content with external value changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    handleInput();
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  return (
    <div id={id} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 gap-1.5">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => execCommand("bold")}
            disabled={isPreview}
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={() => execCommand("italic")}
            disabled={isPreview}
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>

          <span className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 my-auto mx-1" />

          <button
            type="button"
            onClick={() => execCommand("formatBlock", "<h1>")}
            disabled={isPreview}
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCommand("formatBlock", "<h2>")}
            disabled={isPreview}
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>

          <span className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 my-auto mx-1" />

          <button
            type="button"
            onClick={() => execCommand("insertUnorderedList")}
            disabled={isPreview}
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCommand("formatBlock", "<pre>")}
            disabled={isPreview}
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            title="Code Block"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode Toggle */}
        <button
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 hover:bg-blue-100 transition-colors"
        >
          {isPreview ? (
            <>
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </>
          )}
        </button>
      </div>

      {/* Editor Canvas */}
      <div className="relative min-h-[140px] bg-slate-50/20 dark:bg-slate-950/10">
        {!value && !isPreview && (
          <div className="absolute top-3 left-4 text-slate-400 dark:text-slate-600 pointer-events-none text-sm font-sans select-none">
            {placeholder}
          </div>
        )}

        {isPreview ? (
          <div 
            className="p-4 text-sm text-slate-800 dark:text-slate-200 prose prose-slate max-w-none overflow-y-auto min-h-[140px]"
            dangerouslySetInnerHTML={{ __html: value || `<em class="text-slate-400">No content entered</em>` }}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            className="p-4 text-sm text-slate-800 dark:text-slate-200 outline-none min-h-[140px] overflow-y-auto font-sans focus:outline-none focus:ring-0"
            style={{ minHeight: "140px" }}
          />
        )}
      </div>
    </div>
  );
}
