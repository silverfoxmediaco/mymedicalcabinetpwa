import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import SignupModal from './components/SignupModal';
import ConsentModal from './components/ConsentModal';
import MyDashboard from './pages/MyDashboard';
import Settings from './pages/Settings';
import MyMedications from './pages/MyMedications';
import MyDoctors from './pages/MyDoctors';
import MyMedicalRecords from './pages/MyMedicalRecords';
import MyInsurance from './pages/MyInsurance';
import MyAppointments from './pages/MyAppointments';
import MyMedicalBills from './pages/MyMedicalBills';
import Investors from './pages/Investors';
import VerifyEmail from './pages/VerifyEmail';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import IntakeForm from './pages/IntakeForm';
import SharedRecords from './pages/SharedRecords';
import BillerSettlement from './pages/BillerSettlement';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminStats from './pages/AdminStats';
import AdminManagement from './pages/AdminManagement';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import { FamilyMemberProvider } from './context/FamilyMemberContext';
import './App.css';

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
            <FamilyMemberProvider>
            <div className="App">
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/about" element={<Navigate to="/login" replace />} />
                    <Route path="/contact" element={<Navigate to="/login" replace />} />
                    <Route path="/security" element={<Navigate to="/login" replace />} />
                    <Route path="/privacy" element={<Navigate to="/login" replace />} />
                    <Route path="/investors" element={<Investors />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/shared-records/:accessCode" element={<SharedRecords />} />
                    <Route path="/settlement/:accessCode" element={<BillerSettlement />} />
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
                        path="/intake-form"
                        element={
                            <ProtectedRoute hasConsent={hasConsent} onShowConsent={handleShowConsent}>
                                <IntakeForm onLogout={handleLogout} />
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
                    <Route
                        path="/medical-bills"
                        element={
                            <ProtectedRoute hasConsent={hasConsent} onShowConsent={handleShowConsent}>
                                <MyMedicalBills onLogout={handleLogout} />
                            </ProtectedRoute>
                        }
                    />
                    {/* Admin routes */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin/dashboard" element={
                        <ProtectedAdminRoute>
                            <AdminDashboard />
                        </ProtectedAdminRoute>
                    } />
                    <Route path="/admin/users" element={
                        <ProtectedAdminRoute requiredPermission="canManageUsers">
                            <AdminUsers />
                        </ProtectedAdminRoute>
                    } />
                    <Route path="/admin/stats" element={
                        <ProtectedAdminRoute requiredPermission="canViewAnalytics">
                            <AdminStats />
                        </ProtectedAdminRoute>
                    } />
                    <Route path="/admin/management" element={
                        <ProtectedAdminRoute requiredPermission="canManageAdmins">
                            <AdminManagement />
                        </ProtectedAdminRoute>
                    } />

                    <Route path="*" element={<NotFound />} />
                </Routes>
                <SignupModal isOpen={isSignupOpen} onClose={closeSignup} />
                <ConsentModal
                    isOpen={showConsentModal}
                    onAccept={handleAcceptConsent}
                    onDecline={handleDeclineConsent}
                />
            </div>
            </FamilyMemberProvider>
        </Router>
    );
}

export default App;
