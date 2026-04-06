const sizeClasses = {
  sm: 'w-5 h-5 border-[2.5px]',
  md: 'w-9 h-9 border-[3px]',
  lg: 'w-12 h-12 border-[3.5px]',
};

const Loading = ({ size = 'md', text }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} rounded-full border-primary-100 border-t-primary-600 animate-spin`} />
      {text && <p className="text-sm text-slate-500 font-medium">{text}</p>}
    </div>
  );
};

export default Loading;
