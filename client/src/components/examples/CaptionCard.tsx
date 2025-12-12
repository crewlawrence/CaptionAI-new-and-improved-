import CaptionCard from '../CaptionCard';

export default function CaptionCardExample() {
  return (
    <div className="p-8 bg-background">
      <div className="max-w-sm">
        <CaptionCard 
          caption="Embrace the journey, not just the destination. Every step forward is a victory worth celebrating. ✨"
          onRegenerate={() => console.log('Regenerate clicked')}
        />
      </div>
    </div>
  );
}
