import AdminLayout from '../../components/AdminLayout';

export default function AdminAppointments() {
  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold text-[#800000] mb-6">Appointment Management</h1>
      <p className="text-gray-700 mb-4">View and manage all appointments scheduled by users.</p>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold text-[#800000] mb-4">Upcoming Appointments</h2>
        <p>Table of upcoming appointments with options to approve, reject, or reschedule.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold text-[#800000] mb-4">Past Appointments</h2>
        <p>Table of past appointments with details and history.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold text-[#800000] mb-4">Appointment Settings</h2>
        <p>Configure available appointment slots, services, and staff availability.</p>
      </div>
    </AdminLayout>
  );
}