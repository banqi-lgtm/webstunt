import { CheckCircle2, Clock, XCircle } from 'lucide-react';

export type CodeStatus = 'pendiente' | 'aprobado' | 'rechazado';

interface StatusChipProps {
  status?: CodeStatus;
}

export function StatusChip({ status = 'pendiente' }: StatusChipProps) {
  const config = {
    pendiente: {
      bg: 'bg-[#D97706]/10',
      text: 'text-[#D97706]',
      border: 'border-[#D97706]/20',
      icon: <Clock className="w-3.5 h-3.5" />,
      label: 'PENDIENTE'
    },
    aprobado: {
      bg: 'bg-[#16A34A]/10',
      text: 'text-[#16A34A]',
      border: 'border-[#16A34A]/20',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      label: 'APROBADO'
    },
    rechazado: {
      bg: 'bg-[#DC2626]/10',
      text: 'text-[#DC2626]',
      border: 'border-[#DC2626]/20',
      icon: <XCircle className="w-3.5 h-3.5" />,
      label: 'RECHAZADO'
    }
  };

  const currentConfig = config[status] || config.pendiente;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${currentConfig.bg} ${currentConfig.text} ${currentConfig.border}`}>
      {currentConfig.icon}
      <span className="text-[10px] font-bold tracking-wider">{currentConfig.label}</span>
    </div>
  );
}
