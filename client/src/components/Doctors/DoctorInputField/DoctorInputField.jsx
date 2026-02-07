import React, { useState } from 'react';
import DoctorModal from '../DoctorModal';
import doctorService from '../../../services/doctorService';
import './DoctorInputField.css';

const DoctorInputField = ({
    doctors = [],
    value = null,
    onChange,
    onDoctorCreated,
    placeholder = 'Select a doctor',
    isMobile = false
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSelectChange = (e) => {
        const selectedValue = e.target.value;

        if (selectedValue === 'add-new') {
            setIsModalOpen(true);
            return;
        }

        if (selectedValue === '') {
            onChange({ doctorId: null, doctorName: '', specialty: '' });
            return;
        }

        const selectedDoctor = doctors.find(d => d._id === selectedValue);
        if (selectedDoctor) {
            onChange({
                doctorId: selectedDoctor._id,
                doctorName: selectedDoctor.name,
                specialty: selectedDoctor.specialty || ''
            });
        }
    };

    const handleDoctorSave = async (doctorData) => {
        try {
            const result = await doctorService.create(doctorData);
            const newDoctor = result.data;

            if (onDoctorCreated) {
                onDoctorCreated(newDoctor);
            }

            onChange({
                doctorId: newDoctor._id,
                doctorName: newDoctor.name,
                specialty: newDoctor.specialty || ''
            });

            setIsModalOpen(false);
        } catch (error) {
            console.error('Error creating doctor:', error);
            alert('Failed to create doctor. Please try again.');
        }
    };

    const PlusIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );

    return (
        <div className="doctor-input-container">
            <select
                className="doctor-input-select"
                value={value?.doctorId || ''}
                onChange={handleSelectChange}
            >
                <option value="">{placeholder}</option>
                {doctors.map(doctor => (
                    <option key={doctor._id} value={doctor._id}>
                        {doctor.name}
                        {doctor.specialty ? ` - ${doctor.specialty}` : ''}
                    </option>
                ))}
                <option value="add-new" className="doctor-input-add-option">
                    + Add New Doctor
                </option>
            </select>

            {value?.doctorName && (
                <div className="doctor-input-selected">
                    <span className="doctor-input-selected-name">{value.doctorName}</span>
                    {value.specialty && (
                        <span className="doctor-input-selected-specialty">{value.specialty}</span>
                    )}
                </div>
            )}

            <DoctorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleDoctorSave}
                doctor={null}
                isMobile={isMobile}
            />
        </div>
    );
};

export default DoctorInputField;
