import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';

// Mock patient and doctor data for the form
const mockPatients = [
  { id: 1, name: 'Juan Dela Cruz', studentId: '2020-0001' },
  { id: 2, name: 'Maria Santos', studentId: '2021-0042' },
  { id: 3, name: 'Carlos Reyes', studentId: '2022-0105' },
];

const mockDoctors = [
  { id: 1, name: 'Dr. Santos' },
  { id: 2, name: 'Dr. Reyes' },
  { id: 3, name: 'Dr. Garcia' },
];

type AppointmentFormData = {
  patientId: number;
  doctorId: number;
  date: string;
  time: string;
  purpose: string;
  notes?: string;
};

export default function AppointmentForm({ appointment = null }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<AppointmentFormData>({
    defaultValues: appointment || {}
  });

  const onSubmit = async (data: AppointmentFormData) => {
    setIsSubmitting(true);
    setError('');
    
    try {
      // In production: Call API to create/update appointment
      // For demo, we're simulating an API call
      console.log('Appointment data:', data);
      
      setTimeout(() => {
        // Redirect to appointments list after submission
        router.push('/appointments');
      }, 1000);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patient */}
        <div>
          <label htmlFor="patientId" className="form-label">Patient</label>
          <select
            id="patientId"
            className={`form-input ${errors.patientId ? 'border-red-500' : ''}`}
            {...register('patientId', { required: 'Patient is required' })}
          >
            <option value="">Select Patient</option>
            {mockPatients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {patient.name} ({patient.studentId})
              </option>
            ))}
          </select>
          {errors.patientId && <p className="form-error">{errors.patientId.message}</p>}
        </div>

        {/* Doctor */}
        <div>
          <label htmlFor="doctorId" className="form-label">Doctor</label>
          <select
            id="doctorId"
            className={`form-input ${errors.doctorId ? 'border-red-500' : ''}`}
            {...register('doctorId', { required: 'Doctor is required' })}
          >
            <option value="">Select Doctor</option>
            {mockDoctors.map(doctor => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </select>
          {errors.doctorId && <p className="form-error">{errors.doctorId.message}</p>}
        </div>

        {/* Date */}
        <div>
          <label htmlFor="date" className="form-label">Date</label>
          <input
            id="date"
            type="date"
            className={`form-input ${errors.date ? 'border-red-500' : ''}`}
            min={new Date().toISOString().split('T')[0]} // Set min date to today
            {...register('date', { required: 'Date is required' })}
          />
          {errors.date && <p className="form-error">{errors.date.message}</p>}
        </div>

        {/* Time */}
        <div>
          <label htmlFor="time" className="form-label">Time</label>
          <input
            id="time"
            type="time"
            className={`form-input ${errors.time ? 'border-red-500' : ''}`}
            {...register('time', { required: 'Time is required' })}
          />
          {errors.time && <p className="form-error">{errors.time.message}</p>}
        </div>

        {/* Purpose */}
        <div className="md:col-span-2">
          <label htmlFor="purpose" className="form-label">Purpose of Visit</label>
          <input
            id="purpose"
            type="text"
            className={`form-input ${errors.purpose ? 'border-red-500' : ''}`}
            placeholder="E.g., Regular Check-up, Consultation, Medical Certificate"
            {...register('purpose', { required: 'Purpose is required' })}
          />
          {errors.purpose && <p className="form-error">{errors.purpose.message}</p>}
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <label htmlFor="notes" className="form-label">Additional Notes</label>
          <textarea
            id="notes"
            rows={3}
            className="form-input"
            placeholder="Any additional information about the appointment"
            {...register('notes')}
          ></textarea>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-outline"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`btn btn-primary ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Scheduling...
            </>
          ) : (
            'Schedule Appointment'
          )}
        </button>
      </div>
    </form>
  );
}
