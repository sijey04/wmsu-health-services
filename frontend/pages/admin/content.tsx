import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';

interface PostLoginOption {
  key: string;
  icon: string;
  title: string;
  description: string;
  color: string;
  enabled: boolean;
  show_for_all: boolean;
  show_for_grade_levels?: string[];
}

export default function AdminContentManagement() {
  const [activeTab, setActiveTab] = useState<'hero' | 'announcements' | 'services' | 'hours' | 'cta' | 'modal'>('hero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Hero Section States
  const [heroMainTitle, setHeroMainTitle] = useState('');
  const [heroSubText, setHeroSubText] = useState('');
  const [heroDescription, setHeroDescription] = useState('');
  const [heroBackgroundType, setHeroBackgroundType] = useState<'maroon' | 'image'>('image');
  const [heroBackgroundImage, setHeroBackgroundImage] = useState('');

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState('');
  const [newAnnouncementDescription, setNewAnnouncementDescription] = useState('');

  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [newActivityImage, setNewActivityImage] = useState('');
  const [newActivityCaption, setNewActivityCaption] = useState('');

  const [services, setServices] = useState<any[]>([]);
  const [newServiceIcon, setNewServiceIcon] = useState('');
  const [newServiceTitle, setNewServiceTitle] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');

  const [operatingHours, setOperatingHours] = useState({
    mondayFriday: '',
    saturday: '',
    sunday: '',
  });

  const [contactInfo, setContactInfo] = useState({
    telephone: '',
    email: '',
    location: '',
  });

  const [callToActionTitle, setCallToActionTitle] = useState('');
  const [callToActionDescription, setCallToActionDescription] = useState('');
  const [loggedInCallToActionTitle, setLoggedInCallToActionTitle] = useState('');
  const [loggedInCallToActionDescription, setLoggedInCallToActionDescription] = useState('');

  const [postLoginOptions, setPostLoginOptions] = useState<PostLoginOption[]>([]);
  const [newOptionKey, setNewOptionKey] = useState('');
  const [newOptionIcon, setNewOptionIcon] = useState('');
  const [newOptionTitle, setNewOptionTitle] = useState('');
  const [newOptionDescription, setNewOptionDescription] = useState('');
  const [newOptionColor, setNewOptionColor] = useState('text-[#800000] border-[#800000] hover:bg-[#f3eaea]');
  const [newOptionShowForAll, setNewOptionShowForAll] = useState(true);
  const [newOptionGradeLevels, setNewOptionGradeLevels] = useState('');

  // Announcement Modal System States
  const [systemAnnouncements, setSystemAnnouncements] = useState<any[]>([]);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnMessage, setNewAnnMessage] = useState('');
  const [newAnnPriority, setNewAnnPriority] = useState('medium');
  const [newAnnIcon, setNewAnnIcon] = useState('📢');
  const [newAnnTargetAll, setNewAnnTargetAll] = useState(true);
  const [newAnnTargetUserTypes, setNewAnnTargetUserTypes] = useState('');
  const [newAnnTargetGradeLevels, setNewAnnTargetGradeLevels] = useState('');
  const [newAnnExpiresAt, setNewAnnExpiresAt] = useState('');
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);

  useEffect(() => {
    fetchContent();
    fetchSystemAnnouncements();
  }, []);

  const fetchSystemAnnouncements = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      
      const response = await fetch('http://localhost:8000/api/announcements/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystemAnnouncements(data);
      }
    } catch (error) {
      console.error('Error fetching system announcements:', error);
    }
  };

  const fetchContent = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/content-management/get_content/');
      if (response.ok) {
        const data = await response.json();
        
        setHeroMainTitle(data.hero_main_title || '');
        setHeroSubText(data.hero_sub_text || '');
        setHeroDescription(data.hero_description || '');
        setHeroBackgroundType(data.hero_background_type || 'image');
        setHeroBackgroundImage(data.hero_background_image || '');
        
        setAnnouncements(data.announcements || []);
        setRecentActivities(data.recent_activities || []);
        setServices(data.services || []);
        
        setOperatingHours({
          mondayFriday: data.operating_hours_monday_friday || '',
          saturday: data.operating_hours_saturday || '',
          sunday: data.operating_hours_sunday || '',
        });
        
        setContactInfo({
          telephone: data.contact_telephone || '',
          email: data.contact_email || '',
          location: data.contact_location || '',
        });
        
        setCallToActionTitle(data.cta_title || '');
        setCallToActionDescription(data.cta_description || '');
        setLoggedInCallToActionTitle(data.logged_in_cta_title || '');
        setLoggedInCallToActionDescription(data.logged_in_cta_description || '');
        
        setPostLoginOptions(data.post_login_options || []);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      alert('Failed to load content. Using default values.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('You must be logged in to save changes.');
        setSaving(false);
        return;
      }

      const payload = {
        hero_main_title: heroMainTitle,
        hero_sub_text: heroSubText,
        hero_description: heroDescription,
        hero_background_type: heroBackgroundType,
        hero_background_image: heroBackgroundImage,
        announcements,
        recent_activities: recentActivities,
        services,
        operating_hours_monday_friday: operatingHours.mondayFriday,
        operating_hours_saturday: operatingHours.saturday,
        operating_hours_sunday: operatingHours.sunday,
        contact_telephone: contactInfo.telephone,
        contact_email: contactInfo.email,
        contact_location: contactInfo.location,
        cta_title: callToActionTitle,
        cta_description: callToActionDescription,
        logged_in_cta_title: loggedInCallToActionTitle,
        logged_in_cta_description: loggedInCallToActionDescription,
        post_login_options: postLoginOptions,
      };

      const response = await fetch('http://localhost:8000/api/content-management/update_content/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Content saved successfully!');
        await fetchContent();
      } else {
        const error = await response.json();
        alert(`Failed to save content: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Failed to save content. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addAnnouncement = () => {
    if (newAnnouncementTitle && newAnnouncementDescription) {
      setAnnouncements([...announcements, { 
        id: Date.now(), 
        title: newAnnouncementTitle, 
        description: newAnnouncementDescription 
      }]);
      setNewAnnouncementTitle('');
      setNewAnnouncementDescription('');
    } else {
      alert('Please fill in both announcement title and description.');
    }
  };

  const deleteAnnouncement = (id: number) => {
    setAnnouncements(announcements.filter(ann => ann.id !== id));
  };

  const addActivity = () => {
    if (newActivityImage && newActivityCaption) {
      setRecentActivities([...recentActivities, { 
        id: Date.now(), 
        image: newActivityImage, 
        caption: newActivityCaption 
      }]);
      setNewActivityImage('');
      setNewActivityCaption('');
    } else {
      alert('Please provide both image URL and caption for the activity.');
    }
  };

  const deleteActivity = (id: number) => {
    setRecentActivities(recentActivities.filter(activity => activity.id !== id));
  };

  const addService = () => {
    if (newServiceIcon && newServiceTitle && newServiceDesc) {
      setServices([...services, { 
        id: Date.now(), 
        icon: newServiceIcon, 
        title: newServiceTitle, 
        desc: newServiceDesc 
      }]);
      setNewServiceIcon('');
      setNewServiceTitle('');
      setNewServiceDesc('');
    } else {
      alert('Please fill in all service fields.');
    }
  };

  const deleteService = (id: number) => {
    setServices(services.filter(service => service.id !== id));
  };

  const updateService = (id: number, field: 'icon' | 'title' | 'desc', value: string) => {
    setServices(services.map(service =>
      service.id === id ? { ...service, [field]: value } : service
    ));
  };

  const addPostLoginOption = () => {
    if (newOptionKey && newOptionTitle && newOptionDescription) {
      const gradeLevels = newOptionGradeLevels 
        ? newOptionGradeLevels.split(',').map(level => level.trim()).filter(level => level)
        : [];
      
      setPostLoginOptions([...postLoginOptions, {
        key: newOptionKey,
        icon: newOptionIcon || '📋',
        title: newOptionTitle,
        description: newOptionDescription,
        color: newOptionColor,
        enabled: true,
        show_for_all: newOptionShowForAll,
        show_for_grade_levels: gradeLevels.length > 0 ? gradeLevels : undefined,
      }]);
      
      setNewOptionKey('');
      setNewOptionIcon('');
      setNewOptionTitle('');
      setNewOptionDescription('');
      setNewOptionColor('text-[#800000] border-[#800000] hover:bg-[#f3eaea]');
      setNewOptionShowForAll(true);
      setNewOptionGradeLevels('');
    } else {
      alert('Please fill in key, title, and description fields.');
    }
  };

  const deletePostLoginOption = (key: string) => {
    setPostLoginOptions(postLoginOptions.filter(option => option.key !== key));
  };

  const togglePostLoginOption = (key: string) => {
    setPostLoginOptions(postLoginOptions.map(option =>
      option.key === key ? { ...option, enabled: !option.enabled } : option
    ));
  };

  const createOrUpdateSystemAnnouncement = async () => {
    if (!newAnnTitle || !newAnnMessage) {
      alert('Please provide title and message for the announcement.');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('You must be logged in.');
        return;
      }

      const targetUserTypes = newAnnTargetUserTypes
        ? newAnnTargetUserTypes.split(',').map(t => t.trim()).filter(t => t)
        : [];
      
      const targetGradeLevels = newAnnTargetGradeLevels
        ? newAnnTargetGradeLevels.split(',').map(t => t.trim()).filter(t => t)
        : [];

      const payload = {
        title: newAnnTitle,
        message: newAnnMessage,
        priority: newAnnPriority,
        icon: newAnnIcon || '📢',
        is_active: true,
        show_on_login: true,
        target_all_users: newAnnTargetAll,
        target_user_types: targetUserTypes.length > 0 ? targetUserTypes : [],
        target_grade_levels: targetGradeLevels.length > 0 ? targetGradeLevels : [],
        expires_at: newAnnExpiresAt || null,
      };

      const url = editingAnnouncement
        ? `http://localhost:8000/api/announcements/${editingAnnouncement.id}/`
        : 'http://localhost:8000/api/announcements/';
      
      const method = editingAnnouncement ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert(editingAnnouncement ? 'Announcement updated!' : 'Announcement created!');
        await fetchSystemAnnouncements();
        // Reset form
        setNewAnnTitle('');
        setNewAnnMessage('');
        setNewAnnPriority('medium');
        setNewAnnIcon('📢');
        setNewAnnTargetAll(true);
        setNewAnnTargetUserTypes('');
        setNewAnnTargetGradeLevels('');
        setNewAnnExpiresAt('');
        setEditingAnnouncement(null);
      } else {
        const error = await response.json();
        alert(`Failed: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error('Error creating/updating announcement:', error);
      alert('Failed to save announcement.');
    }
  };

  const editSystemAnnouncement = (announcement: any) => {
    setEditingAnnouncement(announcement);
    setNewAnnTitle(announcement.title);
    setNewAnnMessage(announcement.message);
    setNewAnnPriority(announcement.priority);
    setNewAnnIcon(announcement.icon);
    setNewAnnTargetAll(announcement.target_all_users);
    setNewAnnTargetUserTypes(announcement.target_user_types?.join(', ') || '');
    setNewAnnTargetGradeLevels(announcement.target_grade_levels?.join(', ') || '');
    setNewAnnExpiresAt(announcement.expires_at ? announcement.expires_at.split('T')[0] : '');
    // Scroll to form
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const cancelEditSystemAnnouncement = () => {
    setEditingAnnouncement(null);
    setNewAnnTitle('');
    setNewAnnMessage('');
    setNewAnnPriority('medium');
    setNewAnnIcon('📢');
    setNewAnnTargetAll(true);
    setNewAnnTargetUserTypes('');
    setNewAnnTargetGradeLevels('');
    setNewAnnExpiresAt('');
  };

  const toggleSystemAnnouncement = async (id: number, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`http://localhost:8000/api/announcements/${id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        await fetchSystemAnnouncements();
      }
    } catch (error) {
      console.error('Error toggling announcement:', error);
    }
  };

  const deleteSystemAnnouncement = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`http://localhost:8000/api/announcements/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Announcement deleted!');
        await fetchSystemAnnouncements();
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Failed to delete announcement.');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading content...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#800000] mb-6">Content Management</h1>
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {(['hero', 'announcements', 'services', 'hours', 'cta', 'modal'] as const).map((tab) => (
              <button
                key={tab}
                className={`py-3 px-6 text-lg font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-b-2 border-[#800000] text-[#800000] bg-gray-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'hero' && 'Hero & Info'}
                {tab === 'announcements' && 'Announcement Modals'}
                {tab === 'services' && 'Services'}
                {tab === 'hours' && 'Hours & Contact'}
                {tab === 'cta' && 'Call to Action'}
                {tab === 'modal' && 'Post-Login Modal'}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'hero' && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h2 className="text-2xl font-bold text-[#800000] mb-4">Hero Section</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Main Title</label>
                      <input type="text" className="w-full border border-gray-300 rounded-md shadow-sm p-2" value={heroMainTitle} onChange={(e) => setHeroMainTitle(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sub Text</label>
                      <input type="text" className="w-full border border-gray-300 rounded-md shadow-sm p-2" value={heroSubText} onChange={(e) => setHeroSubText(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea rows={3} className="w-full border border-gray-300 rounded-md shadow-sm p-2" value={heroDescription} onChange={(e) => setHeroDescription(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Background Type</label>
                      <select className="w-full border border-gray-300 rounded-md shadow-sm p-2" value={heroBackgroundType} onChange={(e) => setHeroBackgroundType(e.target.value as 'maroon' | 'image')}>
                        <option value="maroon">Maroon</option>
                        <option value="image">Image</option>
                      </select>
                    </div>
                    {heroBackgroundType === 'image' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Background Image URL</label>
                        <input type="text" className="w-full border border-gray-300 rounded-md shadow-sm p-2" value={heroBackgroundImage} onChange={(e) => setHeroBackgroundImage(e.target.value)} placeholder="/campus-bg.jpg" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-[#800000] mb-4">Announcements</h3>
                  <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                    {announcements.map(ann => (
                      <div key={ann.id} className="bg-white p-3 rounded border flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold">{ann.title}</p>
                          <p className="text-sm text-gray-600">{ann.description}</p>
                        </div>
                        <button onClick={() => deleteAnnouncement(ann.id)} className="ml-2 text-red-600 hover:text-red-800 text-xl">×</button>
                      </div>
                    ))}
                  </div>
                  <input type="text" placeholder="Title" className="w-full mb-2 p-2 border rounded" value={newAnnouncementTitle} onChange={(e) => setNewAnnouncementTitle(e.target.value)} />
                  <textarea placeholder="Description" className="w-full mb-2 p-2 border rounded" rows={2} value={newAnnouncementDescription} onChange={(e) => setNewAnnouncementDescription(e.target.value)} />
                  <button onClick={addAnnouncement} className="bg-[#800000] text-white px-4 py-2 rounded hover:bg-[#a83232]">Add</button>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-[#800000] mb-4">Recent Activities</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {recentActivities.map(activity => (
                      <div key={activity.id} className="bg-white p-3 rounded border">
                        <div className="aspect-video bg-gray-200 rounded mb-2 flex items-center justify-center text-gray-400 text-sm">
                          {activity.image ? <img src={activity.image} alt={activity.caption} className="w-full h-full object-cover rounded" /> : 'No Image'}
                        </div>
                        <p className="text-sm font-medium mb-2">{activity.caption}</p>
                        <button onClick={() => deleteActivity(activity.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                      </div>
                    ))}
                  </div>
                  <input type="text" placeholder="Image URL" className="w-full mb-2 p-2 border rounded" value={newActivityImage} onChange={(e) => setNewActivityImage(e.target.value)} />
                  <input type="text" placeholder="Caption" className="w-full mb-2 p-2 border rounded" value={newActivityCaption} onChange={(e) => setNewActivityCaption(e.target.value)} />
                  <button onClick={addActivity} className="bg-[#800000] text-white px-4 py-2 rounded hover:bg-[#a83232]">Add</button>
                </div>
              </div>
            )}

            {activeTab === 'announcements' && (
              <div>
                <h2 className="text-2xl font-bold text-[#800000] mb-4">Announcement Modals</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Manage announcements that appear in a modal after users log in. These are separate from the hero section announcements.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {systemAnnouncements.map((ann) => {
                    const priorityColors = {
                      urgent: 'border-red-500 bg-red-50',
                      high: 'border-orange-500 bg-orange-50',
                      medium: 'border-yellow-500 bg-yellow-50',
                      low: 'border-blue-500 bg-blue-50',
                    };
                    const priorityLabels = {
                      urgent: 'Urgent',
                      high: 'High',
                      medium: 'Medium',
                      low: 'Low',
                    };
                    
                    return (
                      <div
                        key={ann.id}
                        className={`p-4 rounded-lg border-2 ${priorityColors[ann.priority as keyof typeof priorityColors] || 'border-gray-300 bg-white'} ${!ann.is_active ? 'opacity-60' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{ann.icon}</span>
                            <span className={`text-xs px-2 py-1 rounded font-semibold ${
                              ann.priority === 'urgent' ? 'bg-red-200 text-red-900' :
                              ann.priority === 'high' ? 'bg-orange-200 text-orange-900' :
                              ann.priority === 'medium' ? 'bg-yellow-200 text-yellow-900' :
                              'bg-blue-200 text-blue-900'
                            }`}>
                              {priorityLabels[ann.priority as keyof typeof priorityLabels]}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleSystemAnnouncement(ann.id, ann.is_active)}
                              className={`text-xs px-2 py-1 rounded font-semibold ${
                                ann.is_active ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
                              }`}
                            >
                              {ann.is_active ? 'Active' : 'Inactive'}
                            </button>
                            <button
                              onClick={() => editSystemAnnouncement(ann)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => deleteSystemAnnouncement(ann.id)}
                              className="text-red-600 hover:text-red-800 text-xl"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                        <h3 className="font-bold text-lg mb-2">{ann.title}</h3>
                        <p className="text-sm text-gray-700 mb-3 line-clamp-3">{ann.message}</p>
                        <div className="text-xs text-gray-600 space-y-1">
                          <p>
                            <strong>Target:</strong>{' '}
                            {ann.target_all_users
                              ? 'All Users'
                              : `${ann.target_user_types?.length > 0 ? `Types: ${ann.target_user_types.join(', ')}` : ''} ${
                                  ann.target_grade_levels?.length > 0 ? `Grades: ${ann.target_grade_levels.join(', ')}` : ''
                                }`.trim() || 'No targeting'}
                          </p>
                          {ann.expires_at && (
                            <p>
                              <strong>Expires:</strong> {new Date(ann.expires_at).toLocaleDateString()}
                              {ann.is_expired && <span className="text-red-600 ml-2">(Expired)</span>}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">
                            Created by {ann.created_by_name || 'Unknown'} on {new Date(ann.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-gray-50 p-6 rounded-lg border-2 border-[#800000]">
                  <h3 className="text-xl font-bold text-[#800000] mb-4">
                    {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Icon (Emoji)</label>
                        <input
                          type="text"
                          placeholder="📢"
                          className="w-full p-2 border rounded"
                          value={newAnnIcon}
                          onChange={(e) => setNewAnnIcon(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <select
                          className="w-full p-2 border rounded"
                          value={newAnnPriority}
                          onChange={(e) => setNewAnnPriority(e.target.value)}
                        >
                          <option value="low">Low (Blue)</option>
                          <option value="medium">Medium (Yellow)</option>
                          <option value="high">High (Orange)</option>
                          <option value="urgent">Urgent (Red)</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                      <input
                        type="text"
                        placeholder="Announcement Title"
                        className="w-full p-2 border rounded"
                        value={newAnnTitle}
                        onChange={(e) => setNewAnnTitle(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                      <textarea
                        placeholder="Full announcement message..."
                        className="w-full p-2 border rounded"
                        rows={4}
                        value={newAnnMessage}
                        onChange={(e) => setNewAnnMessage(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date (Optional)</label>
                      <input
                        type="date"
                        className="w-full p-2 border rounded"
                        value={newAnnExpiresAt}
                        onChange={(e) => setNewAnnExpiresAt(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty for no expiration</p>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-gray-700 mb-3">Targeting Options</h4>
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="checkbox"
                          id="targetAll"
                          checked={newAnnTargetAll}
                          onChange={(e) => setNewAnnTargetAll(e.target.checked)}
                        />
                        <label htmlFor="targetAll" className="text-sm font-medium">Show to all users</label>
                      </div>
                      
                      {!newAnnTargetAll && (
                        <>
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Target User Types (comma-separated)
                            </label>
                            <input
                              type="text"
                              placeholder="student, faculty, staff"
                              className="w-full p-2 border rounded"
                              value={newAnnTargetUserTypes}
                              onChange={(e) => setNewAnnTargetUserTypes(e.target.value)}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Target Grade Levels (comma-separated)
                            </label>
                            <input
                              type="text"
                              placeholder="Freshman, Sophomore, Junior, Senior"
                              className="w-full p-2 border rounded"
                              value={newAnnTargetGradeLevels}
                              onChange={(e) => setNewAnnTargetGradeLevels(e.target.value)}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={createOrUpdateSystemAnnouncement}
                        className="bg-[#800000] text-white px-6 py-2 rounded hover:bg-[#a83232] font-semibold"
                      >
                        {editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
                      </button>
                      {editingAnnouncement && (
                        <button
                          onClick={cancelEditSystemAnnouncement}
                          className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'services' && (
              <div>
                <h2 className="text-2xl font-bold text-[#800000] mb-4">Our Services</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {services.map(service => (
                    <div key={service.id} className="bg-gray-50 p-4 rounded-lg border">
                      <input type="text" className="text-3xl mb-2 w-full border rounded p-1 text-center" value={service.icon} onChange={(e) => updateService(service.id, 'icon', e.target.value)} />
                      <input type="text" className="font-bold mb-2 w-full border rounded p-1" value={service.title} onChange={(e) => updateService(service.id, 'title', e.target.value)} />
                      <textarea className="text-sm text-gray-600 w-full border rounded p-1" rows={3} value={service.desc} onChange={(e) => updateService(service.id, 'desc', e.target.value)} />
                      <button onClick={() => deleteService(service.id)} className="mt-2 text-red-600 hover:text-red-800 text-sm">Delete</button>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-[#800000] mb-4">Add New Service</h3>
                  <input type="text" placeholder="Icon (emoji)" className="w-full mb-2 p-2 border rounded" value={newServiceIcon} onChange={(e) => setNewServiceIcon(e.target.value)} />
                  <input type="text" placeholder="Title" className="w-full mb-2 p-2 border rounded" value={newServiceTitle} onChange={(e) => setNewServiceTitle(e.target.value)} />
                  <textarea placeholder="Description" className="w-full mb-2 p-2 border rounded" rows={3} value={newServiceDesc} onChange={(e) => setNewServiceDesc(e.target.value)} />
                  <button onClick={addService} className="bg-[#800000] text-white px-4 py-2 rounded hover:bg-[#a83232]">Add Service</button>
                </div>
              </div>
            )}

            {activeTab === 'hours' && (
              <div>
                <h2 className="text-2xl font-bold text-[#800000] mb-4">Operating Hours & Contact</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monday - Friday</label>
                    <input type="text" className="w-full border border-gray-300 rounded-md shadow-sm p-2" value={operatingHours.mondayFriday} onChange={(e) => setOperatingHours({ ...operatingHours, mondayFriday: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Saturday</label>
                    <input type="text" className="w-full border border-gray-300 rounded-md shadow-sm p-2" value={operatingHours.saturday} onChange={(e) => setOperatingHours({ ...operatingHours, saturday: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sunday</label>
                    <input type="text" className="w-full border border-gray-300 rounded-md shadow-sm p-2" value={operatingHours.sunday} onChange={(e) => setOperatingHours({ ...operatingHours, sunday: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
                    <input type="text" className="w-full border border-gray-300 rounded-md shadow-sm p-2" value={contactInfo.telephone} onChange={(e) => setContactInfo({ ...contactInfo, telephone: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" className="w-full border border-gray-300 rounded-md shadow-sm p-2" value={contactInfo.email} onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <textarea rows={3} className="w-full border border-gray-300 rounded-md shadow-sm p-2" value={contactInfo.location} onChange={(e) => setContactInfo({ ...contactInfo, location: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cta' && (
              <div>
                <h2 className="text-2xl font-bold text-[#800000] mb-6">Call to Action Content</h2>
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">For Non-Logged In Users</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input type="text" className="w-full border border-gray-300 rounded-md shadow-sm p-2" value={callToActionTitle} onChange={(e) => setCallToActionTitle(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea rows={3} className="w-full border border-gray-300 rounded-md shadow-sm p-2" value={callToActionDescription} onChange={(e) => setCallToActionDescription(e.target.value)} />
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">For Logged In Users</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input type="text" className="w-full border border-gray-300 rounded-md shadow-sm p-2" value={loggedInCallToActionTitle} onChange={(e) => setLoggedInCallToActionTitle(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea rows={3} className="w-full border border-gray-300 rounded-md shadow-sm p-2" value={loggedInCallToActionDescription} onChange={(e) => setLoggedInCallToActionDescription(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'modal' && (
              <div>
                <h2 className="text-2xl font-bold text-[#800000] mb-4">Post-Login Modal Options</h2>
                <p className="text-sm text-gray-600 mb-6">Configure options shown after users log in.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {postLoginOptions.map(option => (
                    <div key={option.key} className={`bg-gray-50 p-4 rounded-lg border-2 ${option.enabled ? 'border-green-500' : 'border-gray-300'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-2xl">{option.icon}</span>
                        <div className="flex gap-2">
                          <button onClick={() => togglePostLoginOption(option.key)} className={`text-xs px-2 py-1 rounded ${option.enabled ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'}`}>
                            {option.enabled ? 'ON' : 'OFF'}
                          </button>
                          <button onClick={() => deletePostLoginOption(option.key)} className="text-red-600 hover:text-red-800 text-xl">×</button>
                        </div>
                      </div>
                      <p className="font-bold text-sm mb-1">{option.title}</p>
                      <p className="text-xs text-gray-600 mb-2">{option.description}</p>
                      <p className="text-xs text-gray-500">Key: {option.key}</p>
                      <p className="text-xs text-gray-500">
                        {option.show_for_all ? 'All Users' : `Grades: ${option.show_for_grade_levels?.join(', ') || 'None'}`}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-[#800000] mb-4">Add New Option</h3>
                  <div className="space-y-4">
                    <input type="text" placeholder="Key (e.g., 'Book Dental Consultation')" className="w-full p-2 border rounded" value={newOptionKey} onChange={(e) => setNewOptionKey(e.target.value)} />
                    <input type="text" placeholder="Icon (emoji)" className="w-full p-2 border rounded" value={newOptionIcon} onChange={(e) => setNewOptionIcon(e.target.value)} />
                    <input type="text" placeholder="Title" className="w-full p-2 border rounded" value={newOptionTitle} onChange={(e) => setNewOptionTitle(e.target.value)} />
                    <textarea placeholder="Description" className="w-full p-2 border rounded" rows={2} value={newOptionDescription} onChange={(e) => setNewOptionDescription(e.target.value)} />
                    <input type="text" placeholder="Color classes" className="w-full p-2 border rounded" value={newOptionColor} onChange={(e) => setNewOptionColor(e.target.value)} />
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="showForAll" checked={newOptionShowForAll} onChange={(e) => setNewOptionShowForAll(e.target.checked)} />
                      <label htmlFor="showForAll" className="text-sm">Show for all users</label>
                    </div>
                    <input type="text" placeholder="Grade levels (comma-separated)" className="w-full p-2 border rounded" value={newOptionGradeLevels} onChange={(e) => setNewOptionGradeLevels(e.target.value)} disabled={newOptionShowForAll} />
                    <button onClick={addPostLoginOption} className="bg-[#800000] text-white px-4 py-2 rounded hover:bg-[#a83232]">Add Option</button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t text-right">
              <button onClick={handleSave} disabled={saving} className="bg-[#800000] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#a83232] disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
