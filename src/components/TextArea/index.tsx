import { TextAreaProps } from "../../types";

export const TextArea = ({ 
  value, 
  onChange, 
  placeholder, 
  className = "",
  ...props 
}: TextAreaProps) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[#0C8BD2] focus:border-transparent transition-all duration-200 resize-none dark:text-white ${className}`}
    rows={4}
    {...props}
  />
);