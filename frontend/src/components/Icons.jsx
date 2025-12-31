import React from 'react';
import logoImage from '../assets/icons/logo.png';
import eyeImage from '../assets/icons/eye.png';
import emailImage from '../assets/icons/email.png';
import usernameImage from '../assets/icons/username.png';

export const EmailIcon = () => (
  <img
    src={emailImage}
    alt="Email Icon"
    className='w-7 h-7'
  />
);

export const UserNameIcon = () => (
  <img
    src={usernameImage} 
    alt='Username Icon'
    className='w-7 h-7'
  />
);

export const EyeIcon = ({ onClick, isVisible }) => (
  <img 
    src={eyeImage} 
    alt="Toggle Password Visibility"
    onClick={onClick}
    className={`w-8 h-8 cursor-pointer transition-opacity duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-20'
    }`}
  />
);

export const LogoIcon = () => (
  <img 
    src={logoImage} 
    alt="CashPay Logo" 
    className="w-16 h-16 rounded-xl shadow-sm object-cover" 
  />
);