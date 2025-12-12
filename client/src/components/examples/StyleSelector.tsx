import StyleSelector from '../StyleSelector';

export default function StyleSelectorExample() {
  return (
    <div className="p-8 bg-background">
      <StyleSelector onStyleChange={(style) => console.log('Style selected:', style)} />
    </div>
  );
}
