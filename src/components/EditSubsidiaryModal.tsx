import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { updateSubsidiaryRequest } from '../store/slices/subsidiarySlice';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import type { Subsidiary } from '../types';

interface EditSubModalProps {
  isOpen: boolean;
  onClose: () => void;
  subsidiary: Subsidiary;
}

export const EditSubsidiaryModal: React.FC<EditSubModalProps> = ({ isOpen, onClose, subsidiary }) => {
  const dispatch = useAppDispatch();
  const [name, setName] = useState(subsidiary.name);
  const [industry, setIndustry] = useState(subsidiary.industry);
  const [logoUrl, setLogoUrl] = useState(subsidiary.logoUrl || '');
  const [website, setWebsite] = useState(subsidiary.website || '');
  const [email, setEmail] = useState(subsidiary.email || '');
  const [phone, setPhone] = useState(subsidiary.phone || '');
  const [description, setDescription] = useState(subsidiary.description || '');
  const [address, setAddress] = useState(subsidiary.address || '');
  const [bankDetails, setBankDetails] = useState(subsidiary.bankDetails || '');
  const [error, setError] = useState('');

  const industries = ['AI Software', 'Robotics', 'Fintech', 'Creative Agency', 'Biotech', 'Cybersecurity'];

  // Reset form when modal opens with new subsidiary
  useEffect(() => {
    if (isOpen) {
      setName(subsidiary.name);
      setIndustry(subsidiary.industry);
      setLogoUrl(subsidiary.logoUrl || '');
      setWebsite(subsidiary.website || '');
      setEmail(subsidiary.email || '');
      setPhone(subsidiary.phone || '');
      setDescription(subsidiary.description || '');
      setAddress(subsidiary.address || '');
      setBankDetails(subsidiary.bankDetails || '');
      setError('');
    }
  }, [isOpen, subsidiary]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a company name.');
      return;
    }

    dispatch(updateSubsidiaryRequest({
      id: subsidiary.id,
      data: {
        name, 
        industry, 
        logoUrl, 
        website, 
        email, 
        phone, 
        description, 
        address, 
        bankDetails
      }
    }));
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Subsidiary Details" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 text-sm max-h-[75vh] overflow-y-auto pr-1">
        {error && (
          <div className="p-2.5 rounded bg-red-950/40 border border-red-900/50 text-red-400 font-mono text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-zinc-400 font-medium">Subsidiary Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CyberDyne Tech"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-400 font-medium">Industry Classification</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50"
            >
              {industries.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-zinc-400 font-medium">Logo URL</label>
          <input
            type="text"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="e.g. https://example.com/logo.png"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-zinc-400 font-medium">Website</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="e.g. https://example.com"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-400 font-medium">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. contact@example.com"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-zinc-400 font-medium">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-400 font-medium">Bank Details</label>
            <input
              type="text"
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
              placeholder="e.g. HDFC Bank, A/C: 123456"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-zinc-400 font-medium">Physical Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 123 Tech Park, Bangalore"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-zinc-400 font-medium">Subsidiary Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe operations, products, and milestones..."
            rows={2}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 resize-none font-sans"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="purple">Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
};
