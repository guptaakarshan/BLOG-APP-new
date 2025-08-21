import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthModal = ({ isOpen, onClose }) => {
    const [isLogin, setIsLogin] = useState(true);
    const { googleLogin } = useAuth();

    if (!isOpen) return null;

    const handleSwitchToRegister = () => {
        setIsLogin(false);
    };

    const handleSwitchToLogin = () => {
        setIsLogin(true);
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const result = await googleLogin(credentialResponse.credential);
            if (result.success) {
                onClose();
            }
        } catch (error) {
            console.error('Google authentication error:', error);
        }
    };

    const handleGoogleError = () => {
        console.error('Google authentication failed');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-md w-full">
                {/* Google Sign-in Button */}
                <div className="mb-6 text-center">
                    <h3 className="text-lg font-semibold text-white mb-4">
                        {isLogin ? 'Sign In to Your Account' : 'Create New Account'}
                    </h3>
                    <div className="mb-4">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            useOneTap
                            theme="filled_blue"
                            size="large"
                            text={isLogin ? 'signin_with' : 'signup_with'}
                            shape="rectangular"
                        />
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-slate-800 text-slate-400">Or continue with</span>
                        </div>
                    </div>
                </div>

                {isLogin ? (
                    <LoginForm
                        onSwitchToRegister={handleSwitchToRegister}
                        onClose={onClose}
                    />
                ) : (
                    <RegisterForm
                        onSwitchToLogin={handleSwitchToLogin}
                        onClose={onClose}
                    />
                )}
            </div>
        </div>
    );
};

export default AuthModal;
