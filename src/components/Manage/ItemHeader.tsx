import { Trash2 } from "lucide-react";
import { Button } from "@/components/Button";

interface ItemHeaderProps {
  index: number;
  fields: Array<{
    label: string;
    hasValue: boolean;
  }>;
  showValidation: boolean;
  isLast: boolean;
  onDelete?: () => void;
  showDelete?: boolean;
}

export function ItemHeader({
  index,
  fields,
  showValidation,
  isLast,
  onDelete,
  showDelete = true
}: ItemHeaderProps) {
  const allFieldsFilled = fields.every(field => field.hasValue);
  const someFieldsFilled = fields.some(field => field.hasValue);

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          allFieldsFilled 
            ? 'bg-green-500' 
            : someFieldsFilled 
              ? 'bg-yellow-500'
              : 'bg-zinc-300 dark:bg-zinc-700'
        }`}>
          <span className="text-white font-semibold text-sm">
            {index + 1}
          </span>
        </div>
        <div className="text-sm text-zinc-500">
          <div className="font-medium">
            {fields.map((field, i) => (
              <span key={field.label}>
                {field.hasValue ? '✓ ' : ''}{field.label}
                {i < fields.length - 1 ? ' • ' : ''}
              </span>
            ))}
          </div>
          {isLast && showValidation && !allFieldsFilled && (
            <div className="text-red-500 text-xs mt-1">
              ⚠ Complete este item antes de adicionar outro
            </div>
          )}
        </div>
      </div>
      {showDelete && onDelete && (
        <Button
          type="button"
          variant="danger"
          onClick={onDelete}
          className="!p-2"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}