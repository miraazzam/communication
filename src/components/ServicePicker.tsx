import React from 'react';
import { ServiceOption } from '../types';
import { Sparkles, Briefcase, Zap, Compass } from 'lucide-react';

interface ServicePickerProps {
  services: ServiceOption[];
  selectedServiceId: string;
  onSelectService: (service: ServiceOption) => void;
  currency: string;
}

export const DEFAULT_SERVICES: ServiceOption[] = [
  {
    id: 'consultation',
    name: '1-on-1 Consultation',
    description: 'Direct deep-dive consultation, strategy guidance, and project discovery.',
    ratePerHour: 85,
    popular: true,
  },
  {
    id: 'strategy-review',
    name: 'Executive Review & Audit',
    description: 'In-depth assessment of materials, architecture, and actionable roadmaps.',
    ratePerHour: 125,
  },
  {
    id: 'creative-session',
    name: 'Studio & Hands-on Work',
    description: 'Real-time collaborative production, execution, and guided work session.',
    ratePerHour: 150,
  },
  {
    id: 'quick-advisory',
    name: 'Targeted Advisory',
    description: 'Rapid problem resolution, specific Q&A, and quick decision support.',
    ratePerHour: 60,
  },
];

export const ServicePicker: React.FC<ServicePickerProps> = ({
  services,
  selectedServiceId,
  onSelectService,
  currency,
}) => {
  const getIcon = (id: string) => {
    switch (id) {
      case 'consultation':
        return <Briefcase className="w-5 h-5 text-slate-800" />;
      case 'strategy-review':
        return <Compass className="w-5 h-5 text-slate-800" />;
      case 'creative-session':
        return <Sparkles className="w-5 h-5 text-slate-800" />;
      default:
        return <Zap className="w-5 h-5 text-slate-800" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {services.map((svc) => {
          const isSelected = selectedServiceId === svc.id;
          return (
            <div
              key={svc.id}
              onClick={() => onSelectService(svc)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectService(svc);
                }
              }}
              className={`p-4 rounded-xl border transition-all text-left relative flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900 ring-offset-2'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}>
                    {getIcon(svc.id)}
                  </div>
                  <div className="text-right">
                    <span className="text-base sm:text-lg font-bold">
                      {currency}{svc.ratePerHour}
                    </span>
                    <span className={`text-xs block ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                      / hour
                    </span>
                  </div>
                </div>

                <div className="font-semibold text-sm sm:text-base leading-tight mb-1">
                  {svc.name}
                </div>
                <p className={`text-xs leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                  {svc.description}
                </p>
              </div>

              {svc.popular && (
                <div className="mt-3 pt-2 border-t border-dashed border-slate-700/30 flex items-center gap-1.5 text-xs">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-emerald-500'}`} />
                  <span className={isSelected ? 'text-emerald-300 font-medium' : 'text-emerald-700 font-medium'}>
                    Most Booked
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
