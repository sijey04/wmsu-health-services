import React from 'react';

interface ProfileSaveConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (createNewVersion: boolean) => void;
  loading?: boolean;
}

const ProfileSaveConfirmationModal: React.FC<ProfileSaveConfirmationModalProps> = ({
  open,
  onClose,
  onConfirm,
  loading = false
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="bg-[#8B0000] text-white px-6 py-4 rounded-t-lg">
          <h2 className="text-xl font-bold">Save Profile Changes</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-6">
            You have made changes to your profile. How would you like to save these changes?
          </p>

          {/* Options Explanation */}
          <div className="space-y-4 mb-6">
            <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">Edit (Update Current Record)</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Overwrites your current profile. Previous data will be replaced.
                  </p>
                  <p className="text-xs text-gray-500 mt-1 italic">
                    Use this for minor corrections like typos or formatting.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 hover:border-green-400 transition-colors">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">Update (Create New Version)</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Creates a new profile record. Previous version is preserved in history.
                  </p>
                  <p className="text-xs text-gray-500 mt-1 italic">
                    Use this for significant changes like medical history or contact updates.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onConfirm(false)}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Edit Current Record'}
            </button>
            <button
              onClick={() => onConfirm(true)}
              disabled={loading}
              className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Create New Version'}
            </button>
          </div>

          {/* Cancel Button */}
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full mt-3 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSaveConfirmationModal;
