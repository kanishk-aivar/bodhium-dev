import { Checkbox } from '@/components/ui/checkbox';

interface QueryCardProps {
  id: string;
  text: string;
  selected: boolean;
  onToggle: (id: string) => void;
  type: 'product' | 'market';
}

export const QueryCard = ({ id, text, selected, onToggle, type }: QueryCardProps) => {
  return (
    <div 
      className={`group flex items-start space-x-3 p-3 rounded-lg transition-all duration-200 hover:bg-accent/30 ${
        selected ? 'bg-gradient-glow border border-primary/20' : 'hover:shadow-sm'
      }`}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={() => onToggle(id)}
        className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <label 
        className="text-sm cursor-pointer flex-1 transition-colors group-hover:text-primary"
        onClick={() => onToggle(id)}
      >
        {text}
      </label>
      <div className={`w-2 h-2 rounded-full ${type === 'product' ? 'bg-primary' : 'bg-accent'} opacity-60`} />
    </div>
  );
};