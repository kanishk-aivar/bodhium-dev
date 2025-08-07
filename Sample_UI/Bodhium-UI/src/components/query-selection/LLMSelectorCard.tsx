import { Checkbox } from '@/components/ui/checkbox';

interface LLMModel {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
}

interface LLMSelectorCardProps {
  model: LLMModel;
  onToggle: (id: string) => void;
}

export const LLMSelectorCard = ({ model, onToggle }: LLMSelectorCardProps) => {
  return (
    <div
      className={`group p-4 rounded-lg border cursor-pointer transition-all duration-300 hover:shadow-primary ${
        model.selected 
          ? 'border-primary bg-gradient-glow shadow-glow' 
          : 'border-accent/20 hover:border-primary/40 hover:bg-accent/20'
      }`}
      onClick={() => onToggle(model.id)}
    >
      <div className="flex items-start gap-3">
        <Checkbox 
          checked={model.selected}
          className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className={`${model.selected ? 'text-primary' : 'text-muted-foreground'} transition-colors`}>
              {model.icon}
            </div>
            <span className={`font-medium text-sm truncate ${
              model.selected ? 'text-primary' : 'text-foreground'
            } transition-colors`}>
              {model.name}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {model.description}
          </p>
        </div>
      </div>
      
      {model.selected && (
        <div className="mt-3 pt-3 border-t border-primary/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-xs text-success font-medium">Selected</span>
          </div>
        </div>
      )}
    </div>
  );
};