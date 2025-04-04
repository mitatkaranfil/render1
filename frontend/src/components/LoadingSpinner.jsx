import React from 'react';
import PropTypes from 'prop-types';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-spinner flex flex-col items-center justify-center py-10">
      <div className="spinner w-10 h-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin mb-3"></div>
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
};

LoadingSpinner.propTypes = {
  message: PropTypes.string
};

export default LoadingSpinner; 