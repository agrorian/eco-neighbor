import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface SubmissionReviewProps {
  data: any;
  onConfirm: () => void;
  onEdit: () => void;
  submitting?: boolean;
}

export default function SubmissionReview({ data, onConfirm, onEdit, submitting }: SubmissionReviewProps) {
  // Support both single photo and multiple photos
  const allPhotos: string[] = data.photoUrls?.length > 0
    ? data.photoUrls
    : data.photo ? [data.photo] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={onEdit} className="text-enb-text-secondary -ml-2">
          Back
        </Button>
        <h2 className="text-xl font-bold text-enb-text-primary">Review</h2>
        <div className="w-10" />
      </div>

      <Card className="bg-white border-gray-100 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-enb-green/10 flex items-center justify-center text-enb-green">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-enb-text-primary capitalize">{data.actionType.replace('-', ' ')}</h3>
              <p className="text-xs text-enb-text-secondary">{new Date(data.timestamp).toLocaleString()}</p>
            </div>
          </div>

          {/* Photo proof — single or grid */}
          {allPhotos.length === 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-enb-text-primary">Photo Proof</label>
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img src={allPhotos[0]} alt="Proof" className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          {allPhotos.length > 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-enb-text-primary">
                Photo Proof ({allPhotos.length} photos)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {allPhotos.map((url, i) => (
                  <div key={i} className={`bg-gray-100 rounded-lg overflow-hidden ${allPhotos.length === 3 && i === 2 ? 'col-span-2' : ''}`}>
                    <img
                      src={url}
                      alt={`Proof ${i + 1}`}
                      className="w-full h-36 object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-enb-text-primary">Location</label>
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-enb-text-secondary font-mono">
              {data.gpsAddress || data.location || `${data.gpsLat}, ${data.gpsLng}`}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-enb-text-primary">Description</label>
            <p className="text-sm text-enb-text-secondary bg-gray-50 p-3 rounded-lg">
              {data.description}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button variant="outline" onClick={onEdit} className="flex-1">
          Edit
        </Button>
        <Button
          onClick={onConfirm}
          disabled={submitting}
          className="flex-1 bg-enb-green hover:bg-enb-green/90 text-white shadow-lg shadow-enb-green/20"
        >
          {submitting ? 'Submitting...' : 'Confirm & Submit'}
        </Button>
      </div>
    </div>
  );
}
