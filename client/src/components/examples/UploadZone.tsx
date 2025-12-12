import UploadZone from '../UploadZone';

export default function UploadZoneExample() {
  return (
    <div className="p-8 bg-background min-h-screen">
      <UploadZone onImagesChange={(files) => console.log('Images changed:', files.length)} />
    </div>
  );
}
