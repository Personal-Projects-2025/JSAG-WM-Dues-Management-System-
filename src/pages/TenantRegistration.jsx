import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api.js';

const TenantRegistration = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    databaseName: '',
    adminUsername: '',
    adminPassword: '',
    adminEmail: '',
    contactEmail: '',
    contactPhone: '',
    branding: {
      name: '',
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF'
    }
  });
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('branding.')) {
      const brandingKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        branding: {
          ...prev.branding,
          [brandingKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
      databaseName: prev.databaseName || generateSlug(name).replace(/-/g, '_'),
      branding: {
        ...prev.branding,
        name: prev.branding.name || name
      }
    }));
  };

  const validateStep1 = () => {
    if (!formData.name || !formData.slug || !formData.databaseName) {
      toast.error('Please fill in all required fields');
      return false;
    }
    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      toast.error('Slug can only contain lowercase letters, numbers, and hyphens');
      return false;
    }
    if (!/^[a-z0-9_-]+$/.test(formData.databaseName)) {
      toast.error('Database name can only contain lowercase letters, numbers, underscores, and hyphens');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.adminUsername || !formData.adminPassword || !formData.adminEmail) {
      toast.error('Please fill in all required fields');
      return false;
    }
    if (formData.adminPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/tenant-setup/register', formData);
      toast.success('Organization registration submitted successfully!');
      toast.info('Your organization is pending approval. You will receive an email notification once approved.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white rounded-lg shadow-lg p-4 sm:p-8">
        <div>
          <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
            Register Your Organization
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create your tenant account to get started
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              1
            </div>
            <div className={`w-24 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              2
            </div>
            <div className={`w-24 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              3
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Organization Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Organization Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700">Organization Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleNameChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Slug *</label>
                <input
                  type="text"
                  name="slug"
                  required
                  value={formData.slug}
                  onChange={handleInputChange}
                  pattern="[a-z0-9-]+"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">URL-friendly identifier (lowercase, numbers, hyphens only)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Database Name *</label>
                <input
                  type="text"
                  name="databaseName"
                  required
                  value={formData.databaseName}
                  onChange={handleInputChange}
                  pattern="[a-z0-9_-]+"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Database identifier (lowercase, numbers, underscores, hyphens only)</p>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => validateStep1() && setStep(2)}
                  className="min-h-[44px] px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Admin Account */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Admin Account</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700">Admin Username *</label>
                <input
                  type="text"
                  name="adminUsername"
                  required
                  value={formData.adminUsername}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Admin Password *</label>
                <input
                  type="password"
                  name="adminPassword"
                  required
                  value={formData.adminPassword}
                  onChange={handleInputChange}
                  minLength={6}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Admin Email *</label>
                <input
                  type="email"
                  name="adminEmail"
                  required
                  value={formData.adminEmail}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="min-h-[44px] px-4 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => validateStep2() && setStep(3)}
                  className="min-h-[44px] px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Branding & Contact */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Branding & Contact (Optional)</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700">Display Name</label>
                <input
                  type="text"
                  name="branding.name"
                  value={formData.branding.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Primary Color</label>
                  <input
                    type="color"
                    name="branding.primaryColor"
                    value={formData.branding.primaryColor}
                    onChange={handleInputChange}
                    className="mt-1 block w-full h-10 rounded-md border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
                  <input
                    type="color"
                    name="branding.secondaryColor"
                    value={formData.branding.secondaryColor}
                    onChange={handleInputChange}
                    className="mt-1 block w-full h-10 rounded-md border-gray-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="min-h-[44px] px-4 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-[44px] px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Registering...' : 'Register'}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="text-center mt-4 space-y-2">
          <Link to="/login" className="block text-sm text-blue-600 hover:text-blue-500">
            Already have an account? Sign in
          </Link>
          <Link to="/" className="block text-sm text-gray-600 hover:text-gray-800">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TenantRegistration;


