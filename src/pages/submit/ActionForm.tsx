import { useState, useRef, ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { Camera, MapPin, Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

interface ActionFormProps {
  actionType: string;
  onSubmit: (data: any) => void;
  onBack: () => void;
}

export default function ActionForm({ actionType, onSubmit, onBack }: ActionFormProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetLocation = () => {
    setLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
          setLoadingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLoadingLocation(false);
          // Fallback or error handling
        }
      );
    } else {
      setLoadingLocation(false);
      // Geolocation not supported
    }
  };

  const handleSubmit = () => {
    if (photo && description && location) {
      onSubmit({
        actionType,
        photo,
        description,
        location,
        timestamp: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={onBack} className="text-enb-text-secondary -ml-2">
          Back
        </Button>
        <h2 className="text-xl font-bold text-enb-text-primary capitalize">{actionType.replace('-', ' ')}</h2>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Photo Upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-enb-text-primary">Photo Proof</label>
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer group transition-all relative overflow-hidden ${photo ? 'border-enb-green bg-enb-green/5' : 'border-gray-300 hover:bg-gray-50 bg-white'}`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          
          {photo ? (
            <div className="relative z-10">
              <img src={photo} alt="Proof" className="max-h-48 mx-auto rounded-lg shadow-sm" />
              <div className="absolute top-2 right-2 bg-white/80 p-1 rounded-full text-enb-green">
                <CheckCircle className="w-5 h-5" />
              </div>
              <p className="text-xs text-enb-green mt-2 font-medium">Photo uploaded successfully</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-enb-green/10 group-hover:text-enb-green transition-colors">
                <Camera className="w-6 h-6 text-gray-400 group-hover:text-enb-green" />
              </div>
              <p className="text-sm text-enb-text-secondary font-medium">Tap to take photo</p>
              <p className="text-xs text-gray-400 mt-1">or upload from gallery</p>
            </>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-enb-text-primary">Location</label>
        <div 
          onClick={!location ? handleGetLocation : undefined}
          className={`flex items-center gap-3 p-3 border rounded-xl transition-colors ${location ? 'bg-enb-green/10 border-enb-green/20 text-enb-green' : 'bg-white border-gray-200 text-gray-500 cursor-pointer hover:bg-gray-50'}`}
        >
          {loadingLocation ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <MapPin className="w-5 h-5" />
          )}
          
          <span className="text-sm font-medium">
            {location ? `Location Verified: ${location}` : loadingLocation ? "Detecting location..." : "Tap to detect location"}
          </span>
          
          {location && <CheckCircle className="w-4 h-4 ml-auto" />}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-enb-text-primary">Description</label>
        <Textarea 
          placeholder="Describe what you did..."
          className="h-32 resize-none bg-white"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Submit Button */}
      <Button 
        onClick={handleSubmit}
        disabled={!photo || !description || !location}
        className="w-full h-12 text-lg shadow-lg shadow-enb-green/20 bg-enb-green hover:bg-enb-green/90 text-white"
      >
        <Upload className="w-5 h-5 mr-2" />
        Review Submission
      </Button>
    </div>
  );
}
