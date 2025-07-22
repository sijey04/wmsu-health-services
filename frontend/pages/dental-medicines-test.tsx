import React, { useState, useEffect } from 'react';
import { dentalMedicinesAPI } from '../utils/api';

interface DentalMedicine {
  id: number;
  name: string;
  type: string;
  type_display: string;
  description: string;
  unit: string;
  is_active: boolean;
}

export default function DentalMedicinesTest() {
  const [medicines, setMedicines] = useState<DentalMedicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadMedicines = async () => {
    setLoading(true);
    try {
      const response = await dentalMedicinesAPI.getAll();
      setMedicines(response.data || []);
      setMessage(`Loaded ${response.data?.length || 0} dental medicines`);
    } catch (error) {
      console.error('Error loading medicines:', error);
      setMessage('Error loading medicines: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const populateSamples = async () => {
    setLoading(true);
    try {
      const response = await dentalMedicinesAPI.populateSamples();
      setMessage(response.data.message);
      await loadMedicines(); // Reload after population
    } catch (error) {
      console.error('Error populating samples:', error);
      setMessage('Error populating samples: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dental Medicines & Supplies Test</h1>
      
      <div className="mb-6">
        <button
          onClick={populateSamples}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 mr-4"
        >
          {loading ? 'Processing...' : 'Populate Sample Data'}
        </button>
        
        <button
          onClick={loadMedicines}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Reload Medicines'}
        </button>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-blue-100 border border-blue-300 rounded">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {medicines.map((medicine) => (
          <div key={medicine.id} className="border rounded-lg p-4 shadow">
            <h3 className="font-bold text-lg">{medicine.name}</h3>
            <p className="text-sm text-gray-600">{medicine.type_display}</p>
            <p className="text-sm text-gray-500">Unit: {medicine.unit}</p>
            {medicine.description && (
              <p className="text-sm mt-2">{medicine.description}</p>
            )}
            <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
              medicine.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {medicine.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        ))}
      </div>

      {medicines.length === 0 && !loading && (
        <div className="text-center text-gray-500 mt-8">
          No dental medicines found. Click &ldquo;Populate Sample Data&rdquo; to add some.
        </div>
      )}
    </div>
  );
}
