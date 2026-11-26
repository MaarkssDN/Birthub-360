import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Info,
  RefreshCw,
} from 'lucide-react';
import React, { useId } from 'react';
import { useSessionStore } from '../../store/useSessionStore.js';
import { colors, getAccessibleBrandForeground, getAccessibleTextOnBrand } from '../tokens.js';

// Components extracted to sibling modules to keep this catalog under the architecture hotspot
// limit. Re-exported here so existing `design-system/index.js` imports keep working unchanged.
export * from './feedback.js';
export * from './modal.js';
export * from './table.js';
export * from './tabs.js';

// ============================================================================
// 0. ATLAS BRAND MARK
// ============================================================================

export function BirthubLogo({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center ${className}`} aria-hidden="true">
      <img
        src="/brand/birthhub360-symbol.svg"
        className="h-full w-full object-contain"
        alt=""
        width="24"
        height="24"
      />
    </span>
  );
}

// ============================================================================
// 1. BUTTON COMPONENT
// ============================================================================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  style,
  ...props
}: ButtonProps) {
  // `--brand-color` is tenant-controlled (see brandColor.controller.ts / useSessionStore) so
  // `text-white` on the solid `bg-brand` fill can fail WCAG contrast for a light tenant color.
  // getAccessibleTextOnBrand mathematically guarantees >=~4.58:1 regardless of the chosen hue.
  const brandColor = useSessionStore((state: any) => state.brandColor);
  const accessibleBrandText = getAccessibleTextOnBrand(brandColor);

  const baseStyle =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 dark:focus:ring-offset-slate-900';

  const variants = {
    primary: 'bg-brand hover:opacity-95 shadow-sm hover:shadow-md',
    secondary:
      'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600',
    outline:
      'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/60',
    danger:
      'bg-red-600 text-white hover:bg-red-700 shadow-sm dark:bg-red-700 dark:hover:bg-red-800',
    ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80',
    success:
      'bg-green-600 text-white hover:bg-green-700 shadow-sm dark:bg-green-700 dark:hover:bg-green-800',
  };

  const sizes = {
    xs: 'px-2.5 py-1 text-xs',
    sm: 'px-3.5 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      style={variant === 'primary' ? { color: accessibleBrandText, ...style } : style}
      {...props}
    >
      {isLoading ? (
        <RefreshCw aria-hidden="true" className="animate-spin h-4 w-4 mr-2" />
      ) : leftIcon ? (
        <span aria-hidden="true" className="mr-2 flex items-center justify-center">
          {leftIcon}
        </span>
      ) : null}
      {children}
      {!isLoading && rightIcon && (
        <span aria-hidden="true" className="ml-2 flex items-center justify-center">
          {rightIcon}
        </span>
      )}
    </button>
  );
}

// ============================================================================
// 2. INPUT & TEXTAREA COMPONENTS
// ============================================================================

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  placeholder?: string;
  className?: string;
  value?: string | number | readonly string[];
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export function Input({ label, error, helperText, className = '', id, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = !error && helperText ? `${inputId}-helper` : undefined;
  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={!!error || undefined}
        aria-describedby={errorId ?? helperId}
        className={`w-full px-3.5 py-2.5 border rounded-lg text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all shadow-xs dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:focus:ring-brand ${
          error ? 'border-red-350 focus:ring-red-500 dark:border-red-550' : 'border-slate-300'
        } ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-xs text-red-650 dark:text-red-400 font-medium">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={helperId} className="text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
}

export function Textarea({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const errorId = error ? `${textareaId}-error` : undefined;
  const helperId = !error && helperText ? `${textareaId}-helper` : undefined;
  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        aria-invalid={!!error || undefined}
        aria-describedby={errorId ?? helperId}
        className={`w-full p-3.5 border rounded-lg text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all shadow-xs dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:focus:ring-brand ${
          error ? 'border-red-350 focus:ring-red-500 dark:border-red-550' : 'border-slate-300'
        } ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-xs text-red-650 dark:text-red-400 font-medium">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={helperId} className="text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// 3. CHECKBOX & SWITCH
// ============================================================================

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  className?: string;
  checked?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export function Checkbox({ label, className = '', ...props }: CheckboxProps) {
  return (
    <label className={`flex items-start gap-2.5 cursor-pointer select-none text-left ${className}`}>
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 text-brand rounded border-slate-300 focus:ring-brand accent-brand transition-all dark:border-slate-700 dark:bg-slate-800"
        {...props}
      />
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-tight">
        {label}
      </span>
    </label>
  );
}

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
}

export function Switch({ checked, onChange, label, description }: SwitchProps) {
  // A `<div onClick>` (the previous implementation) is mouse/pointer-only: it never receives
  // keyboard focus and Tab/Enter/Space cannot toggle it. Using a real `<button type="button" role="switch">`
  // gets Tab focus and Enter/Space activation for free from native button semantics.
  const reactId = useId();
  const labelId = label ? `${reactId}-label` : undefined;
  const descId = description ? `${reactId}-desc` : undefined;
  return (
    <div className="flex items-start justify-between gap-4 text-left">
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span id={labelId} className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {label}
            </span>
          )}
          {description && (
            <span id={descId} className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {description}
            </span>
          )}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-label={labelId ? undefined : 'Alternar'}
        aria-describedby={descId}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
          checked ? 'bg-brand' : 'bg-slate-200 dark:bg-slate-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-slate-100 shadow-md ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

// ============================================================================
// 4. SELECT COMPONENT
// ============================================================================

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  className?: string;
  value?: string | number | readonly string[];
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
}

export function Select({ label, error, options, className = '', id, ...props }: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = error ? `${selectId}-error` : undefined;
  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={!!error || undefined}
          aria-describedby={errorId}
          className={`w-full px-3.5 py-2.5 pr-10 border rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all shadow-xs appearance-none dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 ${
            error ? 'border-red-300 focus:ring-red-500' : 'border-slate-300'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="absolute right-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none"
        />
      </div>
      {error && (
        <p id={errorId} className="text-xs text-red-650 dark:text-red-400 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// 5. BADGE COMPONENT
// ============================================================================
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'primary', className = '' }: BadgeProps) {
  // `bg-brand-50`/`dark:bg-brand-900/40` are light/dark *tints* of the tenant's brand color, so
  // `text-brand` at full saturation on top of them can fail contrast for a light tenant color the
  // same way `text-white` on a solid `bg-brand` fill can (see tokens.ts). Compute a same-hue,
  // contrast-safe variant for each surface instead of assuming the raw brand color always works.
  const brandColor = useSessionStore((state: any) => state.brandColor);
  const brandTextOnLight = getAccessibleBrandForeground(brandColor, colors.light.surface);
  const brandTextOnDark = getAccessibleBrandForeground(brandColor, colors.dark.surface);

  const styles = {
    primary: 'bg-brand-50 border-brand-100 dark:bg-brand-900/40 dark:border-brand-800/40',
    secondary:
      'bg-slate-100 text-slate-750 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    success:
      'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900/40',
    warning:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40',
    danger:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/40',
    info: 'bg-blue-50 text-brand-ink dark:text-brand border-blue-200 dark:bg-blue-950/40 dark:text-brand-ink dark:text-brand dark:border-blue-900/40',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${styles[variant]} ${
        variant === 'primary' ? 'text-[var(--badge-fg-light)] dark:text-[var(--badge-fg-dark)]' : ''
      } ${className}`}
      style={
        variant === 'primary'
          ? ({
              '--badge-fg-light': brandTextOnLight,
              '--badge-fg-dark': brandTextOnDark,
            } as React.CSSProperties)
          : undefined
      }
    >
      {children}
    </span>
  );
}

// ============================================================================
// 6. CARD COMPONENT
// ============================================================================

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  key?: React.Key;
}

export function Card({ children, className = '', onClick, hoverable = false }: CardProps) {
  // A clickable `<div>` is invisible to keyboard/screen-reader users: no Tab stop, no Enter/Space
  // activation, and no accessible role. Promote to a real interactive element whenever `onClick`
  // is provided (a plain layout card with no `onClick` stays a non-interactive `<div>`).
  const handleKeyDown = onClick
    ? (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }
    : undefined;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: com onClick o Card recebe role=button, tabIndex=0 e Enter/Espaço; sem onClick não há handler de interação.
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm transition-all duration-200 ${
        onClick
          ? 'focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:focus:ring-offset-slate-900'
          : ''
      } ${
        onClick || hoverable
          ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ============================================================================
// 7. SKELETON LOADER
// ============================================================================
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-md ${className}`} />;
}

// ============================================================================
// 8. EMPTY STATE COMPONENT
// ============================================================================
interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-250 dark:border-slate-700 rounded-xl max-w-lg mx-auto">
      {icon && (
        <div className="p-4 bg-white dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm mb-4 text-slate-400 dark:text-slate-500">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-xs mx-auto">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// ============================================================================
// 9. ALERT COMPONENT
// ============================================================================
interface AlertProps {
  title: string;
  description?: string;
  variant?: 'success' | 'warning' | 'danger' | 'info';
}

export function Alert({ title, description, variant = 'info' }: AlertProps) {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
    danger: <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
    info: (
      <Info className="h-5 w-5 text-brand-ink dark:text-brand dark:text-brand-ink dark:text-brand" />
    ),
  };

  const styles = {
    success:
      'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-300',
    warning:
      'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-300',
    danger:
      'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-300',
    info: 'bg-blue-50 border-blue-200 text-brand-ink dark:text-brand dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-brand-ink dark:text-brand',
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 border rounded-xl shadow-none leading-relaxed ${styles[variant]}`}
    >
      <div className="shrink-0 mt-0.5">{icons[variant]}</div>
      <div className="flex-1 space-y-1">
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h4>
        {description && <p className="text-xs text-slate-700 dark:text-slate-300">{description}</p>}
      </div>
    </div>
  );
}

// ============================================================================
// 10. SPINNER (LOADING)
// ============================================================================
export function Spinner({
  className = '',
  size = 'md',
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };
  return (
    <div
      className={`animate-spin rounded-full border-slate-200 border-t-brand dark:border-slate-700 dark:border-t-brand ${sizes[size]} ${className}`}
    />
  );
}

// ============================================================================
// 11. PROGRESS BAR
// ============================================================================
export function Progress({ value, className = '' }: { value: number; className?: string }) {
  const clampedValue = Math.min(100, Math.max(0, value));
  return (
    <div
      className={`w-full bg-slate-100 dark:bg-slate-750 rounded-full h-2.5 overflow-hidden ${className}`}
    >
      <div
        className="bg-brand h-2.5 rounded-full transition-all duration-350 ease-out"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}

// ============================================================================
// 12. AVATAR COMPONENT
// ============================================================================
export function Avatar({
  name,
  src,
  size = 'md',
  className = '',
}: {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const brandColor = useSessionStore((state: any) => state.brandColor);
  const accessibleBrandText = getAccessibleTextOnBrand(brandColor);
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-16 w-16 text-lg',
  };
  const sizeToPixels = {
    sm: 32,
    md: 44,
    lg: 64,
  };

  const getInitials = (n: string) => {
    return n
      .trim()
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 rounded-full overflow-hidden bg-brand font-bold select-none shadow-none ${sizes[size]} ${className}`}
      style={{ color: accessibleBrandText }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          width={sizeToPixels[size]}
          height={sizeToPixels[size]}
        />
      ) : (
        <span>{getInitials(name || 'User')}</span>
      )}
    </div>
  );
}

export const AtlasLogo = BirthubLogo;
