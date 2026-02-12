import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeView, setActiveView] = useState(() => {
        if (searchParams.get('signup') === 'true') return 'signup';
        return 'login';
    });

    // Login state
    const [loginData, setLoginData] = useState({ email: '', password: '' });

    // Signup state
    const [signupData, setSignupData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        ageConfirmed: false
    });

    // Forgot password state
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);

    // Forgot username state
    const [forgotUsernameData, setForgotUsernameData] = useState({ lastName: '', ssnLast4: '' });
    const [forgotUsernameResult, setForgotUsernameResult] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [signupSuccess, setSignupSuccess] = useState(false);

    // Sync mode with URL param
    useEffect(() => {
        if (searchParams.get('signup') === 'true') {
            setActiveView('signup');
        }
    }, [searchParams]);

    // Password strength validation
    const passwordRequirements = {
        minLength: signupData.password.length >= 8,
        hasUppercase: /[A-Z]/.test(signupData.password),
        hasLowercase: /[a-z]/.test(signupData.password),
        hasNumber: /[0-9]/.test(signupData.password),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(signupData.password)
    };

    const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

    const switchToSignup = () => {
        setError('');
        setActiveView('signup');
        setSearchParams({ signup: 'true' });
    };

    const switchToLogin = () => {
        setError('');
        setSignupSuccess(false);
        setForgotPasswordSuccess(false);
        setForgotUsernameResult('');
        setActiveView('login');
        setSearchParams({});
    };

    const switchToForgotPassword = () => {
        setError('');
        setForgotPasswordEmail('');
        setForgotPasswordSuccess(false);
        setActiveView('forgotPassword');
    };

    const switchToForgotUsername = () => {
        setError('');
        setForgotUsernameData({ lastName: '', ssnLast4: '' });
        setForgotUsernameResult('');
        setActiveView('forgotUsername');
    };

    const handleLoginChange = (e) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    const handleSignupChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSignupData({
            ...signupData,
            [name]: type === 'checkbox' ? checked : value
        });
        if (error) setError('');
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await authService.login(loginData.email, loginData.password);
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (signupData.password !== signupData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!isPasswordValid) {
            setError('Password does not meet all requirements');
            return;
        }

        if (!signupData.ageConfirmed) {
            setError('You must confirm you are 13 years of age or older');
            return;
        }

        setIsLoading(true);

        try {
            await authService.register({
                firstName: signupData.firstName,
                lastName: signupData.lastName,
                email: signupData.email,
                password: signupData.password
            });
            setSignupSuccess(true);
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPasswordSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await authService.forgotPassword(forgotPasswordEmail);
            setForgotPasswordSuccess(true);
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotUsernameSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await authService.forgotUsername(
                forgotUsernameData.lastName,
                forgotUsernameData.ssnLast4
            );
            setForgotUsernameResult(result.maskedEmail);
        } catch (err) {
            setError(err.message || 'No account found matching those details');
        } finally {
            setIsLoading(false);
        }
    };

    const renderLoginView = () => (
        <>
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">Sign in to access your medical cabinet</p>

            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleLoginSubmit} className="login-form">
                <div className="login-form-group">
                    <div className="login-label-row">
                        <label htmlFor="email" className="login-label">Email</label>
                        <button
                            type="button"
                            className="login-forgot-link"
                            onClick={switchToForgotUsername}
                        >
                            Forgot your email?
                        </button>
                    </div>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        className="login-input"
                        value={loginData.email}
                        onChange={handleLoginChange}
                        required
                        disabled={isLoading}
                        autoComplete="email"
                    />
                </div>

                <div className="login-form-group">
                    <div className="login-label-row">
                        <label htmlFor="password" className="login-label">Password</label>
                        <button
                            type="button"
                            className="login-forgot-link"
                            onClick={switchToForgotPassword}
                        >
                            Forgot password?
                        </button>
                    </div>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        className="login-input"
                        value={loginData.password}
                        onChange={handleLoginChange}
                        required
                        disabled={isLoading}
                        autoComplete="current-password"
                    />
                </div>

                <button
                    type="submit"
                    className="login-submit-btn"
                    disabled={isLoading}
                >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
            </form>

            <p className="login-signup-prompt">
                Don't have an account?{' '}
                <button className="login-toggle-link" onClick={switchToSignup}>
                    Sign up
                </button>
            </p>
        </>
    );

    const renderSignupView = () => (
        signupSuccess ? (
            <div className="login-success-section">
                <div className="login-success-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M9 12l2 2 4-4"/>
                    </svg>
                </div>
                <h1 className="login-title">Check Your Email</h1>
                <p className="login-subtitle">
                    We've sent a verification email to <strong>{signupData.email}</strong>.
                    Please check your inbox and click the link to verify your account.
                </p>
                <p className="login-note">
                    Didn't receive the email? Check your spam folder or try again in a few minutes.
                </p>
                <button className="login-submit-btn" onClick={switchToLogin}>
                    Go to Sign In
                </button>
            </div>
        ) : (
            <>
                <h1 className="login-title">Create Account</h1>
                <p className="login-subtitle">Start managing your health records today.</p>

                {error && <div className="login-error">{error}</div>}

                <form onSubmit={handleSignupSubmit} className="login-form">
                    <div className="login-form-row">
                        <div className="login-form-group">
                            <label htmlFor="firstName" className="login-label">First Name</label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                className="login-input"
                                value={signupData.firstName}
                                onChange={handleSignupChange}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="login-form-group">
                            <label htmlFor="lastName" className="login-label">Last Name</label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                className="login-input"
                                value={signupData.lastName}
                                onChange={handleSignupChange}
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="login-form-group">
                        <label htmlFor="signupEmail" className="login-label">Email</label>
                        <input
                            type="email"
                            id="signupEmail"
                            name="email"
                            className="login-input"
                            value={signupData.email}
                            onChange={handleSignupChange}
                            required
                            disabled={isLoading}
                            autoComplete="email"
                        />
                    </div>

                    <div className="login-form-group">
                        <label htmlFor="signupPassword" className="login-label">Password</label>
                        <input
                            type="password"
                            id="signupPassword"
                            name="password"
                            className="login-input"
                            value={signupData.password}
                            onChange={handleSignupChange}
                            required
                            disabled={isLoading}
                            minLength={8}
                            autoComplete="new-password"
                        />
                        {signupData.password && (
                            <div className="login-password-requirements">
                                <div className={`login-password-req ${passwordRequirements.minLength ? 'login-password-req-met' : ''}`}>
                                    <span className="login-password-req-icon">{passwordRequirements.minLength ? '✓' : '○'}</span>
                                    At least 8 characters
                                </div>
                                <div className={`login-password-req ${passwordRequirements.hasUppercase ? 'login-password-req-met' : ''}`}>
                                    <span className="login-password-req-icon">{passwordRequirements.hasUppercase ? '✓' : '○'}</span>
                                    One uppercase letter
                                </div>
                                <div className={`login-password-req ${passwordRequirements.hasLowercase ? 'login-password-req-met' : ''}`}>
                                    <span className="login-password-req-icon">{passwordRequirements.hasLowercase ? '✓' : '○'}</span>
                                    One lowercase letter
                                </div>
                                <div className={`login-password-req ${passwordRequirements.hasNumber ? 'login-password-req-met' : ''}`}>
                                    <span className="login-password-req-icon">{passwordRequirements.hasNumber ? '✓' : '○'}</span>
                                    One number
                                </div>
                                <div className={`login-password-req ${passwordRequirements.hasSpecial ? 'login-password-req-met' : ''}`}>
                                    <span className="login-password-req-icon">{passwordRequirements.hasSpecial ? '✓' : '○'}</span>
                                    One special character (!@#$%^&* etc.)
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="login-form-group">
                        <label htmlFor="confirmPassword" className="login-label">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            className="login-input"
                            value={signupData.confirmPassword}
                            onChange={handleSignupChange}
                            required
                            disabled={isLoading}
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="login-checkbox-group">
                        <label className="login-checkbox-label">
                            <input
                                type="checkbox"
                                name="ageConfirmed"
                                checked={signupData.ageConfirmed}
                                onChange={handleSignupChange}
                                disabled={isLoading}
                                className="login-checkbox"
                            />
                            <span className="login-checkbox-text">
                                I confirm that I am 13 years of age or older
                            </span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="login-submit-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <p className="login-signup-prompt">
                    Already have an account?{' '}
                    <button className="login-toggle-link" onClick={switchToLogin}>
                        Sign in
                    </button>
                </p>
            </>
        )
    );

    const renderForgotPasswordView = () => (
        forgotPasswordSuccess ? (
            <div className="login-success-section">
                <div className="login-success-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M9 12l2 2 4-4"/>
                    </svg>
                </div>
                <h1 className="login-title">Check Your Email</h1>
                <p className="login-subtitle">
                    If an account exists with that email, we've sent a password reset link. Please check your inbox.
                </p>
                <p className="login-note">
                    Didn't receive the email? Check your spam folder or try again in a few minutes.
                </p>
                <button className="login-toggle-link login-back-to-signin" onClick={switchToLogin}>
                    Back to Sign In
                </button>
            </div>
        ) : (
            <>
                <h1 className="login-title">Reset Password</h1>
                <p className="login-subtitle">Enter your email and we'll send you a reset link.</p>

                {error && <div className="login-error">{error}</div>}

                <form onSubmit={handleForgotPasswordSubmit} className="login-form">
                    <div className="login-form-group">
                        <label htmlFor="forgotPasswordEmail" className="login-label">Email</label>
                        <input
                            type="email"
                            id="forgotPasswordEmail"
                            className="login-input"
                            value={forgotPasswordEmail}
                            onChange={(e) => { setForgotPasswordEmail(e.target.value); if (error) setError(''); }}
                            required
                            disabled={isLoading}
                            autoComplete="email"
                        />
                    </div>

                    <button
                        type="submit"
                        className="login-submit-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <button className="login-toggle-link login-back-to-signin" onClick={switchToLogin}>
                    Back to Sign In
                </button>
            </>
        )
    );

    const renderForgotUsernameView = () => (
        forgotUsernameResult ? (
            <div className="login-success-section">
                <div className="login-success-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M9 12l2 2 4-4"/>
                    </svg>
                </div>
                <h1 className="login-title">Account Found</h1>
                <p className="login-subtitle">
                    Your registered email is:
                </p>
                <p className="login-masked-email">{forgotUsernameResult}</p>
                <button className="login-toggle-link login-back-to-signin" onClick={switchToLogin}>
                    Back to Sign In
                </button>
            </div>
        ) : (
            <>
                <h1 className="login-title">Find Your Account</h1>
                <p className="login-subtitle">Enter your last name and the last 4 digits of your SSN.</p>

                {error && <div className="login-error">{error}</div>}

                <form onSubmit={handleForgotUsernameSubmit} className="login-form">
                    <div className="login-form-group">
                        <label htmlFor="forgotLastName" className="login-label">Last Name</label>
                        <input
                            type="text"
                            id="forgotLastName"
                            className="login-input"
                            value={forgotUsernameData.lastName}
                            onChange={(e) => { setForgotUsernameData({ ...forgotUsernameData, lastName: e.target.value }); if (error) setError(''); }}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="login-form-group">
                        <label htmlFor="forgotSsn" className="login-label">Last 4 of SSN</label>
                        <input
                            type="text"
                            id="forgotSsn"
                            className="login-input"
                            value={forgotUsernameData.ssnLast4}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                setForgotUsernameData({ ...forgotUsernameData, ssnLast4: val });
                                if (error) setError('');
                            }}
                            required
                            disabled={isLoading}
                            maxLength={4}
                            inputMode="numeric"
                            pattern="[0-9]{4}"
                            placeholder="1234"
                        />
                    </div>

                    <button
                        type="submit"
                        className="login-submit-btn"
                        disabled={isLoading || forgotUsernameData.ssnLast4.length !== 4}
                    >
                        {isLoading ? 'Looking up...' : 'Look Up Account'}
                    </button>
                </form>

                <button className="login-toggle-link login-back-to-signin" onClick={switchToLogin}>
                    Back to Sign In
                </button>
            </>
        )
    );

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <a href="/" className="login-logo">
                        <img
                            src="https://mymedicalcabinet.s3.us-east-2.amazonaws.com/logos/logo-b2-stacked.svg"
                            alt="MyMedicalCabinet"
                            className="login-logo-img"
                        />
                    </a>
                </div>

                {activeView === 'login' && renderLoginView()}
                {activeView === 'signup' && renderSignupView()}
                {activeView === 'forgotPassword' && renderForgotPasswordView()}
                {activeView === 'forgotUsername' && renderForgotUsernameView()}
            </div>
        </div>
    );
};

export default Login;
