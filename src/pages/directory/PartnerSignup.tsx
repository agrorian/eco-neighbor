import { useState } from 'react';
import React from 'react';
import { motion } from 'motion/react';
import { Store, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function PartnerSignup() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    category: 'Food',
    address: '',
    floatAmount: '',
    discountDescription: '',
    termsAccepted: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, termsAccepted: e.target.checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 2000);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 space-y-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className="w-24 h-24 bg-enb-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-enb-green" />
          </div>
        </motion.div>
        <h1 className="text-3xl font-bold text-enb-text-primary mb-2">Application Received!</h1>
        <p className="text-enb-text-secondary max-w-xs mx-auto">
          Thank you for applying to become an ENB Partner. We will review your application and get back to you within 48 hours.
        </p>
        <Link to="/">
          <Button className="mt-8 bg-enb-green hover:bg-enb-green/90 text-white">
            Return to Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-lg mx-auto pb-24">
      <header className="mb-6 flex items-center gap-4">
        <Link to="/more">
          <Button variant="ghost" size="icon" className="-ml-2">
            <ArrowLeft className="w-5 h-5 text-enb-text-secondary" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-enb-text-primary">Partner Signup</h1>
          <p className="text-sm text-enb-text-secondary">Join the Eco-Neighbor network</p>
        </div>
      </header>

      <Card className="border-gray-100 shadow-sm">
        <CardContent className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-enb-text-primary">Business Name</label>
              <Input
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="e.g. Green Leaf Cafe"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-enb-text-primary">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-enb-green/50 focus:border-enb-green outline-none text-sm"
              >
                <option value="Food">Food & Drink</option>
                <option value="Trades">Trades & Services</option>
                <option value="Health">Health & Wellness</option>
                <option value="Retail">Retail</option>
                <option value="Education">Education</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-enb-text-primary">Address</label>
              <Input
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Business Address"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-enb-text-primary">Monthly ENB Float</label>
              <div className="relative">
                <Input
                  type="number"
                  name="floatAmount"
                  value={formData.floatAmount}
                  onChange={handleChange}
                  placeholder="e.g. 500"
                  required
                  className="pl-10"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-enb-text-secondary">
                  ENB
                </div>
              </div>
              <p className="text-xs text-gray-400">How much ENB are you willing to accept per month?</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-enb-text-primary">Discount Offer</label>
              <Textarea
                name="discountDescription"
                value={formData.discountDescription}
                onChange={handleChange}
                placeholder="Describe your offer (e.g. 10% off for ENB payments)"
                required
                className="h-24 resize-none"
              />
            </div>

            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                id="terms"
                checked={formData.termsAccepted}
                onChange={handleCheckboxChange}
                className="mt-1 w-4 h-4 text-enb-green border-gray-300 rounded focus:ring-enb-green"
                required
              />
              <label htmlFor="terms" className="text-sm text-enb-text-secondary">
                I agree to the <Link to="/terms" className="text-enb-green hover:underline">Partner Terms & Conditions</Link> and understand that my application is subject to approval.
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading || !formData.termsAccepted}
              className="w-full h-12 text-lg bg-enb-green hover:bg-enb-green/90 text-white shadow-lg shadow-enb-green/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Store className="w-5 h-5 mr-2" />}
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-center">
        <Link to="/faq" className="text-sm text-enb-text-secondary hover:text-enb-green hover:underline">
          What is an ENB Partner?
        </Link>
      </div>
    </div>
  );
}
