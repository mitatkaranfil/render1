import React from 'react';
import PropTypes from 'prop-types';

const TimeframeSelector = ({ options, selectedValue, onChange }) => {
  return (
    <div className="timeframe-selector bg-card-bg rounded-lg p-1 flex mb-6">
      {options.map((option) => (
        <button
          key={option.value}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedValue === option.value
              ? 'bg-primary text-white'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

TimeframeSelector.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  selectedValue: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};

export default TimeframeSelector; 