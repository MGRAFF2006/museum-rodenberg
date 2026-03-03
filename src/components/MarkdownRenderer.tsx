import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AudioPlayer } from './AudioPlayer';

interface MarkdownRendererProps {
  content: string;
  onMediaClick?: (type: 'image' | 'video' | 'audio', url: string, title?: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  onMediaClick 
}) => {
  return (
    <div className="prose prose-lg max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const isMedia = href?.startsWith('audio:') || href?.startsWith('video:') || href?.startsWith('image:');
            
            if (isMedia) {
              const type = href?.split(':')[0] as 'image' | 'video' | 'audio';
              const url = href?.split(':').slice(1).join(':');
              const title = children?.toString() || '';
              
              const icons = {
                audio: '🎵',
                video: '🎬',
                image: '🖼️'
              };

              return (
                <span 
                  onClick={() => onMediaClick?.(type, url || '', title)}
                  className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium cursor-pointer hover:bg-blue-200 transition-colors my-2"
                >
                  <span className="mr-2">{icons[type]}</span>
                  {title}
                </span>
              );
            }
            
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 underline">
                {children}
              </a>
            );
          },

          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-neutral-900 mb-6 border-b-2 border-blue-200 pb-3">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-bold text-neutral-800 mb-4 mt-8">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold text-neutral-700 mb-3 mt-6">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-neutral-700 leading-relaxed mb-4">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-neutral-700 mb-4 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-neutral-700 mb-4 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="mb-1">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-neutral-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-neutral-800">{children}</em>
          ),
          img: ({ src, alt }) => {
            const url = src || '';
            const ext = url.split('.').pop()?.toLowerCase();
            const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
            const audioExtensions = ['mp3', 'wav', 'aac', 'm4a', 'flac'];
            
            if (videoExtensions.includes(ext || '')) {
              return (
                <div className="my-6">
                  <video 
                    src={url} 
                    controls 
                    className="w-full max-w-2xl mx-auto rounded-lg shadow-md"
                  />
                  {alt && (
                    <p className="text-xs md:text-sm text-neutral-600 text-center mt-2 italic">
                      {alt}
                    </p>
                  )}
                </div>
              );
            }

            if (audioExtensions.includes(ext || '')) {
              return (
                <div className="my-6">
                  <AudioPlayer url={url} title={alt || undefined} />
                </div>
              );
            }

            return (
              <div className="my-6">
                <img
                  src={src}
                  alt={alt}
                  className="w-full max-w-2xl mx-auto rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => onMediaClick?.('image', src || '', alt)}
                />
                {alt && (
                  <p className="text-xs md:text-sm text-neutral-600 text-center mt-2 italic">
                    {alt}
                  </p>
                )}
              </div>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-300 pl-4 py-2 my-4 bg-blue-50 italic text-neutral-700">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
