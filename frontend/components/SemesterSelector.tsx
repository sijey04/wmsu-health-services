import React, { useState, useEffect } from 'react';
import { djangoApiClient } from '../utils/api';

type Semester = {
  id: number;
  semester_type: string;
  academic_year: string;
  is_current: boolean;
  status: string;
  semester_display?: string; // Full display name (e.g., "1st Semester 2024-2025")
};

interface SemesterSelectorProps {
  onSemesterChange: (semesterId: string) => void;
  className?: string;
}

const SemesterSelector: React.FC<SemesterSelectorProps> = ({ onSemesterChange, className = '' }) => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<string>('');

  useEffect(() => {
    const fetchSemesters = async () => {
      setLoading(true);
      try {
        const response = await djangoApiClient.get('/academic-semesters/');
        setSemesters(response.data);
        
        // If there's a current semester, select it by default
        const currentSemester = response.data.find((sem: Semester) => sem.is_current);
        if (currentSemester) {
          setSelectedSemester(currentSemester.id.toString());
          onSemesterChange(currentSemester.id.toString());
        }
      } catch (error) {
        console.error('Failed to fetch semesters:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSemesters();
  }, [onSemesterChange]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const semesterId = e.target.value;
    setSelectedSemester(semesterId);
    onSemesterChange(semesterId);
  };

  // Format semester display
  const formatSemesterDisplay = (semester: Semester) => {
    if (semester.semester_display) return semester.semester_display;
    
    const semesterTypeMap: Record<string, string> = {
      '1st': '1st Semester',
      '2nd': '2nd Semester',
      'summer': 'Summer',
      'midyear': 'Midyear',
    };
    
    const semesterType = semesterTypeMap[semester.semester_type] || semester.semester_type;
    return `${semesterType} ${semester.academic_year}${semester.is_current ? ' (Current)' : ''}`;
  };

  return (
    <div className={`semester-selector ${className}`}>
      <label htmlFor="semester-select" className="mr-2 text-gray-700 font-medium">
        Semester:
      </label>
      <select
        id="semester-select"
        value={selectedSemester}
        onChange={handleChange}
        className="rounded-md border-gray-300 shadow-sm focus:border-[#800000] focus:ring-[#800000] block"
        disabled={loading}
      >
        <option value="">All Semesters</option>
        {semesters.map((semester) => (
          <option key={semester.id} value={semester.id}>
            {formatSemesterDisplay(semester)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SemesterSelector;
