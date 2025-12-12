import CaptionResults from '../CaptionResults';

export default function CaptionResultsExample() {
  const mockCaptions = [
    {
      id: '1',
      text: 'Professional excellence meets modern innovation. Driving success through strategic solutions.',
    },
    {
      id: '2',
      text: 'Making every moment count with the people who matter most. Life is better together!',
    },
    {
      id: '3',
      text: 'When life gives you lemons, make a viral TikTok about it. 🍋',
    },
  ];

  return (
    <div className="p-8 bg-background">
      <CaptionResults captions={mockCaptions} />
    </div>
  );
}
