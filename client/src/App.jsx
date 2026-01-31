import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import AboutPlatform from './components/AboutPlatform';
import WhyUs from './components/WhyUs';
import PreFooter from './components/PreFooter';
import Footer from './components/Footer';
import SignupModal from './components/SignupModal';
import ConsentModal from './components/ConsentModal';
import MyDashboard from './pages/MyDashboard';
import Settings from './pages/Settings';
import MyMedications from './pages/MyMedications';
import MyDoctors from './pages/MyDoctors';
import MyMedicalRecords from './pages/MyMedicalRecords';
import MyInsurance from './pages/MyInsurance';
import MyAppointments from './pages/MyAppointments';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import VerifyEmail from './pages/VerifyEmail';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
// Landing Pages
import LostMedicalRecords from './pages/LostMedicalRecords';
import ElderlyParentCare from './pages/ElderlyParentCare';
import EmergencyRoomReady from './pages/EmergencyRoomReady';
import MedicationManagement from './pages/MedicationManagement';
import SwitchingDoctors from './pages/SwitchingDoctors';
import ChronicConditions from './pages/ChronicConditions';
import FamilyHealthHistory from './pages/FamilyHealthHistory';
import MedicationErrors from './pages/MedicationErrors';
import InsuranceClaims from './pages/InsuranceClaims';
import TravelHealth from './pages/TravelHealth';
import './App.css';

// Homepage component
const HomePage = ({ openSignup }) => (
    <>
        <Header onSignupClick={openSignup} />
        <main>
            <Hero onSignupClick={openSignup} />
            <AboutPlatform />
            <WhyUs />
        </main>
        <PreFooter onSignupClick={openSignup} />
        <Footer />
    </>
);

// Protected Route wrapper - checks for consent before showing content
const ProtectedRoute = ({ children, hasConsent, onShowConsent }) => {
    useEffect(() => {
        if (!hasConsent) {
            onShowConsent();
        }
    }, [hasConsent, onShowConsent]);

    // Always render children, modal overlay handles blocking
    return children;
};

function App() {
    const [isSignupOpen, setIsSignupOpen] = useState(false);
    const [showConsentModal, setShowConsentModal] = useState(false);
    const [hasConsent, setHasConsent] = useState(() => {
        // Check localStorage for consent (mock - replace with API call when auth is ready)
        return localStorage.getItem('userConsent') === 'true';
    });

    const openSignup = () => setIsSignupOpen(true);
    const closeSignup = () => setIsSignupOpen(false);

    const handleShowConsent = () => {
        if (!hasConsent) {
            setShowConsentModal(true);
        }
    };

    const handleAcceptConsent = async (acceptTerms, acceptPrivacy, acceptHipaa) => {
        // TODO: Replace with actual API call when auth is connected
        // await consentService.acceptConsent(acceptTerms, acceptPrivacy, acceptHipaa);

        // For now, store in localStorage as mock
        localStorage.setItem('userConsent', 'true');
        localStorage.setItem('consentDate', new Date().toISOString());

        setHasConsent(true);
        setShowConsentModal(false);
    };

    const handleDeclineConsent = () => {
        // User declined - log them out / send back to home
        localStorage.removeItem('userConsent');
        setHasConsent(false);
        setShowConsentModal(false);
        window.location.href = '/';
    };

    const handleLogout = () => {
        // Handle logout logic here
        console.log('Logging out...');
        // Don't clear consent on logout - they already agreed
        window.location.href = '/';
    };

    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<HomePage openSignup={openSignup} />} />
                    <Route path="/about" element={<AboutUs onSignupClick={openSignup} />} />
                    <Route path="/contact" element={<ContactUs onSignupClick={openSignup} />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/login" element={<Login />} />
                    {/* Landing Pages */}
                    <Route path="/lost-medical-records" element={<LostMedicalRecords onSignupClick={openSignup} />} />
                    <Route path="/elderly-parent-care" element={<ElderlyParentCare onSignupClick={openSignup} />} />
                    <Route path="/emergency-room-ready" element={<EmergencyRoomReady onSignupClick={openSignup} />} />
                    <Route path="/medication-management" element={<MedicationManagement onSignupClick={openSignup} />} />
                    <Route path="/switching-doctors" element={<SwitchingDoctors onSignupClick={openSignup} />} />
                    <Route path="/chronic-conditions" element={<ChronicConditions onSignupClick={openSignup} />} />
                    <Route path="/family-health-history" element={<FamilyHealthHistory onSignupClick={openSignup} />} />
                    <Route path="/medication-errors" element={<MedicationErrors onSignupClick={openSignup} />} />
                    <Route path="/insurance-claims" element={<InsuranceClaims onSignupClick={openSignup} />} />
                    <Route path="/travel-health" element={<TravelHealth onSignupClick={openSignup} />} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute hasConsent={hasConsent} onShowConsent={handleShowConsent}>
                                <MyDashboard onLogout={handleLogout} />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <ProtectedRoute hasConsent={hasConsent} onShowConsent={handleShowConsent}>
                                <Settings onLogout={handleLogout} />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/medications"
                        element={
                            <ProtectedRoute hasConsent={hasConsent} onShowConsent={handleShowConsent}>
                                <MyMedications onLogout={handleLogout} />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/doctors"
                        element={
                            <ProtectedRoute hasConsent={hasConsent} onShowConsent={handleShowConsent}>
                                <MyDoctors onLogout={handleLogout} />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/medical-records"
                        element={
                            <ProtectedRoute hasConsent={hasConsent} onShowConsent={handleShowConsent}>
                                <MyMedicalRecords onLogout={handleLogout} />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/insurance"
                        element={
                            <ProtectedRoute hasConsent={hasConsent} onShowConsent={handleShowConsent}>
                                <MyInsurance onLogout={handleLogout} />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/appointments"
                        element={
                            <ProtectedRoute hasConsent={hasConsent} onShowConsent={handleShowConsent}>
                                <MyAppointments onLogout={handleLogout} />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="*" element={<NotFound />} />
                </Routes>
                <SignupModal isOpen={isSignupOpen} onClose={closeSignup} />
                <ConsentModal
                    isOpen={showConsentModal}
                    onAccept={handleAcceptConsent}
                    onDecline={handleDeclineConsent}
                />
            </div>
        </Router>
    );
}

export default App;
