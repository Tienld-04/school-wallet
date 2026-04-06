const variantClasses = {
  primary:
    'bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-md shadow-primary-600/30 hover:from-primary-500 hover:to-primary-600 hover:shadow-lg hover:shadow-primary-600/40 hover:-translate-y-0.5 active:translate-y-0',
  secondary:
    'bg-primary-50 text-primary-700 border-[1.5px] border-primary-200 hover:bg-primary-100 hover:border-primary-300',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-800',
};

const sizeClasses = {
  sm: 'px-4 py-2 text-[0.8125rem]',
  md: 'px-6 py-3 text-[0.9375rem]',
  lg: 'px-7 py-3.5 text-base',
};

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  onClick,
  className = '',
  ...props
}) => {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 font-semibold rounded-[10px] cursor-pointer transition-all duration-200 tracking-[0.01em] disabled:opacity-55 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className={`w-5 h-5 border-[2.5px] rounded-full animate-spin ${variant === 'primary' ? 'border-white/30 border-t-white' : 'border-primary-600/20 border-t-primary-600'}`} />
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
