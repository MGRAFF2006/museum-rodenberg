import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  onMediaClick?: (type: 'image' | 'video' | 'audio', url: string, title?: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  onMediaClick 
}) => {
  const processContent = (text: string) => {
    // Process media links: [Audio: Title](audio:url) or [Video: Title](video:url)
    return text.replace(
      /\[(?:Audio|Video|Image):\s*([^\]]+)\]\((audio|video|image):([^)]+)\)/g,
      (match, title, type, url) => {
        const mediaId = `media-${Math.random().toString(36).substr(2, 9)}`;
        
        // Store media info for click handler
        setTimeout(() => {
          const element = document.getElementById(mediaId);
          if (element && onMediaClick) {
            element.addEventListener('click', () => {
              onMediaClick(type as 'image' | 'video' | 'audio', url, title);
            });
          }
        }, 0);

        const icons = {
          audio: '🎵',
          video: '🎬',
          image: '🖼️'
        };

        return `<span id="${mediaId}" class="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium cursor-pointer hover:bg-blue-200 transition-colors my-2">
          <span class="mr-2">${icons[type as keyof typeof icons]}</span>
          ${title}
        </span>`;
      }
    );
  };

  return (
    <div className="prose prose-lg max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b-2 border-blue-200 pb-3">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold text-gray-700 mb-3 mt-6">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-gray-700 leading-relaxed mb-4">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-gray-700 mb-4 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="mb-1">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-800">{children}</em>
          ),
          img: ({ src, alt }) => (
            <div className="my-6">
              <img
                src={src}
                alt={alt}
                className="w-full max-w-2xl mx-auto rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => onMediaClick?.('image', src || '', alt)}
              />
              {alt && (
                <p className="text-xs md:text-sm text-gray-600 text-center mt-2 italic">
                  {alt}
                </p>
              )}
            </div>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-300 pl-4 py-2 my-4 bg-blue-50 italic text-gray-700">
              {children}
            </blockquote>
          ),
        }}
      >
        {processContent(content)}
      </ReactMarkdown>
    </div>
  );
};