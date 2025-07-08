import { ReactNode, useRef } from 'react';

export default function Modal({ isOpen, onClose, children, maxWidthClass = 'max-w-md' }: { isOpen: boolean, onClose: () => void, children: ReactNode, maxWidthClass?: string }) {
  if (!isOpen) return null;

  const modalRef = useRef<HTMLDivElement>(null);
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if the click is directly on the overlay, not on child elements
    if (e.target === e.currentTarget) {
      onClose();
    }
  };  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity overflow-y-auto py-4 sm:py-8" onClick={handleOverlayClick}>
      <div className="w-full flex justify-center px-4 min-h-full items-center">
        <div ref={modalRef} className={`bg-white rounded-xl shadow-2xl relative w-full ${maxWidthClass} my-4 sm:my-8 animate-fade-in max-h-[95vh] overflow-y-auto`}>
          <div className="sticky top-0 right-0 z-10 flex justify-end p-4 bg-white rounded-t-xl border-b border-gray-100">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 hover:bg-gray-200 rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-[#8B1538] focus:ring-offset-2"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-4 sm:px-6 py-4 sm:py-6">
            {children}
          </div>
        </div>
      </div>
      <style jsx>{`
        .animate-fade-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}