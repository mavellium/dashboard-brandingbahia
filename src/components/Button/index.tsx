import { Loader2 } from "lucide-react";
import { ButtonProps } from "../../types";

export const Button = ({ 
  children, 
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
  ...props 
}: ButtonProps) => {
  const baseStyles = "px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[#0C8BD2] hover:bg-[#0A7ABD] text-white shadow-lg hover:shadow-xl",
    secondary: "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white",
    danger: "bg-red-500 hover:bg-red-600 text-white"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
};