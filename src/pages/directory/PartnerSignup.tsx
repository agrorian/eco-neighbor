import { useState } from 'react';
import { motion } from 'motion/react';
import { Store, ArrowLeft, CheckCircle, Loader2, Phone, MapPin, MessageSquare, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { BUSINESS_CATEGORIES, BUSINESS_TYPE_EMOJI } from '@/lib/constants';

export default function PartnerSignup() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!businessName.trim() || !category || !ownerName.trim() || !whatsapp.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setError('');

    const { error: dbError } = await supabase.from('partner_applications').insert({
      business_name: businessName.trim(),
      category,
      owner_name: ownerName.trim(),
      whatsapp: whatsapp.trim(),
      address: address.trim() || null,
      message: message.trim() || null,
      source: 'app',
      status: 'pending',
    });

    if (dbError) {
      setError('Submission failed. Please try again.');
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 space-y-4 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
          <div className="w-24 h-24 bg-enb-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-enb-green" />
          </div>
        </motion.div>
        <h1 className="text-2xl font-bold text-enb-text-primary">Application Received!</h1>
        <p className="text-enb-text-secondary max-w-xs mx-auto text-sm">
          Thank you for applying to join the ENB Partner network. Our onboarding team will contact you on WhatsApp within 48 hours.
        </p>
        <div className="bg-enb-green/5 border border-enb-green/20 rounded-xl p-4 max-w-xs text-sm text-enb-text-secondary">
          <p className="font-medium text-enb-green mb-1">What happens next?</p>
          <p>1. Our team contacts you on WhatsApp</p>
          <p>2. We discuss your ENB discount offering</p>
          <p>3. You sign a simple MOU</p>
          <p>4. Your business goes live on the ENB directory</p>
        </div>
        <Link to="/"><Button className="mt-4 bg-enb-green text-white">Back to Home</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 max-w-lg mx-auto pb-24">
      <header className="flex items-center gap-3">
        <Link to="/more">
          <Button variant="ghost" size="icon" className="-ml-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-enb-text-primary">Become an ENB Partner</h1>
          <p className="text-sm text-enb-text-secondary">Join the local circular economy</p>
        </div>
      </header>

      {/* Benefits banner */}
      <div className="bg-enb-green rounded-2xl p-4 text-white">
        <p className="font-bold text-sm mb-2">Why join as an ENB Partner?</p>
        <div className="space-y-1 text-sm text-white/90">
          <p>✅ New customers from the ENB community</p>
          <p>✅ Free listing in the ENB business directory</p>
          <p>✅ ENB float provided — no upfront cost</p>
          <p>✅ Zero food waste via surplus sharing programme</p>
        </div>
      </div>

      <Card className="border-gray-100 shadow-sm">
        <CardContent className="p-5 space-y-4">

          {/* Business name */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-enb-text-primary flex items-center gap-1">
              <Store className="w-4 h-4 text-enb-green" /> Business Name <span className="text-red-400">*</span>
            </label>
            <Input placeholder="e.g. Ahmed General Store" value={businessName} onChange={e => setBusinessName(e.target.value)} />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-enb-text-primary">Business Type <span className="text-red-400">*</span></label>
            <div className="relative">
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-enb-green/50 focus:border-enb-green outline-none text-sm appearance-none pr-10"
              >
                <option value="">Select business type...</option>
                {BUSINESS_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {BUSINESS_TYPE_EMOJI[cat] || '🏬'} {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Owner name */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-enb-text-primary">Your Name <span className="text-red-400">*</span></label>
            <Input placeholder="Owner / Manager name" value={ownerName} onChange={e => setOwnerName(e.target.value)} />
          </div>

          {/* WhatsApp */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-enb-text-primary flex items-center gap-1">
              <Phone className="w-4 h-4 text-green-500" /> WhatsApp Number <span className="text-red-400">*</span>
            </label>
            <Input type="tel" placeholder="+92 300 1234567" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
            <p className="text-xs text-gray-400">Our team will contact you on this number</p>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-enb-text-primary flex items-center gap-1">
              <MapPin className="w-4 h-4 text-enb-teal" /> Address / Location
            </label>
            <Input placeholder="Street, Area, Neighbourhood" value={address} onChange={e => setAddress(e.target.value)} />
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-enb-text-primary flex items-center gap-1">
              <MessageSquare className="w-4 h-4 text-gray-400" /> Why do you want to join? <span className="text-gray-400 font-normal text-xs">(Optional)</span>
            </label>
            <Textarea
              placeholder="Tell us about your business and why you'd like to be part of the ENB community..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="resize-none h-24"
              maxLength={500}
            />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

          <Button
            onClick={handleSubmit}
            disabled={loading || !businessName.trim() || !category || !ownerName.trim() || !whatsapp.trim()}
            className="w-full h-12 text-base bg-enb-green hover:bg-enb-green/90 text-white shadow-lg shadow-enb-green/20"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Submitting...</> : <><Store className="w-5 h-5 mr-2" />Submit Application</>}
          </Button>

          <p className="text-xs text-gray-400 text-center">
            Discount details and MOU will be discussed by our onboarding team.
            No commitment required at this stage.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
