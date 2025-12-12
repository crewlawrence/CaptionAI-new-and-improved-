import ContextInput from '../ContextInput';

export default function ContextInputExample() {
  return (
    <div className="p-8 bg-background max-w-2xl">
      <ContextInput onContextChange={(context) => console.log('Context:', context)} />
    </div>
  );
}
