import React from 'react';
import { cn } from '@/lib/utils';

export function EUFlag({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={cn('w-6 h-4', className)} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="36" height="24" rx="2" fill="#039"/>
      <g fill="#FC0">
        <path d="M18 4l.59 1.81h1.9l-1.53 1.12.58 1.8L18 7.63l-1.54 1.11.58-1.81-1.53-1.11h1.9L18 4z"/>
        <path d="M18 20l.59-1.81h1.9l-1.53-1.12.58-1.8L18 16.37l-1.54-1.11.58 1.81-1.53 1.11h1.9L18 20z"/>
        <path d="M10 12l.59 1.81h1.9l-1.53 1.12.58 1.8L10 15.63l-1.54 1.11.58-1.81-1.53-1.11h1.9L10 12z"/>
        <path d="M26 12l.59 1.81h1.9l-1.53 1.12.58 1.8L26 15.63l-1.54 1.11.58-1.81-1.53-1.11h1.9L26 12z"/>
        <path d="M22 7l.59 1.81h1.9l-1.53 1.12.58 1.8L22 10.63l-1.54 1.11.58-1.81-1.53-1.11h1.9L22 7z"/>
        <path d="M14 7l.59 1.81h1.9l-1.53 1.12.58 1.8L14 10.63l-1.54 1.11.58-1.81-1.53-1.11h1.9L14 7z"/>
        <path d="M22 17l.59 1.81h1.9l-1.53 1.12.58 1.8L22 20.63l-1.54 1.11.58-1.81-1.53-1.11h1.9L22 17z"/>
        <path d="M14 17l.59 1.81h1.9l-1.53 1.12.58 1.8L14 20.63l-1.54 1.11.58-1.81-1.53-1.11h1.9L14 17z"/>
      </g>
    </svg>
  );
}

export function USFlag({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={cn('w-6 h-4', className)} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="36" height="24" rx="2" fill="#fff"/>
      <g fill="#bf0a30">
        <rect y="0" width="36" height="1.85" />
        <rect y="3.7" width="36" height="1.85" />
        <rect y="7.4" width="36" height="1.85" />
        <rect y="11.1" width="36" height="1.85" />
        <rect y="14.8" width="36" height="1.85" />
        <rect y="18.5" width="36" height="1.85" />
        <rect y="22.2" width="36" height="1.8" />
      </g>
      <rect width="18" height="12.9" fill="#002868"/>
      <g fill="#fff">
        <path d="M1.5 1.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M4.5 1.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M7.5 1.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M10.5 1.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M13.5 1.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M16.5 1.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M1.5 3.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M4.5 3.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M7.5 3.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M10.5 3.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M13.5 3.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M16.5 3.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M1.5 5.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M4.5 5.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M7.5 5.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M10.5 5.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M13.5 5.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M16.5 5.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M1.5 7.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M4.5 7.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M7.5 7.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M10.5 7.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M13.5 7.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M16.5 7.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M1.5 9.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M4.5 9.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M7.5 9.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M10.5 9.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M13.5 9.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
        <path d="M16.5 9.5l.33.9h1l-.8.6.3.9-.83-.6-.83.6.3-.9-.8-.6h1l.33-.9z"/>
      </g>
    </svg>
  );
}

export function ChinaFlag({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={cn('w-6 h-4', className)} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="36" height="24" rx="2" fill="#DE2910"/>
      <g fill="#FFDE00">
        <path d="M6 4l.9 2.7h2.8l-2.3 1.6.9 2.7L6 9.4 3.7 11l.9-2.7-2.3-1.6h2.8L6 4z"/>
        <path d="M12 3l.3 1h1l-.8.6.3.9-.8-.6-.8.6.3-.9-.8-.6h1l.3-1z"/>
        <path d="M14 5l.3 1h1l-.8.6.3.9-.8-.6-.8.6.3-.9-.8-.6h1l.3-1z"/>
        <path d="M14 8l.3 1h1l-.8.6.3.9-.8-.6-.8.6.3-.9-.8-.6h1l.3-1z"/>
        <path d="M12 10l.3 1h1l-.8.6.3.9-.8-.6-.8.6.3-.9-.8-.6h1l.3-1z"/>
      </g>
    </svg>
  );
}

export function IndiaFlag({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={cn('w-6 h-4', className)} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="36" height="24" rx="2" fill="#fff"/>
      <rect y="0" width="36" height="8" fill="#F93"/>
      <rect y="16" width="36" height="8" fill="#128807"/>
      <circle cx="18" cy="12" r="3" fill="#008"/>
      <circle cx="18" cy="12" r="2.5" fill="#fff"/>
      <circle cx="18" cy="12" r="0.5" fill="#008"/>
      <path d="M18 9.5L18.2 12 18 12.5" stroke="#008" strokeWidth="0.1" />
    </svg>
  );
}

export function RussiaFlag({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={cn('w-6 h-4', className)} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="36" height="24" rx="2" fill="#fff"/>
      <rect y="8" width="36" height="8" fill="#0039A6"/>
      <rect y="16" width="36" height="8" fill="#D52B1E"/>
    </svg>
  );
}

