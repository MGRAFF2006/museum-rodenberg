import React from 'react';
import { X, Home, Search, BookOpen } from 'lucide-react';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onHomeClick: () => void;
  exhibitions: any[];
  onExhibitionClick: (id: string) => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  onHomeClick,
  exhibitions,
  onExhibitionClick,
}) => {
  if (!isOpen) return null;

  const handleExhibitionClick = (id: string) => {
    onExhibitionClick(id);
    onClose();
  };

  const handleHomeClick = () => {
    onHomeClick();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Menu */}
      <div className="fixed left-0 top-0 h-full w-80 max-w-sm bg-white shadow-xl">
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-900">Navigation</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Home */}
          <button
            onClick={handleHomeClick}
            className="flex items-center w-full p-3 rounded-lg text-left hover:bg-neutral-100 transition-colors"
          >
            <Home className="h-5 w-5 mr-3 text-primary-800" />
            <span className="font-medium">Alle Ausstellungen</span>
          </button>

          {/* Exhibitions */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-neutral-700 mb-3 px-3">Ausstellungen</h3>
            <div className="space-y-1">
              {exhibitions.map((exhibition) => (
                <button
                  key={exhibition.id}
                  onClick={() => handleExhibitionClick(exhibition.id)}
                  className="flex items-start w-full p-3 rounded-lg text-left hover:bg-neutral-100 transition-colors"
                >
                  <BookOpen className="h-5 w-5 mr-3 text-neutral-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-neutral-900 text-sm line-clamp-2">
                      {exhibition.title}
                    </div>
                    <div className="text-xs text-neutral-600 mt-1">
                      {exhibition.location}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};