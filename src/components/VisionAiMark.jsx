import React from 'react';

/** Vision AI mark: cyan 4-point star on a navy tile. */
export default function VisionAiMark({ size = 20, className = '' }) {
  const ink = '#5DB7E7';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0.5 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect x="0.5" y="0" width="48" height="48" rx="4" fill="#1E2761" />
      <path
        d="M27.92 18.2305V20.897M29.2437 19.5637H26.5964M18.6546 30.23C18.6546 30.9663 18.062 31.5633 17.331 31.5633C16.5999 31.5633 16.0073 30.9663 16.0073 30.23C16.0073 29.4936 16.5999 28.8967 17.331 28.8967C18.062 28.8967 18.6546 29.4936 18.6546 30.23Z"
        stroke={ink}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M22.1763 32.8889L19.3825 27.259L13.7939 24.4444L19.3825 21.6299L22.1763 16L24.9701 21.6299L30.5587 24.4444L24.9701 27.259L22.1763 32.8889ZM16.8904 24.4444L20.4198 26.2305L22.1763 29.786L23.9492 26.2305L27.4787 24.4444L23.9492 22.6749L22.1763 19.1194L20.4198 22.6749L16.8904 24.4444Z"
        fill={ink}
      />
    </svg>
  );
}
