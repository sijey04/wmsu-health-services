import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon as XIcon, CheckIcon, ExclamationTriangleIcon as ExclamationIcon } from '@heroicons/react/24/outline';

interface ConfirmationModalProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  showReasonInput?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  title,
  message,
  onClose,
  onConfirm,
  showReasonInput = false,
  reasonLabel = 'Reason',
  reasonPlaceholder = 'Please provide a reason...',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
}) => {
  const [reason, setReason] = useState('');

  if (!open) return null;

  const handleConfirm = () => {
    onConfirm(showReasonInput ? reason : undefined);
    setReason('');
    onClose();
  };
  
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const confirmButtonColor = isDestructive 
    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
    : 'bg-green-600 hover:bg-green-700 focus:ring-green-500';

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center z-[9999] bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-modal-pop">
        <div className="flex items-start">
          <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${isDestructive ? 'bg-red-100' : 'bg-green-100'} sm:mx-0 sm:h-10 sm:w-10`}>
            {isDestructive ? (
              <ExclamationIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
            ) : (
              <CheckIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
            )}
          </div>
          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-grow">
            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
              {title}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                {message}
              </p>
            </div>
            {showReasonInput && (
              <div className="mt-4">
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                  {reasonLabel}
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  rows={3}
                  className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={reasonPlaceholder}
                />
              </div>
            )}
          </div>
           <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:bg-gray-200 transition-colors"
            >
              <XIcon className="h-5 w-5" />
            </button>
        </div>
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${confirmButtonColor}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
            onClick={onClose}
          >
            {cancelText}
          </button>
        </div>
      </div>
       <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-modal-pop {
          animation: modalPop 0.25s cubic-bezier(0.39, 0.575, 0.565, 1) both;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalPop {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );

  if (typeof document === 'undefined') return null;
  
  return createPortal(modalContent, document.body);
};

export default ConfirmationModal; 