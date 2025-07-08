import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';

type PatientFormData = {
  name: string;
  studentId: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  department: string;
  contactNumber: string;
  address?: string;
  city_municipality?: string;
  barangay?: string;
  street?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  bloodType?: string;
  allergies?: string;
};

export default function PatientForm({ patient = null }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<PatientFormData>({
    defaultValues: patient || {}
  });

  const onSubmit = async (data: PatientFormData) => {
    setIsSubmitting(true);
    setError('');
    
    try {
      // In production: Call API to create/update patient
      // For demo, we're simulating an API call
      console.log('Patient data:', data);
      
      setTimeout(() => {
        // Redirect to patients list after submission
        router.push('/patients');
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
        {/* Name */}
        <div>
          <label htmlFor="name" className="form-label">Full Name</label>
          <input
            id="name"
            type="text"
            className={`form-input ${errors.name ? 'border-red-500' : ''}`}
            {...register('name', { required: 'Name is required' })}
          />
          {errors.name && <p className="form-error">{errors.name.message}</p>}
        </div>

        {/* Student ID */}
        <div>
          <label htmlFor="studentId" className="form-label">Student ID</label>
          <input
            id="studentId"
            type="text"
            className={`form-input ${errors.studentId ? 'border-red-500' : ''}`}
            {...register('studentId', { required: 'Student ID is required' })}
          />
          {errors.studentId && <p className="form-error">{errors.studentId.message}</p>}
        </div>

        {/* Age */}
        <div>
          <label htmlFor="age" className="form-label">Age</label>
          <input
            id="age"
            type="number"
            min="0"
            max="120"
            className={`form-input ${errors.age ? 'border-red-500' : ''}`}
            {...register('age', { 
              required: 'Age is required',
              min: { value: 0, message: 'Age must be positive' },
              max: { value: 120, message: 'Age must be less than 120' }
            })}
          />
          {errors.age && <p className="form-error">{errors.age.message}</p>}
        </div>

        {/* Gender */}
        <div>
          <label htmlFor="gender" className="form-label">Gender</label>
          <select
            id="gender"
            className={`form-input ${errors.gender ? 'border-red-500' : ''}`}
            {...register('gender', { required: 'Gender is required' })}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {errors.gender && <p className="form-error">{errors.gender.message}</p>}
        </div>

        {/* Department */}
        <div>
          <label htmlFor="department" className="form-label">Department/College</label>
          <input
            id="department"
            type="text"
            className={`form-input ${errors.department ? 'border-red-500' : ''}`}
            {...register('department', { required: 'Department is required' })}
          />
          {errors.department && <p className="form-error">{errors.department.message}</p>}
        </div>

        {/* Contact Number */}
        <div>
          <label htmlFor="contactNumber" className="form-label">Contact Number</label>
          <input
            id="contactNumber"
            type="text"
            className={`form-input ${errors.contactNumber ? 'border-red-500' : ''}`}
            {...register('contactNumber', { required: 'Contact number is required' })}
          />
          {errors.contactNumber && <p className="form-error">{errors.contactNumber.message}</p>}
        </div>

        {/* Address */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-2">
          <div>
            <label htmlFor="city_municipality" className="form-label">City/Municipality</label>
            <input
              id="city_municipality"
              type="text"
              className="form-input"
              placeholder="e.g., Zamboanga City"
              {...register('city_municipality', { required: 'City/Municipality is required' })}
            />
            {errors.city_municipality && <p className="form-error">{errors.city_municipality.message}</p>}
          </div>
          <div>
            <label htmlFor="barangay" className="form-label">Barangay</label>
            <input
              id="barangay"
              type="text"
              className="form-input"
              placeholder="e.g., Barangay Tugbungan"
              {...register('barangay', { required: 'Barangay is required' })}
            />
            {errors.barangay && <p className="form-error">{errors.barangay.message}</p>}
          </div>
          <div>
            <label htmlFor="street" className="form-label">Street</label>
            <input
              id="street"
              type="text"
              className="form-input"
              placeholder="e.g., 123 Main Street"
              {...register('street', { required: 'Street is required' })}
            />
            {errors.street && <p className="form-error">{errors.street.message}</p>}
          </div>
        </div>

        {/* Emergency Contact Name */}
        <div>
          <label htmlFor="emergencyContactName" className="form-label">Emergency Contact Name</label>
          <input
            id="emergencyContactName"
            type="text"
            className="form-input"
            {...register('emergencyContactName')}
          />
        </div>

        {/* Emergency Contact Number */}
        <div>
          <label htmlFor="emergencyContactNumber" className="form-label">Emergency Contact Number</label>
          <input
            id="emergencyContactNumber"
            type="text"
            className="form-input"
            {...register('emergencyContactNumber')}
          />
        </div>

        {/* Blood Type */}
        <div>
          <label htmlFor="bloodType" className="form-label">Blood Type</label>
          <select
            id="bloodType"
            className="form-input"
            {...register('bloodType')}
          >
            <option value="">Select Blood Type</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>

        {/* Allergies */}
        <div>
          <label htmlFor="allergies" className="form-label">Allergies</label>
          <input
            id="allergies"
            type="text"
            className="form-input"
            placeholder="Drug or food allergies if any"
            {...register('allergies')}
          />
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
              Saving...
            </>
          ) : (
            'Save Patient'
          )}
        </button>
      </div>
    </form>
  );
}
