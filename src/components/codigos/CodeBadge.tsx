import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBadgeProps {
  code: string;
}

export function CodeBadge({ code }: CodeBadgeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="group relative inline-flex items-center gap-2 px-3 py-1.5 bg-[#12121A] border border-[#1C1C28] rounded-md hover:border-[#6366F1]/50 hover:bg-[#12121A]/80 transition-all cursor-pointer"
      onClick={handleCopy}
    >
      <span className="font-mono text-sm text-[#F5F5F7] tracking-wider">
        {code}
      </span>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-[#6366F1]">
        {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
      </div>
    </div>
  );
}
