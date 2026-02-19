import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MemberHeader from '../../components/MemberHeader';
import AppointmentCard from '../../components/Appointments/AppointmentCard';
import AppointmentModal from '../../components/Appointments/AppointmentModal';
import CalendarPickerModal from '../../components/Appointments/CalendarPickerModal';
import CompleteAppointmentModal from '../../components/Appointments/CompleteAppointmentModal';
import FamilyMemberTabs from '../../components/FamilyMemberTabs';
import { useFamilyMember } from '../../context/FamilyMemberContext';
import appointmentService from '../../services/appointmentService';
import calendarService from '../../services/calendarService';
import doctorService from '../../services/doctorService';
import './MyAppointments.css';

const MyAppointments = ({ onLogout }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
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
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [completingAppointment, setCompletingAppointment] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 425);
    const { activeMemberId, getActiveMemberName } = useFamilyMember();

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 425);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            navigate('/login');
            return;
        }
        fetchAppointments();
        fetchDoctors();
    }, [navigate]);

    useEffect(() => {
        fetchAppointments();
        fetchDoctors();
    }, [activeMemberId]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const data = await appointmentService.getAll(activeMemberId);
            setAppointments(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching appointments:', err);
            setError('Unable to load appointments');
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctors = async () => {
        try {
            const doctors = await doctorService.getAll(activeMemberId);
            setDoctors(doctors);
        } catch (err) {
            console.error('Error fetching doctors:', err);
            setDoctors([]);
        }
    };

    const handleAdd = () => {
        setEditingAppointment(null);
        setIsModalOpen(true);
    };

    const handleView = (appointment) => {
        setEditingAppointment(appointment);
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
                await appointmentService.create(appointmentData, activeMemberId);
            }
            await fetchAppointments();
            setIsModalOpen(false);
            setEditingAppointment(null);
        } catch (err) {
            console.error('Error saving appointment:', err);
            alert('Failed to save appointment. Please try again.');
        }
    };

    const handleDelete = async (id) => {
        try {
            await appointmentService.delete(id);
            await fetchAppointments();
            setIsModalOpen(false);
            setEditingAppointment(null);
        } catch (err) {
            console.error('Error deleting appointment:', err);
            alert('Failed to delete appointment. Please try again.');
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

    const handleComplete = (appointment) => {
        setCompletingAppointment(appointment);
        setIsCompleteModalOpen(true);
    };

    const handleCompleteSubmit = async (data) => {
        try {
            const result = await appointmentService.complete(completingAppointment._id, data);
            await fetchAppointments();
            return result;
        } catch (err) {
            console.error('Error completing appointment:', err);
            alert('Failed to complete appointment. Please try again.');
            throw err;
        }
    };

    const handlePostVisitActions = async ({ followUp, saveDoctor, appointment }) => {
        try {
            if (followUp) {
                await appointmentService.create({
                    title: `Follow-up: ${appointment.title}`,
                    type: 'follow-up',
                    dateTime: followUp.dateTime,
                    duration: appointment.duration,
                    doctorName: appointment.doctorName,
                    specialty: appointment.specialty,
                    location: appointment.location,
                    parentAppointmentId: appointment._id,
                    status: 'scheduled'
                }, activeMemberId);
            }
            if (saveDoctor) {
                await doctorService.create({
                    name: appointment.doctorName,
                    specialty: appointment.specialty,
                    practice: appointment.location ? {
                        name: appointment.location.name,
                        address: { street: appointment.location.address }
                    } : undefined,
                    phone: appointment.location?.phone
                }, activeMemberId);
            }
            await fetchAppointments();
            await fetchDoctors();
        } catch (err) {
            console.error('Error saving post-visit actions:', err);
            throw err;
        } finally {
            setIsCompleteModalOpen(false);
            setCompletingAppointment(null);
        }
    };

    const activeMemberName = getActiveMemberName();
    const pageLabel = activeMemberId ? `${activeMemberName}'s Appointments` : 'My Appointments';

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

    if (!user) {
        return null;
    }

    return (
        <div className="my-appointments-page">
            <MemberHeader user={user} onLogout={onLogout} />

            <main className="my-appointments-main">
                <a href="/dashboard" className="back-to-dashboard">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back to Dashboard
                </a>

                <FamilyMemberTabs />

                <div className="my-appointments-header">
                    <h1 className="my-appointments-title">{pageLabel}</h1>
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
                                            onView={handleView}
                                            onEdit={handleEdit}
                                            onComplete={handleComplete}
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
                                            onView={handleView}
                                            onEdit={handleEdit}
                                            onComplete={handleComplete}
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

            <CompleteAppointmentModal
                isOpen={isCompleteModalOpen}
                onClose={() => {
                    setIsCompleteModalOpen(false);
                    setCompletingAppointment(null);
                }}
                onComplete={handleCompleteSubmit}
                onPostVisitActions={handlePostVisitActions}
                appointment={completingAppointment}
                doctors={doctors}
                isMobile={isMobile}
            />
        </div>
    );
};

export default MyAppointments;
