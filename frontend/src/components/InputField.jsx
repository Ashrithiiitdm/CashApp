import React, { useState } from 'react';

const InputField = ({ type, placeholder, icon, value, onChange, disabled }) => {
  // Store the current input type (e.g., 'password' or 'text')
  const [inputType, setInputType] = useState(type);
  
  // Check if this field was originally intended to be a password field
  const isPasswordField = type === 'password';

  // Logic to toggle between text and password
  const toggleVisibility = () => {
    if (isPasswordField) {
      setInputType((prev) => (prev === 'password' ? 'text' : 'password'));
    }
  };

  return (
    <div className="relative w-full group">
      <input
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full py-4 px-4 rounded-[20px] bg-white shadow-[0_4px_15px_rgba(0,0,0,0.05)] border-none outline-none text-gray-700 text-lg font-medium placeholder-gray-400 focus:ring-2 focus:ring-[#1581BF]/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      
      <div className="absolute right-6 top-1/2 -translate-y-1/2 select-none">
        {/* If an icon is provided, we clone it and pass the new props 
           (onClick and isVisible) to it automatically.
        */}
        {icon && React.cloneElement(icon, {
          onClick: toggleVisibility,
          isVisible: inputType === 'text' // True if we are showing text
        })}
      </div>
    </div>
  );
};

InputField.defaultProps = {
  value: '',
  onChange: () => {},
  disabled: false,
};

export default InputField;