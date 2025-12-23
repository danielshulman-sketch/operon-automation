export default function Logo({ size = 32, className = '' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Envelope shape */}
            <path
                d="M15 30 L50 55 L85 30 L85 70 L15 70 Z"
                fill="url(#gradient1)"
                stroke="currentColor"
                strokeWidth="2"
            />
            <path
                d="M15 30 L50 55 L85 30"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Automation gears */}
            <circle cx="75" cy="25" r="8" fill="url(#gradient2)" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="75" cy="25" r="4" fill="white" />

            <circle cx="25" cy="75" r="6" fill="url(#gradient2)" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="25" cy="75" r="3" fill="white" />

            {/* Gradient definitions */}
            <defs>
                <linearGradient id="gradient1" x1="15" y1="30" x2="85" y2="70" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
                <linearGradient id="gradient2" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
            </defs>
        </svg>
    );
}
