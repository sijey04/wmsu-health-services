import React, { useState } from 'react';
import Modal from './Modal';

interface CertificateActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActionsConfirm: (selectedActions: string[]) => void;
  patientName: string;
}

export default function CertificateActionsModal({ 
  isOpen, 
  onClose, 
  onActionsConfirm,
  patientName 
}: CertificateActionsModalProps) {
  const [selectedActions, setSelectedActions] = useState<string[]>([]);

  const handleActionToggle = (actionKey: string) => {
    setSelectedActions(prev => {
      if (prev.includes(actionKey)) {
        return prev.filter(action => action !== actionKey);
      } else {
        return [...prev, actionKey];
      }
    });
  };

  const handleConfirm = () => {
    if (selectedActions.length === 0) {
      alert('Please select at least one action.');
      return;
    }
    onActionsConfirm(selectedActions);
    onClose();
    setSelectedActions([]);
  };

  const handleCancel = () => {
    onClose();
    setSelectedActions([]);
  };

  const actions = [
    {
      key: 'print',
      icon: '🖨️',
      title: 'Print Certificate',
      description: 'Print the medical certificate directly from the browser.',
      color: 'text-blue-600 border-blue-600 hover:bg-blue-50',
    },
    {
      key: 'download',
      icon: '📥',
      title: 'Download PDF',
      description: 'Download the certificate as a PDF file to your device.',
      color: 'text-green-600 border-green-600 hover:bg-green-50',
    },
    {
      key: 'email',
      icon: '📧',
      title: 'Send via Email',
      description: 'Send the certificate directly to the patient\'s email address.',
      color: 'text-purple-600 border-purple-600 hover:bg-purple-50',
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} maxWidthClass="max-w-4xl">
      <div className="text-center px-4">
        <div className="mb-6">
          <h3 className="text-2xl sm:text-3xl font-bold text-[#800000] mb-2">
            Issue Medical Certificate
          </h3>
          <p className="text-gray-600 text-lg">
            For: <span className="font-semibold text-[#800000]">{patientName}</span>
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Select the actions you want to perform after issuing the certificate:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 justify-items-center mb-8">
          {actions.map(action => {
            const isSelected = selectedActions.includes(action.key);
            return (
              <button
                key={action.key}
                onClick={() => handleActionToggle(action.key)}
                className={`relative flex flex-col items-center justify-center p-6 rounded-lg shadow-md bg-white ${action.color} border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 text-center hover:shadow-lg transform hover:-translate-y-1 min-h-[180px] w-full max-w-[280px] ${
                  isSelected ? 'ring-2 ring-offset-2' : ''
                }`}
              >
                {/* Checkbox indicator */}
                <div className={`absolute top-3 right-3 w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                  isSelected 
                    ? 'bg-[#800000] border-[#800000] text-white' 
                    : 'border-gray-300 bg-white'
                }`}>
                  {isSelected && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                <span className="text-4xl mb-3">{action.icon}</span>
                <span className="text-lg font-semibold mb-2">{action.title}</span>
                <p className="text-sm text-gray-600 leading-relaxed px-2">{action.description}</p>
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleCancel}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium min-w-[120px]"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedActions.length === 0}
            className={`px-6 py-3 rounded-md transition-colors font-medium min-w-[120px] ${
              selectedActions.length > 0
                ? 'bg-[#800000] text-white hover:bg-[#a83232]'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Issue Certificate
            {selectedActions.length > 0 && (
              <span className="ml-2 text-sm">
                ({selectedActions.length} action{selectedActions.length > 1 ? 's' : ''})
              </span>
            )}
          </button>
        </div>

        {/* Selected actions preview */}
        {selectedActions.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-2 font-medium">Selected actions:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {selectedActions.map(actionKey => {
                const action = actions.find(a => a.key === actionKey);
                return (
                  <span
                    key={actionKey}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#800000] text-white"
                  >
                    <span className="mr-1">{action?.icon}</span>
                    {action?.title}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