export function BrazilFlag({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={cn('w-6 h-4', className)} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="36" height="24" rx="2" fill="#009c3b"/>
      <path d="M3 12L18 3L33 12L18 21L3 12Z" fill="#ffdf00"/>
      <circle cx="18" cy="12" r="5" fill="#002776"/>
      <path d="M15 13.5C16.9 15 19.1 15 21 13.5" stroke="#fff" strokeWidth="0.5"/>
    </svg>
  );
}

export function IndonesiaFlag({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={cn('w-6 h-4', className)} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="36" height="24" rx="2" fill="#fff"/>
      <rect y="0" width="36" height="12" fill="#ff0000"/>
    </svg>
  );
}

export function VietnamFlag({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={cn('w-6 h-4', className)} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="36" height="24" rx="2" fill="#da251d"/>
      <path d="M18 6l2.4 7.2h7.5l-6.1 4.3L24 24l-6-4.5L12 24l2.1-6.5L8 13.2h7.5L18 6z" fill="#ff0"/>
    </svg>
  );
}

export function ThailandFlag({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={cn('w-6 h-4', className)} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="36" height="24" rx="2" fill="#fff"/>
      <rect y="0" width="36" height="4" fill="#a51931"/>
      <rect y="4" width="36" height="4" fill="#fff"/>
      <rect y="8" width="36" height="8" fill="#2d2a4a"/>
      <rect y="16" width="36" height="4" fill="#fff"/>
      <rect y="20" width="36" height="4" fill="#a51931"/>
    </svg>
  );
}

export function MalaysiaFlag({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={cn('w-6 h-4', className)} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="36" height="24" rx="2" fill="#fff"/>
      <rect y="0" width="36" height="1.8" fill="#cc0001"/>
      <rect y="3.6" width="36" height="1.8" fill="#cc0001"/>
      <rect y="7.2" width="36" height="1.8" fill="#cc0001"/>
      <rect y="10.8" width="36" height="1.8" fill="#cc0001"/>
      <rect y="14.4" width="36" height="1.8" fill="#cc0001"/>
      <rect y="18" width="36" height="1.8" fill="#cc0001"/>
      <rect y="21.6" width="36" height="2.4" fill="#cc0001"/>
      <rect x="0" y="0" width="18" height="13.2" fill="#000066"/>
      <circle cx="9" cy="6.6" r="4" fill="#fc0"/>
      <path d="M7 4.6a3 3 0 0 0 5 2.5 2.5 2.5 0 1 1-5-2.5z" fill="#fc0"/>
    </svg>
  );
}

export function MyanmarFlag({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={cn('w-6 h-4', className)} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="36" height="24" rx="2" fill="#fecb00"/>
      <rect y="8" width="36" height="8" fill="#34b233"/>
      <rect y="16" width="36" height="8" fill="#ea2839"/>
      <path d="M18 6l2.4 7.2h7.5l-6.1 4.3L24 24l-6-4.5L12 24l2.1-6.5L8 13.2h7.5L18 6z" fill="#fff"/>
    </svg>
  );
}

interface CountryFlagGroupProps {
  className?: string;
}

export default function CountryFlagGroup({ className = '' }: CountryFlagGroupProps) {
  return (
    <div className={cn('flex flex-wrap gap-3 items-center', className)}>
      <div className="flex items-center">
        <span className="mr-2 text-sm text-gray-400">支持:</span>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="w-8 h-6 bg-slate-800 rounded flex items-center justify-center">
          <EUFlag className="w-6 h-4" />
        </div>
        <div className="w-8 h-6 bg-slate-800 rounded flex items-center justify-center">
          <USFlag className="w-6 h-4" />
        </div>
        <div className="w-8 h-6 bg-slate-800 rounded flex items-center justify-center">
          <ChinaFlag className="w-6 h-4" />
        </div>
        <div className="w-8 h-6 bg-slate-800 rounded flex items-center justify-center">
          <IndiaFlag className="w-6 h-4" />
        </div>
        <div className="w-8 h-6 bg-slate-800 rounded flex items-center justify-center">
          <RussiaFlag className="w-6 h-4" />
        </div>
        <div className="w-8 h-6 bg-slate-800 rounded flex items-center justify-center">
          <BrazilFlag className="w-6 h-4" />
        </div>
        <div className="w-8 h-6 bg-slate-800 rounded flex items-center justify-center">
          <IndonesiaFlag className="w-6 h-4" />
        </div>
        <div className="w-8 h-6 bg-slate-800 rounded flex items-center justify-center">
          <VietnamFlag className="w-6 h-4" />
        </div>
        <div className="w-8 h-6 bg-slate-800 rounded flex items-center justify-center">
          <ThailandFlag className="w-6 h-4" />
        </div>
        <div className="w-8 h-6 bg-slate-800 rounded flex items-center justify-center">
          <MalaysiaFlag className="w-6 h-4" />
        </div>
        <div className="w-8 h-6 bg-slate-800 rounded flex items-center justify-center">
          <MyanmarFlag className="w-6 h-4" />
        </div>
        <div className="flex items-center">
          <span className="text-xs text-gray-400">更多支持</span>
        </div>
      </div>
    </div>
  );
}