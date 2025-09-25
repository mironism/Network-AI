import { cn } from '../src/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className, size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  }

  return (
    <div className={cn("relative", className)}>
      <svg
        className={cn("text-orange-600", sizeClasses[size])}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer sphere with gradient */}
        <circle 
          cx="16" 
          cy="16" 
          r="14" 
          fill="url(#sphereGradient)" 
          stroke="currentColor" 
          strokeWidth="1"
        />
        
        {/* Inner cutout circle */}
        <circle 
          cx="16" 
          cy="16" 
          r="8" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5"
          opacity="0.3"
        />
        
        {/* Center dot */}
        <circle 
          cx="16" 
          cy="16" 
          r="2" 
          fill="currentColor" 
          opacity="0.6"
        />
        
        {/* Gradient definition */}
        <defs>
          <radialGradient id="sphereGradient" cx="30%" cy="30%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.8"/>
            <stop offset="70%" stopColor="currentColor" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.1"/>
          </radialGradient>
        </defs>
      </svg>
    </div>
  )
}
