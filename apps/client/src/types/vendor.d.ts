declare module 'lucide-react' {
  export type LucideProps = import('react').SVGProps<SVGSVGElement> & {
    size?: number | string;
    absoluteStrokeWidth?: boolean;
  };
  export type LucideIcon = import('react').ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & import('react').RefAttributes<SVGSVGElement>
  >;

  export const AlertTriangle: LucideIcon;
  export const ArrowDown: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const ArrowUp: LucideIcon;
  export const Briefcase: LucideIcon;
  export const Calendar: LucideIcon;
  export const CalendarDays: LucideIcon;
  export const Check: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const Circle: LucideIcon;
  export const CircleHelp: LucideIcon;
  export const Clock: LucideIcon;
  export const CreditCard: LucideIcon;
  export const Download: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const Facebook: LucideIcon;
  export const FileText: LucideIcon;
  export const Filter: LucideIcon;
  export const Globe: LucideIcon;
  export const GripVertical: LucideIcon;
  export const Heart: LucideIcon;
  export const Image: LucideIcon;
  export const Info: LucideIcon;
  export const Instagram: LucideIcon;
  export const KeyRound: LucideIcon;
  export const Loader2: LucideIcon;
  export const LogIn: LucideIcon;
  export const LogOut: LucideIcon;
  export const Mail: LucideIcon;
  export const MapPin: LucideIcon;
  export const MapPinned: LucideIcon;
  export const Menu: LucideIcon;
  export const MessageCircle: LucideIcon;
  export const Minus: LucideIcon;
  export const Music: LucideIcon;
  export const PanelLeftClose: LucideIcon;
  export const PanelLeftOpen: LucideIcon;
  export const Package: LucideIcon;
  export const Pencil: LucideIcon;
  export const Phone: LucideIcon;
  export const Play: LucideIcon;
  export const Plus: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const RotateCw: LucideIcon;
  export const Save: LucideIcon;
  export const Search: LucideIcon;
  export const ShieldAlert: LucideIcon;
  export const ShoppingBag: LucideIcon;
  export const ShoppingCart: LucideIcon;
  export const Store: LucideIcon;
  export const Trash2: LucideIcon;
  export const ToggleLeft: LucideIcon;
  export const ToggleRight: LucideIcon;
  export const Upload: LucideIcon;
  export const User: LucideIcon;
  export const Users: LucideIcon;
  export const UsersRound: LucideIcon;
  export const UtensilsCrossed: LucideIcon;
  export const X: LucideIcon;
  export const XCircle: LucideIcon;
}

declare module 'date-fns' {
  export type DateArg = Date | number | string;
  export function addDays(date: DateArg, amount: number): Date;
  export function addMinutes(date: DateArg, amount: number): Date;
  export function format(date: DateArg, formatStr: string, options?: unknown): string;
  export function getDay(date: DateArg): number;
  export function isTuesday(date: DateArg): boolean;
  export function parseISO(argument: string): Date;
  export function setHours(date: DateArg, hours: number): Date;
  export function setMinutes(date: DateArg, minutes: number): Date;
}

declare module 'date-fns/locale' {
  export const es: unknown;
}
