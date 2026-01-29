import React, { useState, useEffect } from 'react';
import MemberHeader from '../../components/MemberHeader';
import AppointmentCard from '../../components/Appointments/AppointmentCard';
import AppointmentModal from '../../components/Appointments/AppointmentModal';
import CalendarPickerModal from '../../components/Appointments/CalendarPickerModal';
import appointmentService from '../../services/appointmentService';
import calendarService from '../../services/calendarService';
import doctorService from '../../services/doctorService';
import './MyAppointments.css';

const MyAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [isCalendarPickerOpen, setIsCalendarPickerOpen] = useState(false);
    const [pendingCalendarAppointment, setPendingCalendarAppointment] = useState(null);
    const [preferredCalendar, setPreferredCalendar] = useState(() => {
        return localStorage.getItem('preferredCalendar') || null;
    });
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 425);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 425);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchAppointments();
        fetchDoctors();
    }, []);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const data = await appointmentService.getAll();
            setAppointments(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching appointments:', err);
            setError('Unable to load appointments');
            // Mock data for development
            setAppointments([
                {
                    _id: '1',
                    title: 'Annual Physical',
                    type: 'physical',
                    dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    duration: 60,
                    doctor: { name: 'Dr. Sarah Johnson', specialty: 'Family Medicine' },
                    location: '456 Medical Center Dr, Suite 200',
                    status: 'confirmed',
                    notes: 'Fasting required - no food after midnight',
                    reminder: true
                },
                {
                    _id: '2',
                    title: 'Cardiology Follow-up',
                    type: 'follow-up',
                    dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                    duration: 30,
                    doctor: { name: 'Dr. Michael Chen', specialty: 'Cardiology' },
                    location: '789 Heart Health Blvd',
                    status: 'pending',
                    reminder: true
                },
                {
                    _id: '3',
                    title: 'Lab Work',
                    type: 'lab-work',
                    dateTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
                    duration: 15,
                    location: 'Quest Diagnostics - Main St',
                    status: 'confirmed',
                    notes: 'Bring insurance card and lab order',
                    reminder: true
                },
                {
                    _id: '4',
                    title: 'Dental Cleaning',
                    type: 'dental',
                    dateTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                    duration: 60,
                    doctor: { name: 'Dr. Emily White', specialty: 'Dentistry' },
                    location: 'Smile Dental Care',
                    status: 'completed',
                    reminder: false
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctors = async () => {
        try {
            const data = await doctorService.getAll();
            setDoctors(data);
        } catch (err) {
            console.error('Error fetching doctors:', err);
            setDoctors([]);
        }
    };

    const handleAdd = () => {
        setEditingAppointment(null);
        setIsModalOpen(true);
    };

    const handleEdit = (appointment) => {
        setEditingAppointment(appointment);
        setIsModalOpen(true);
    };

    const handleSave = async (appointmentData) => {
        try {
            if (editingAppointment) {
                await appointmentService.update(editingAppointment._id, appointmentData);
            } else {
                await appointmentService.create(appointmentData);
            }
            fetchAppointments();
            setIsModalOpen(false);
            setEditingAppointment(null);
        } catch (err) {
            console.error('Error saving appointment:', err);
            // Mock save for development
            if (editingAppointment) {
                setAppointments(prev =>
                    prev.map(appt =>
                        appt._id === editingAppointment._id
                            ? { ...appt, ...appointmentData }
                            : appt
                    )
                );
            } else {
                setAppointments(prev => [
                    ...prev,
                    { ...appointmentData, _id: Date.now().toString() }
                ]);
            }
            setIsModalOpen(false);
            setEditingAppointment(null);
        }
    };

    const handleDelete = async (id) => {
        try {
            await appointmentService.delete(id);
            fetchAppointments();
            setIsModalOpen(false);
            setEditingAppointment(null);
        } catch (err) {
            console.error('Error deleting appointment:', err);
            // Mock delete for development
            setAppointments(prev => prev.filter(appt => appt._id !== id));
            setIsModalOpen(false);
            setEditingAppointment(null);
        }
    };

    const handleAddToCalendar = (appointment) => {
        if (preferredCalendar) {
            // User has a saved preference, use it directly
            calendarService.addToCalendar(appointment, preferredCalendar);
        } else {
            // No preference saved, show picker
            setPendingCalendarAppointment(appointment);
            setIsCalendarPickerOpen(true);
        }
    };

    const handleCalendarSelect = (calendarType) => {
        // Save preference
        localStorage.setItem('preferredCalendar', calendarType);
        setPreferredCalendar(calendarType);

        // TODO: Also save to user profile via API when auth is connected
        // await userService.updateProfile({ preferredCalendar: calendarType });

        // Add the pending appointment to calendar
        if (pendingCalendarAppointment) {
            calendarService.addToCalendar(pendingCalendarAppointment, calendarType);
        }

        setIsCalendarPickerOpen(false);
        setPendingCalendarAppointment(null);
    };

    // Sort appointments: upcoming first (by date), then past
    const now = new Date();
    const upcomingAppointments = appointments
        .filter(appt => new Date(appt.dateTime) >= now && appt.status !== 'cancelled')
        .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

    const pastAppointments = appointments
        .filter(appt => new Date(appt.dateTime) < now || appt.status === 'cancelled')
        .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

    const CalendarPlusIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <line x1="12" y1="14" x2="12" y2="18" />
            <line x1="10" y1="16" x2="14" y2="16" />
        </svg>
    );

    return (
        <div className="my-appointments-page">
            <MemberHeader />

            <main className="my-appointments-main">
                <a href="/dashboard" className="back-to-dashboard">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back to Dashboard
                </a>
                <div className="my-appointments-header">
                    <h1 className="my-appointments-title">My Appointments</h1>
                    <button
                        className="my-appointments-add-btn"
                        onClick={handleAdd}
                        type="button"
                    >
                        <CalendarPlusIcon />
                        New Appointment
                    </button>
                </div>

                {preferredCalendar && (
                    <div className="my-appointments-calendar-pref">
                        <span>
                            Calendar: {calendarService.getCalendarLabel(preferredCalendar)}
                        </span>
                        <button
                            type="button"
                            onClick={() => setIsCalendarPickerOpen(true)}
                        >
                            Change
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="my-appointments-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading appointments...</p>
                    </div>
                ) : error && appointments.length === 0 ? (
                    <div className="my-appointments-error">
                        <p>{error}</p>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="my-appointments-empty">
                        <div className="empty-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        </div>
                        <h3>No Appointments</h3>
                        <p>Schedule your medical appointments and never miss a visit.</p>
                        <button
                            className="empty-add-btn"
                            onClick={handleAdd}
                            type="button"
                        >
                            Schedule Your First Appointment
                        </button>
                    </div>
                ) : (
                    <>
                        {upcomingAppointments.length > 0 && (
                            <section className="my-appointments-section">
                                <h2 className="my-appointments-section-title">
                                    Upcoming
                                    <span className="section-count">{upcomingAppointments.length}</span>
                                </h2>
                                <div className="my-appointments-grid">
                                    {upcomingAppointments.map(appointment => (
                                        <AppointmentCard
                                            key={appointment._id}
                                            appointment={appointment}
                                            onEdit={handleEdit}
                                            onAddToCalendar={handleAddToCalendar}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {pastAppointments.length > 0 && (
                            <section className="my-appointments-section">
                                <h2 className="my-appointments-section-title past">
                                    Past & Cancelled
                                    <span className="section-count">{pastAppointments.length}</span>
                                </h2>
                                <div className="my-appointments-grid">
                                    {pastAppointments.map(appointment => (
                                        <AppointmentCard
                                            key={appointment._id}
                                            appointment={appointment}
                                            onEdit={handleEdit}
                                            onAddToCalendar={handleAddToCalendar}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </main>

            <AppointmentModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingAppointment(null);
                }}
                onSave={handleSave}
                onDelete={handleDelete}
                appointment={editingAppointment}
                doctors={doctors}
                isMobile={isMobile}
            />

            <CalendarPickerModal
                isOpen={isCalendarPickerOpen}
                onClose={() => {
                    setIsCalendarPickerOpen(false);
                    setPendingCalendarAppointment(null);
                }}
                onSelect={handleCalendarSelect}
                currentSelection={preferredCalendar}
                isMobile={isMobile}
            />
        </div>
    );
};

export default MyAppointments;
