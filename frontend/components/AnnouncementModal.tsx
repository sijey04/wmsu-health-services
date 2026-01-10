import React, { useState, useEffect } from 'react';
import Modal from './Modal';

interface Announcement {
  id: number;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  icon: string;
  created_at: string;
}

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AnnouncementModal({ isOpen, onClose }: AnnouncementModalProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchUnviewedAnnouncements();
    }
  }, [isOpen]);

  const fetchUnviewedAnnouncements = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8000/api/announcements/unviewed/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsViewed = async (announcementId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      await fetch(`http://localhost:8000/api/announcements/${announcementId}/mark_viewed/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error marking announcement as viewed:', error);
    }
  };

  const handleNext = async () => {
    if (currentIndex < announcements.length - 1) {
      // Mark current announcement as viewed
      await markAsViewed(announcements[currentIndex].id);
      setCurrentIndex(currentIndex + 1);
    } else {
      // Mark last announcement as viewed and close
      await markAsViewed(announcements[currentIndex].id);
      onClose();
    }
  };

  const handleClose = async () => {
    // Mark current announcement as viewed before closing
    if (announcements.length > 0) {
      await markAsViewed(announcements[currentIndex].id);
    }
    onClose();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 border-red-500 text-red-900';
      case 'high':
        return 'bg-orange-100 border-orange-500 text-orange-900';
      case 'medium':
        return 'bg-yellow-100 border-yellow-500 text-yellow-900';
      case 'low':
      default:
        return 'bg-blue-100 border-blue-500 text-blue-900';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Urgent';
      case 'high':
        return 'High Priority';
      case 'medium':
        return 'Medium Priority';
      case 'low':
      default:
        return 'Info';
    }
  };

  // Don't show modal if no announcements or still loading
  if (!isOpen || loading || announcements.length === 0) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="relative">
        {/* Priority Badge */}
        <div className="absolute top-0 right-0">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(currentAnnouncement.priority)}`}>
            {getPriorityLabel(currentAnnouncement.priority)}
          </span>
        </div>

        {/* Announcement Content */}
        <div className="pt-8">
          {/* Icon and Title */}
          <div className="flex items-center gap-3 mb-4">
            {currentAnnouncement.icon && (
              <div className="text-5xl">{currentAnnouncement.icon}</div>
            )}
            <h2 className="text-2xl font-bold text-gray-900">
              {currentAnnouncement.title}
            </h2>
          </div>

          {/* Message */}
          <div className="mb-6">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {currentAnnouncement.message}
            </p>
          </div>

          {/* Pagination */}
          {announcements.length > 1 && (
            <div className="text-sm text-gray-500 mb-4 text-center">
              Announcement {currentIndex + 1} of {announcements.length}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
            {currentIndex < announcements.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 text-white bg-[#800000] rounded-lg hover:bg-[#600000] transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-4 py-2 text-white bg-[#800000] rounded-lg hover:bg-[#600000] transition-colors"
              >
                Got it
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
