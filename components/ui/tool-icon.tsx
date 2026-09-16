import {
  AlignLeft,
  ArrowLeftRight,
  ArrowRightLeft,
  Braces,
  Cake,
  Calculator,
  CalendarDays,
  CaseSensitive,
  Combine,
  Crop,
  FileArchive,
  FileImage,
  FilePlus2,
  FileSpreadsheet,
  FileText,
  FileUp,
  Fingerprint,
  Flame,
  House,
  Image as ImageIcon,
  ImageDown,
  Images,
  KeyRound,
  Landmark,
  Percent,
  QrCode,
  Receipt,
  ReceiptText,
  Scale,
  Scaling,
  Split,
  TrendingUp,
  Type,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

/**
 * Icons are imported individually rather than resolved dynamically, so the
 * bundler only ships the ones the registry actually references.
 */
const iconMap: Record<string, LucideIcon> = {
  AlignLeft,
  ArrowLeftRight,
  ArrowRightLeft,
  Braces,
  Cake,
  Calculator,
  CalendarDays,
  CaseSensitive,
  Combine,
  Crop,
  FileArchive,
  FileImage,
  FilePlus2,
  FileSpreadsheet,
  FileText,
  FileUp,
  Fingerprint,
  Flame,
  Home: House,
  Image: ImageIcon,
  ImageDown,
  Images,
  KeyRound,
  Landmark,
  Percent,
  QrCode,
  Receipt,
  ReceiptText,
  Scale,
  Scaling,
  Split,
  TrendingUp,
  Type,
  Wallet,
};

type ToolIconProps = {
  name: string;
  className?: string;
};

/**
 * Icons here are decorative — every one sits beside a visible text label — so
 * they are hidden from assistive technology.
 */
export function ToolIcon({ name, className }: ToolIconProps) {
  const Icon = iconMap[name] ?? Wrench;
  return <Icon className={className} aria-hidden="true" focusable="false" />;
}

export function hasIcon(name: string): boolean {
  return name in iconMap;
}
