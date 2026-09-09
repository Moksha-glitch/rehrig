import React, { useId } from 'react';

/** Vision AI mark: cyan star on a magenta-to-blue orb. */
export default function VisionAiMark({ size = 20, className = '' }) {
  const gradientId = useId().replace(/:/g, '');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M5.61279 15.8999C10.0818 15.8999 14.7795 12.1758 14.7795 7.96907C14.7795 3.76233 10.0818 0.355469 5.61279 0.355469C1.14382 0.355469 0.220703 3.76233 0.220703 7.96907C0.220703 12.1758 1.14382 15.8999 5.61279 15.8999Z"
        fill={`url(#${gradientId})`}
        fillOpacity="0.2"
      />
      <ellipse cx="4.41609" cy="11.1156" rx="0.330882" ry="0.333333" fill="white" />
      <path
        d="M4.4156 11.782C4.78111 11.782 5.07742 11.4835 5.07742 11.1154C5.07742 10.7472 4.78111 10.4487 4.4156 10.4487C4.05009 10.4487 3.75378 10.7472 3.75378 11.1154C3.75378 11.4835 4.05009 11.782 4.4156 11.782Z"
        stroke="#5DB7E7"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M5.9602 9.11561L4.1955 8.2226L5.9602 7.33784L6.83843 5.56006L7.72491 7.33784L9.48961 8.2226L7.72491 9.11561L6.83843 10.8934L5.9602 9.11561Z"
        fill="white"
      />
      <path
        d="M10.1564 5.11475L10.2297 5.26221L10.3752 5.33447L11.2629 5.77881L10.3771 6.22705L10.2297 6.30127L10.1564 6.44971L9.70721 7.35107L9.26093 6.44775L9.18866 6.30029L9.04315 6.22705L8.15741 5.77881L9.0451 5.33447L9.18866 5.26318L9.26093 5.11572L9.70721 4.2124L10.1564 5.11475Z"
        fill="white"
        stroke="#5DB7E7"
      />
      <path
        d="M6.83815 12.4444L5.44123 9.62948L2.64697 8.22222L5.44123 6.81496L6.83815 4L8.23506 6.81496L11.0293 8.22222L8.23506 9.62948L6.83815 12.4444ZM4.19521 8.22222L5.95992 9.11523L6.83815 10.893L7.72462 9.11523L9.48933 8.22222L7.72462 7.33746L6.83815 5.55968L5.95992 7.33746L4.19521 8.22222Z"
        fill="#5DB7E7"
      />
      <defs>
        <linearGradient
          id={gradientId}
          x1="7.50011"
          y1="0.355469"
          x2="7.50011"
          y2="15.8999"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#BB00BB" />
          <stop offset="1" stopColor="#2B81FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}
