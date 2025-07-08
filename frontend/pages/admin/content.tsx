import React, { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import Image from 'next/image'; // Import Image component

export default function AdminContentManagement() {
  const [activeTab, setActiveTab] = useState('hero'); // New state for active tab

  // Hero Section States
  const [heroMainTitle, setHeroMainTitle] = useState('YOUR HEALTH, MY PRIORITY');
  const [heroSubText, setHeroSubText] = useState('Comprehensive Healthcare for the WMSU Community');
  const [heroBackgroundColor, setHeroBackgroundColor] = useState<'maroon' | 'image'>('maroon');
  const [heroBackgroundImage, setHeroBackgroundImage] = useState<string | ArrayBuffer | null>(''); // Changed type to accept ArrayBuffer (for file reader) and initial state to empty

  const [announcements, setAnnouncements] = useState([
    { id: 1, title: 'Free Medical Check-up Week', description: 'Avail free check-ups for all students and staff from June 10-14!' },
    // Add more dummy announcements as needed
  ]);

  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState('');
  const [newAnnouncementDescription, setNewAnnouncementDescription] = useState('');

  const [recentActivities, setRecentActivities] = useState([
    { id: 1, image: '/images/dental-mission-2024.png', caption: 'Dental Mission 2024' },
    { id: 2, image: '/images/wellness-seminar.png', caption: 'Wellness Seminar' },
    { id: 3, image: '/images/vaccination-day.png', caption: 'Vaccination Day' },
    // Add more dummy activities as needed
  ]);

  const [newActivityImage, setNewActivityImage] = useState('');
  const [newActivityCaption, setNewActivityCaption] = useState('');

  // Our Services States
  const [services, setServices] = useState([
    { id: 1, icon: '👶', title: 'Primary Care', desc: 'Routine check-ups, illness treatment, and health management.' },
    { id: 2, icon: '💊', title: 'Pharmacy', desc: 'Prescription medications and expert pharmacist advice.' },
    { id: 3, icon: '🩺', title: 'Screenings', desc: 'Regular screenings for common health concerns.' },
    { id: 4, icon: '🦷', title: 'Dental Care', desc: 'Dental check-ups, cleanings, and treatments.' },
    { id: 5, icon: '💉', title: 'Vaccinations', desc: 'Immunizations for various diseases.' },
    { id: 6, icon: '📚', title: 'Education', desc: 'Health knowledge through workshops and consultations.' },
  ]);
  const [newServiceIcon, setNewServiceIcon] = useState('');
  const [newServiceTitle, setNewServiceTitle] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');


  // Operating Hours & Contact Info States (already present)
  const [operatingHours, setOperatingHours] = useState({
    mondayFriday: '8:00 AM - 5:00 PM',
    saturday: '8:00 AM - 12:00 PM',
    sunday: 'Closed (Emergency services available)',
  });

  const [contactInfo, setContactInfo] = useState({
    telephone: '(062) 991-6736',
    email: 'healthservices@wmsu.edu.ph',
    location: 'Health Services Building, WMSU Campus, Zamboanga City, Philippines',
  });

  // Call to Action States (already present)
  const [callToActionTitle, setCallToActionTitle] = useState('Ready to take charge of your health?');
  const [callToActionDescription, setCallToActionDescription] = useState('Sign up or log in to book appointments, access your medical records, view important health announcements, and streamline your healthcare journey with WMSU Health Services. Your well-being is our priority!');
  const [loggedInCallToActionTitle, setLoggedInCallToActionTitle] = useState('Book your appointment now!');
  const [loggedInCallToActionDescription, setLoggedInCallToActionDescription] = useState('Ready to prioritize your health? Click the button below to schedule your consultation, health check-up, or any other service you need. It\'s quick, easy, and ensures you get the care you deserve!');


  // --- Announcement Management Functions ---
  const addAnnouncement = () => {
    if (newAnnouncementTitle && newAnnouncementDescription) {
      setAnnouncements([...announcements, { id: announcements.length + 1, title: newAnnouncementTitle, description: newAnnouncementDescription }]);
      setNewAnnouncementTitle('');
      setNewAnnouncementDescription('');
    } else {
      alert('Please fill in both announcement title and description.');
    }
  };

  const deleteAnnouncement = (id: number) => {
    setAnnouncements(announcements.filter(ann => ann.id !== id));
  };

  // --- Recent Activity Management Functions ---
  const addActivity = () => {
    if (newActivityImage && newActivityCaption) {
      setRecentActivities([...recentActivities, { id: recentActivities.length + 1, image: newActivityImage, caption: newActivityCaption }]);
      setNewActivityImage('');
      setNewActivityCaption('');
    } else {
      alert('Please provide both image URL and caption for the activity.');
    }
  };

  const deleteActivity = (id: number) => {
    setRecentActivities(recentActivities.filter(activity => activity.id !== id));
  };

  // --- Service Management Functions ---
  const addService = () => {
    if (newServiceIcon && newServiceTitle && newServiceDesc) {
      setServices([...services, { id: services.length + 1, icon: newServiceIcon, title: newServiceTitle, desc: newServiceDesc }]);
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

  // Handle image file upload for hero background
  const handleHeroImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeroBackgroundImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to handle saving changes (placeholder)
  const handleSave = (section: string) => {
    alert(`Saving changes for ${section} (functionality not yet implemented).`);
    // In a real application, you would send this data to a backend API
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              className={`py-3 px-6 text-lg font-medium transition-all duration-200 ${
                activeTab === 'hero'
                  ? 'border-b-2 border-[#800000] text-[#800000] bg-gray-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('hero')}
            >
              Hero Section & Announcements
            </button>
            <button
              className={`py-3 px-6 text-lg font-medium transition-all duration-200 ${
                activeTab === 'services'
                  ? 'border-b-2 border-[#800000] text-[#800000] bg-gray-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('services')}
            >
              Our Services
            </button>
            <button
              className={`py-3 px-6 text-lg font-medium transition-all duration-200 ${
                activeTab === 'hours'
                  ? 'border-b-2 border-[#800000] text-[#800000] bg-gray-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('hours')}
            >
              Operating Hours & Contact
            </button>
            <button
              className={`py-3 px-6 text-lg font-medium transition-all duration-200 ${
                activeTab === 'cta'
                  ? 'border-b-2 border-[#800000] text-[#800000] bg-gray-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('cta')}
            >
              Call to Action
            </button>
        </div>

          <div className="p-6">
          {activeTab === 'hero' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Hero Section Main Content */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-2xl font-bold text-[#800000] mb-4">Hero Main Content</h2>
                <div className="mb-4">
                  <label htmlFor="heroMainTitle" className="block text-sm font-medium text-gray-700">Main Title</label>
                  <input type="text" id="heroMainTitle" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={heroMainTitle} onChange={(e) => setHeroMainTitle(e.target.value)} />
                </div>
                <div className="mb-4">
                  <label htmlFor="heroSubText" className="block text-sm font-medium text-gray-700">Subtitle</label>
                  <textarea id="heroSubText" rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={heroSubText} onChange={(e) => setHeroSubText(e.target.value)} />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Background Type</label>
                  <div className="mt-1 flex items-center space-x-4">
                    <label className="inline-flex items-center">
                      <input type="radio" className="form-radio text-[#800000]" name="heroBackground" value="maroon" checked={heroBackgroundColor === 'maroon'} onChange={() => setHeroBackgroundColor('maroon')} />
                      <span className="ml-2 text-gray-700">Maroon</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input type="radio" className="form-radio text-[#800000]" name="heroBackground" value="image" checked={heroBackgroundColor === 'image'} onChange={() => setHeroBackgroundColor('image')} />
                      <span className="ml-2 text-gray-700">Image Upload</span>
                    </label>
                  </div>
                </div>
                {heroBackgroundColor === 'image' && (
                  <div className="mb-4">
                    <label htmlFor="heroBackgroundImageUpload" className="block text-sm font-medium text-gray-700">Background Image</label>
                    <input type="file" id="heroBackgroundImageUpload" className="mt-1 block w-full text-gray-700 border border-gray-300 rounded-md shadow-sm p-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#f3eaea] file:text-[#800000] hover:file:bg-gray-200" accept="image/*" onChange={handleHeroImageUpload} />
                    {heroBackgroundImage && typeof heroBackgroundImage === 'string' && (
                      <div className="mt-2 text-sm text-gray-500">
                        Current image: <span className="font-medium break-all">{heroBackgroundImage.length > 50 ? heroBackgroundImage.substring(0, 50) + '...' : heroBackgroundImage}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Announcements Management */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-2xl font-bold text-[#800000] mb-4">Announcements</h2>
                <div className="space-y-4 mb-6">
                  {announcements.map(ann => (
                    <div key={ann.id} className="p-4 border border-gray-200 rounded-md flex justify-between items-center">
                      <div>
                        <input type="text" className="font-semibold w-full bg-transparent border-b border-gray-300 focus:outline-none" value={ann.title} onChange={(e) => setAnnouncements(announcements.map(a => a.id === ann.id ? { ...a, title: e.target.value } : a))} />
                        <textarea rows={1} className="text-sm text-gray-600 w-full bg-transparent border-b border-gray-300 focus:outline-none mt-1" value={ann.description} onChange={(e) => setAnnouncements(announcements.map(a => a.id === ann.id ? { ...a, description: e.target.value } : a))} />
                      </div>
                      <button onClick={() => deleteAnnouncement(ann.id)} className="text-red-600 hover:text-red-800 ml-4">Delete</button>
                    </div>
                  ))}
                </div>
                <h3 className="text-xl font-bold text-[#800000] mb-2">Add New Announcement</h3>
                <div className="mb-4">
                  <label htmlFor="newAnnouncementTitle" className="block text-sm font-medium text-gray-700">Title</label>
                  <input type="text" id="newAnnouncementTitle" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={newAnnouncementTitle} onChange={(e) => setNewAnnouncementTitle(e.target.value)} />
                </div>
                <div className="mb-4">
                  <label htmlFor="newAnnouncementDescription" className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea id="newAnnouncementDescription" rows={2} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={newAnnouncementDescription} onChange={(e) => setNewAnnouncementDescription(e.target.value)} />
                </div>
                <button onClick={addAnnouncement} className="btn bg-[#800000] text-white hover:bg-[#a83232]">Add Announcement</button>
              </div>

              {/* Recent Activities Management */}
              <div className="bg-gray-50 p-6 rounded-lg md:col-span-2">
                <h2 className="text-2xl font-bold text-[#800000] mb-4">Recent Activities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                  {recentActivities.map(activity => (
                    <div key={activity.id} className="relative p-2 border border-gray-200 rounded-md flex flex-col items-center">
                      <Image src={activity.image} alt={activity.caption} width={80} height={60} className="object-cover rounded-md mb-2" />
                      <p className="text-sm text-center">{activity.caption}</p>
                      <button onClick={() => deleteActivity(activity.id)} className="absolute top-1 right-1 text-red-600 hover:text-red-800 text-xs">x</button>
                    </div>
                  ))}
                </div>
                <h3 className="text-xl font-bold text-[#800000] mb-2">Add New Activity</h3>
                <div className="mb-4">
                  <label htmlFor="newActivityImage" className="block text-sm font-medium text-gray-700">Image URL</label>
                  <input type="text" id="newActivityImage" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={newActivityImage} onChange={(e) => setNewActivityImage(e.target.value)} placeholder="e.g., /images/new-activity.png" />
                </div>
                <div className="mb-4">
                  <label htmlFor="newActivityCaption" className="block text-sm font-medium text-gray-700">Caption</label>
                  <input type="text" id="newActivityCaption" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={newActivityCaption} onChange={(e) => setNewActivityCaption(e.target.value)} />
                </div>
                <button onClick={addActivity} className="btn bg-[#800000] text-white hover:bg-[#a83232]">Add Activity</button>
              </div>

              {/* Hero Section Preview */}
              <div className="bg-gray-50 p-6 rounded-lg md:col-span-2">
                <h2 className="text-2xl font-bold text-[#800000] mb-4">Hero Section Preview</h2>
                <div className={`relative min-h-[40vh] flex flex-col md:flex-row items-center justify-center ${heroBackgroundColor === 'maroon' ? 'bg-[#800000]' : ''} text-white overflow-hidden rounded-lg shadow-lg`}
                     style={heroBackgroundColor === 'image' && heroBackgroundImage ? { backgroundImage: `url(${heroBackgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                  <div className="flex-1 flex flex-col justify-center items-center p-4 z-10">
                    <Image src="/wmsu-logo.png" alt="WMSU Logo" width={64} height={64} className="mb-4 mx-auto" />
                    <div className="mb-6 w-full max-w-lg mx-auto text-center">
                      <h1 className="text-2xl md:text-3xl font-extrabold drop-shadow-lg mb-2">{heroMainTitle}</h1>
                      <p className="text-md md:text-lg text-gray-100 mb-4">{heroSubText}</p>
                    </div>
                    {announcements.length > 0 && (
                      <div className="w-full max-w-lg mx-auto bg-white bg-opacity-10 rounded-lg p-4 mb-4 shadow">
                        <h2 className="text-xl font-bold mb-2">{announcements[0].title}</h2> {/* Showing first announcement for preview */}
                        <p className="mb-2">{announcements[0].description}</p>
                        <div className="flex justify-center gap-2 mt-2">
                          {announcements.map((_, idx) => (
                            <div key={idx} className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-white' : 'bg-gray-400 bg-opacity-50'}`} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {recentActivities.length > 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center p-4 gap-2 bg-[#a83232] bg-opacity-20 min-h-[150px]">
                      <h3 className="text-md font-bold mb-2">Recent Activities</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {recentActivities.slice(0, 4).map((act, idx) => ( // Show up to 4 for preview
                          <div key={idx} className="rounded-lg overflow-hidden shadow-md bg-white bg-opacity-80 flex flex-col items-center">
                            <Image src={act.image} alt={act.caption} width={64} height={48} className="object-cover" />
                            <span className="text-xs text-[#800000] font-semibold py-1">{act.caption}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {heroBackgroundColor === 'maroon' && <div className="absolute inset-0 bg-gradient-to-br from-[#800000] via-[#a83232] to-[#800000] opacity-30 pointer-events-none" />}                  
                </div>
              </div>

              <div className="md:col-span-2 text-right">
                <button onClick={() => handleSave('hero')} className="btn bg-[#800000] text-white hover:bg-[#a83232]">Save All Hero Section Changes</button>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div>
              <h2 className="text-2xl font-bold text-[#800000] mb-4">Our Services</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {services.map((service) => (
                  <div key={service.id} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h3 className="text-xl font-bold text-[#800000] mb-3">Edit Service</h3>
                    <div className="mb-3">
                      <label htmlFor={`serviceIcon-${service.id}`} className="block text-sm font-medium text-gray-700">Icon (Emoji or URL)</label>
                      <input type="text" id={`serviceIcon-${service.id}`} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={service.icon} onChange={(e) => updateService(service.id, 'icon', e.target.value)} />
                    </div>
                    <div className="mb-3">
                      <label htmlFor={`serviceTitle-${service.id}`} className="block text-sm font-medium text-gray-700">Title</label>
                      <input type="text" id={`serviceTitle-${service.id}`} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={service.title} onChange={(e) => updateService(service.id, 'title', e.target.value)} />
                    </div>
                    <div className="mb-3">
                      <label htmlFor={`serviceDesc-${service.id}`} className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea id={`serviceDesc-${service.id}`} rows={2} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={service.desc} onChange={(e) => updateService(service.id, 'desc', e.target.value)} />
                    </div>
                    <button onClick={() => deleteService(service.id)} className="btn bg-red-600 text-white hover:bg-red-700 mt-2">Delete Service</button>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 p-6 rounded-lg mb-8">
                <h3 className="text-2xl font-bold text-[#800000] mb-4">Add New Service</h3>
                <div className="mb-4">
                  <label htmlFor="newServiceIcon" className="block text-sm font-medium text-gray-700">Icon (Emoji or URL)</label>
                  <input type="text" id="newServiceIcon" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={newServiceIcon} onChange={(e) => setNewServiceIcon(e.target.value)} placeholder="e.g., ➕ or /icons/new-icon.png" />
                </div>
                <div className="mb-4">
                  <label htmlFor="newServiceTitle" className="block text-sm font-medium text-gray-700">Title</label>
                  <input type="text" id="newServiceTitle" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={newServiceTitle} onChange={(e) => setNewServiceTitle(e.target.value)} />
                </div>
                <div className="mb-4">
                  <label htmlFor="newServiceDesc" className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea id="newServiceDesc" rows={2} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={newServiceDesc} onChange={(e) => setNewServiceDesc(e.target.value)} />
                </div>
                <button onClick={addService} className="btn bg-[#800000] text-white hover:bg-[#a83232]">Add Service</button>
              </div>

              {/* Services Section Preview */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-2xl font-bold text-[#800000] mb-4">Our Services Preview</h2>
                <div className="max-w-5xl mx-auto py-4 px-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    {services.map((service, idx) => (
                      <div key={idx} className="flex flex-col items-center bg-white rounded-xl shadow p-6 border border-[#f3eaea]">
                        {service.icon.startsWith('/') ? ( // Check if it's a URL
                          <Image src={service.icon} alt={service.title} width={48} height={48} className="mb-3" />
                        ) : (
                          <span className="text-4xl mb-3">{service.icon}</span>
                        )}
                        <h3 className="text-lg font-semibold text-[#800000] mb-1">{service.title}</h3>
                        <p className="text-gray-700 text-sm text-center">{service.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:col-span-3 text-right">
                <button onClick={() => handleSave('services')} className="btn bg-[#800000] text-white hover:bg-[#a83232]">Save All Services Changes</button>
              </div>
            </div>
          )}

          {activeTab === 'hours' && (
            <div>
              <h2 className="text-2xl font-bold text-[#800000] mb-4">Operating Hours & Contact Information</h2>
              <div className="mb-4">
                <label htmlFor="mondayFridayHours" className="block text-sm font-medium text-gray-700">Monday to Friday Hours</label>
                <input type="text" id="mondayFridayHours" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={operatingHours.mondayFriday} onChange={(e) => setOperatingHours({ ...operatingHours, mondayFriday: e.target.value })} />
              </div>
              <div className="mb-4">
                <label htmlFor="saturdayHours" className="block text-sm font-medium text-gray-700">Saturday Hours</label>
                <input type="text" id="saturdayHours" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={operatingHours.saturday} onChange={(e) => setOperatingHours({ ...operatingHours, saturday: e.target.value })} />
              </div>
              <div className="mb-4">
                <label htmlFor="sundayHours" className="block text-sm font-medium text-gray-700">Sunday Hours</label>
                <input type="text" id="sundayHours" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={operatingHours.sunday} onChange={(e) => setOperatingHours({ ...operatingHours, sunday: e.target.value })} />
              </div>
              <div className="mb-4">
                <label htmlFor="contactTelephone" className="block text-sm font-medium text-gray-700">Telephone</label>
                <input type="text" id="contactTelephone" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={contactInfo.telephone} onChange={(e) => setContactInfo({ ...contactInfo, telephone: e.target.value })} />
              </div>
              <div className="mb-4">
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" id="contactEmail" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={contactInfo.email} onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })} />
              </div>
              <div className="mb-4">
                <label htmlFor="contactLocation" className="block text-sm font-medium text-gray-700">Location</label>
                <textarea id="contactLocation" rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={contactInfo.location} onChange={(e) => setContactInfo({ ...contactInfo, location: e.target.value })} />
              </div>
              <button onClick={() => handleSave('hours_contact')} className="btn bg-[#800000] text-white hover:bg-[#a83232]">Save Hours & Contact</button>
            </div>
          )}

          {activeTab === 'cta' && (
            <div>
              <h2 className="text-2xl font-bold text-[#800000] mb-4">Call to Action Description</h2>
              <div className="mb-4">
                <label htmlFor="ctaTitle" className="block text-sm font-medium text-gray-700">Not Logged In - Title</label>
                <input type="text" id="ctaTitle" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={callToActionTitle} onChange={(e) => setCallToActionTitle(e.target.value)} />
              </div>
              <div className="mb-4">
                <label htmlFor="ctaDescription" className="block text-sm font-medium text-gray-700">Not Logged In - Description</label>
                <textarea id="ctaDescription" rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={callToActionDescription} onChange={(e) => setCallToActionDescription(e.target.value)} />
              </div>
              <div className="mb-4">
                <label htmlFor="loggedInCtaTitle" className="block text-sm font-medium text-gray-700">Logged In - Title</label>
                <input type="text" id="loggedInCtaTitle" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={loggedInCallToActionTitle} onChange={(e) => setLoggedInCallToActionTitle(e.target.value)} />
              </div>
              <div className="mb-4">
                <label htmlFor="loggedInCtaDescription" className="block text-sm font-medium text-gray-700">Logged In - Description</label>
                <textarea id="loggedInCtaDescription" rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={loggedInCallToActionDescription} onChange={(e) => setLoggedInCallToActionDescription(e.target.value)} />
              </div>
              <button onClick={() => handleSave('cta')} className="btn bg-[#800000] text-white hover:bg-[#a83232]">Save Call to Action</button>
            </div>
          )}

        </div>

        </div>
      </div>
    </AdminLayout>
  );
}