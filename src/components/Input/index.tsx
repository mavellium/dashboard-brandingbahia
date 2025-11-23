import { InputProps } from "../../types";

export const Input = ({ 
  value, 
  onChange, 
  placeholder, 
  className = "",
  ...props 
}: InputProps) => (
  <input
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[#0C8BD2] focus:border-transparent transition-all duration-200 dark:text-white ${className}`}
    {...props}
  />
);