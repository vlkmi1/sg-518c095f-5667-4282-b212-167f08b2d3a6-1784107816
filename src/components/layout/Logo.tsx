export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Fish body - elegant curved shape */}
      <path
        d="M160 100C160 100 150 75 130 65C110 55 90 55 70 60C50 65 35 75 25 90C20 100 20 110 25 120C35 135 50 145 70 150C90 155 110 155 130 145C150 135 160 110 160 100Z"
        fill="currentColor"
        opacity="0.9"
      />
      
      {/* Tail fin - flowing curves */}
      <path
        d="M25 90C25 90 15 85 10 80C5 75 2 70 5 65C8 60 15 60 20 65C25 70 28 75 30 80C32 85 30 90 25 90Z"
        fill="currentColor"
        opacity="0.7"
      />
      <path
        d="M25 120C25 120 15 125 10 130C5 135 2 140 5 145C8 150 15 150 20 145C25 140 28 135 30 130C32 125 30 120 25 120Z"
        fill="currentColor"
        opacity="0.7"
      />
      
      {/* Top fin - sleek dorsal */}
      <path
        d="M90 60C90 60 95 50 100 45C105 40 110 38 115 42C118 45 118 50 115 55C112 60 108 63 105 65C100 68 95 65 90 60Z"
        fill="currentColor"
        opacity="0.6"
      />
      
      {/* Bottom fin - subtle ventral */}
      <path
        d="M80 150C80 150 85 160 90 165C95 170 100 172 105 168C108 165 108 160 105 155C102 150 98 147 95 145C90 142 85 145 80 150Z"
        fill="currentColor"
        opacity="0.6"
      />
      
      {/* Eye - simple circle */}
      <circle cx="130" cy="90" r="6" fill="white" opacity="0.9" />
      <circle cx="130" cy="90" r="3" fill="currentColor" />
      
      {/* Gill detail - subtle lines */}
      <path
        d="M110 85C110 85 105 90 105 95C105 100 110 105 110 105"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.3"
      />
      
      {/* Scale texture - decorative curves */}
      <path
        d="M85 85C90 82 95 82 100 85M85 95C90 92 95 92 100 95M85 105C90 102 95 102 100 105"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.2"
      />
      
      {/* Water ripple effect - circular waves */}
      <circle
        cx="100"
        cy="100"
        r="85"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="8 8"
        opacity="0.15"
      />
      <circle
        cx="100"
        cy="100"
        r="95"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="6 6"
        opacity="0.1"
      />
    </svg>
  );
}