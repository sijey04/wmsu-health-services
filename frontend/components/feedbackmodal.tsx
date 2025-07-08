import React, { useEffect } from 'react';

interface FeedbackModalProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ open, message, onClose }) => {
  const isError = /required|invalid|fail|error/i.test(message);

  useEffect(() => {
    if (open) {
      const timeout = isError ? 8000 : 3000; // Longer timeout for error messages
      const timer = setTimeout(() => {
        onClose();
      }, timeout);
      return () => clearTimeout(timer);
    }
  }, [open, onClose, isError]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/20 animate-fade-in">
      <div className="bg-white/80 rounded-2xl shadow-2xl px-10 py-8 flex flex-col items-center min-w-[320px] max-w-[90vw] animate-modal-pop">
        <div className="flex items-center justify-center mb-5">
          <span className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${isError ? 'bg-red-100' : 'bg-green-100'}`}>
            {isError ? (
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={2.5} fill="none" />
              </svg>
            )}
          </span>
        </div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-1 text-center" style={{fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif'}}>{isError ? 'Error' : 'Success'}</h3>
        <div className="text-base text-gray-700 text-center mb-1 max-h-96 overflow-y-auto" style={{fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif'}}>
          {message.split('\n').map((line, index) => (
            <p key={index} className={index === 0 ? 'mb-2' : 'mb-1'}>
              {line}
            </p>
          ))}
        </div>
        {isError && (
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
          >
            Close
          </button>
        )}
      </div>
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.3s, fadeOut 0.5s 2.5s forwards;
        }
        .animate-modal-pop {
          animation: modalPop 0.32s cubic-bezier(0.39, 0.575, 0.565, 1) both;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          to { opacity: 0; pointer-events: none; }
        }
        @keyframes modalPop {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default FeedbackModal;
