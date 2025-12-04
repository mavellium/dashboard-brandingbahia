export interface FAQ {
  question: string;
  answer: string;
}

export interface Service {
  id?: string;
  title: string;
  description: string;
  image: string;
  file?: File | null;
}

export interface FormDataType {
  id: string;
  type: string;
  values: Service[];
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}