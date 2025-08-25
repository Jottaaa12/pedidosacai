import React from 'react';

const ProgressBar = ({ currentStep, totalSteps = 9 }) => {
  const progress = currentStep > 1 ? ((currentStep - 1) / (totalSteps - 1)) * 100 : 0;

  return (
    <div className="w-full bg-gray-300">
      <div
        className="h-2 bg-gradient-to-r from-primary to-secondary transition-all duration-500"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default ProgressBar;