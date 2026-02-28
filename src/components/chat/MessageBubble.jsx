import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, Copy, Check, Download, FileText } from 'lucide-react';
import { useState } from 'react';
import jsPDF from 'jspdf';

export default function MessageBubble({ message, userAvatar, userName }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const createSafeFilename = (prefix, ext) => {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    return `${prefix}-${ts}.${ext}`;
  };

  const downloadPdfReport = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    const maxWidth = 515;
    const lines = doc.splitTextToSize(message.content || '', maxWidth);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('ChatBAI Report', margin, margin);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(lines, margin, margin + 28);

    doc.save(createSafeFilename('chatbai-report', 'pdf'));
  };

  const downloadDocReport = () => {
    const reportHtml = `<!doctype html><html><head><meta charset="utf-8" /></head><body><pre style="white-space:pre-wrap;font-family:Arial,Helvetica,sans-serif;line-height:1.6;">${(message.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body></html>`;

    const blob = new Blob([reportHtml], {
      type: 'application/msword;charset=utf-8'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = createSafeFilename('chatbai-report', 'doc');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div className={`max-w-[80%] group ${isUser ? 'order-first' : ''}`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser 
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
        }`}>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold mb-2">{children}</h3>,
                  code: ({ inline, children }) => 
                    inline 
                      ? <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">{children}</code>
                      : <pre className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3 overflow-x-auto"><code className="text-xs">{children}</code></pre>
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
          
          {/* File attachments */}
          {message.files && message.files.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {message.files.map((file, i) => (
                <a
                  key={i}
                  href={file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:opacity-80 transition-opacity"
                >
                  <img src={file} alt="Attachment" className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          )}
        </div>
        
        {!isUser && (
          <div className="mt-1 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              title="Copy"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={downloadPdfReport}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={downloadDocReport}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              title="Download DOC"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        )}
        
        <p className={`text-xs text-slate-400 mt-1 ${isUser ? 'text-right' : ''}`}>
          {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : ''}
        </p>
      </div>
      
      {isUser && (
        <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600">
          {userAvatar ? (
            <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-semibold text-sm">
              {userName?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
