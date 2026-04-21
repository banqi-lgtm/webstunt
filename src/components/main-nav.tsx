'use client';

import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, UserPlus, QrCode, Send } from 'lucide-react';

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/register', label: 'Register', icon: UserPlus },
  { href: '/scan', label: 'Scan & Validate', icon: QrCode },
  { href: '/communicate', label: 'Communicate', icon: Send },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Logo className="w-8 h-8 text-primary" />
          <div className="flex flex-col">
            <h2 className="font-semibold text-lg tracking-tight">Circuito Control</h2>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {links.map((link) => (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === link.href}
                tooltip={link.label}
              >
                <Link href={link.href}>
                  <link.icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
