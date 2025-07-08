import Link from 'next/link';
import DentalForm from '../components/DentalForm';
import { useRouter } from 'next/router';

const DentalFormPage = () => {
    const router = useRouter();
    const { appointmentId } = router.query;

    return (
        <div className="bg-gray-100 min-h-screen">
            <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <Link href="/admin/dental-consultations" className="text-blue-600 hover:underline inline-flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        Back to Appointments
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow-lg">
                    
                    <div className="p-6 sm:p-8">
                        <DentalForm appointmentId={appointmentId as string} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DentalFormPage; 