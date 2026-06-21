import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Upload, HelpCircle, FileText, Check, AlertCircle } from 'lucide-react';

interface CreateTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubsidiaryId?: string;
}

export const CreateTransactionModal: React.FC<CreateTransactionModalProps> = ({
  isOpen,
  onClose,
  defaultSubsidiaryId
}) => {
  const { subsidiaries, agents, createTransaction } = useApp();

  // Basic Details
  const [subsidiaryId, setSubsidiaryId] = useState(defaultSubsidiaryId || 'common');
  const [type, setType] = useState<string>('Sale');
  const [description, setDescription] = useState<string>('');

  // GST & Financial breakdowns
  const [subtotal, setSubtotal] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(18); // Default to 18% GST (9% CGST, 9% SGST)
  const [cgst, setCgst] = useState<number>(0);
  const [sgst, setSgst] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [amountPaidOrReceived, setAmountPaidOrReceived] = useState<number>(0);

  // Invoicing Metadata
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [partnerName, setPartnerName] = useState<string>('');
  const [processedByAgentId, setProcessedByAgentId] = useState<string>('');
  const [status, setStatus] = useState<string>('Completed');

  // Simulated Document Upload State
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string>('');

  // Filter out common subsidiary to list active business ones
  const activeSubs = subsidiaries.filter(s => s.id !== 'common');

  // Get active agents for the selected subsidiary to assign processing credits
  const subsidiaryAgents = agents.filter(a => a.subsidiaryId === subsidiaryId);

  // Automatically calculate GST and Totals when Subtotal, Discount, or Tax Rate changes
  useEffect(() => {
    const base = Math.max(0, subtotal - discount);
    
    if (taxRate === 0) {
      setCgst(0);
      setSgst(0);
      setTotalAmount(base);
      setAmountPaidOrReceived(base);
    } else {
      const halfRate = (taxRate / 2) / 100;
      const computedCgst = Math.round(base * halfRate * 100) / 100;
      const computedSgst = Math.round(base * halfRate * 100) / 100;
      const grandTotal = Math.round((base + computedCgst + computedSgst) * 100) / 100;
      
      setCgst(computedCgst);
      setSgst(computedSgst);
      setTotalAmount(grandTotal);
      setAmountPaidOrReceived(grandTotal);
    }
  }, [subtotal, discount, taxRate]);

  // Adjust defaults when Type changes
  useEffect(() => {
    if (type === 'Investment') {
      setTaxRate(0); // Investments do not have GST
    } else if (subtotal === 0) {
      setTaxRate(18); // Default back to 18% for operational sales/procurements
    }
  }, [type]);

  // Pre-fill subsidiary when opened
  useEffect(() => {
    if (isOpen) {
      setSubsidiaryId(defaultSubsidiaryId || 'common');
      setError('');
      setDescription('');
      setSubtotal(0);
      setDiscount(0);
      setReferenceNumber('');
      setPartnerName('');
      setProcessedByAgentId('');
      setUploadedFileName('');
      setStatus('Completed');
    }
  }, [isOpen, defaultSubsidiaryId]);

  // Simulate Bill File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setError('');
      
      // Simulate extraction lag
      setTimeout(() => {
        setUploadedFileName(file.name);
        setIsUploading(false);
        
        // Auto-extract mock invoice values to show "agent automation" behavior!
        const randomTotal = Math.floor(Math.random() * 15000) + 1500;
        setSubtotal(randomTotal);
        setDiscount(0);
        setReferenceNumber(`INV-BILL-${Math.floor(Math.random() * 900000) + 100000}`);
        
        // Pick a partner name based on file/type
        if (type === 'Procurement') {
          const vendors = ['AWS Cloud Services', 'Google Workspaces', 'Slack Technologies', 'Zoom Video Corp', 'Airtel Broadband'];
          setPartnerName(vendors[Math.floor(Math.random() * vendors.length)]);
          setDescription('Auto-extracted operational vendor bill invoice');
        } else {
          setPartnerName('External Business Partner');
          setDescription('Auto-extracted client invoice');
        }

        // Auto-assign the first active agent as the bill processor!
        if (subsidiaryAgents.length > 0) {
          setProcessedByAgentId(subsidiaryAgents[0].id);
        }
      }, 1500);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Submit transaction entry
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      setError('Please provide a description.');
      return;
    }

    if (subtotal < 0 || discount < 0 || amountPaidOrReceived < 0) {
      setError('Values cannot be negative.');
      return;
    }

    // Find the target subsidiary balance to check for overdrafts
    if (type === 'Expense' || type === 'Procurement') {
      const selectedSubObj = subsidiaries.find(s => s.id === subsidiaryId);
      if (selectedSubObj && selectedSubObj.balance < amountPaidOrReceived) {
        setError(`Overdraft alert: Target subsidiary balance is ₹${selectedSubObj.balance.toLocaleString()}, which is insufficient to cover this expense of ₹${amountPaidOrReceived.toLocaleString()}.`);
        return;
      }
    }

    try {
      await createTransaction(
        subsidiaryId,
        type,
        subtotal,
        discount,
        cgst,
        sgst,
        totalAmount,
        amountPaidOrReceived,
        description,
        referenceNumber,
        partnerName,
        uploadedFileName ? `uploads/${uploadedFileName}` : '',
        processedByAgentId,
        status
      );

      onClose();
    } catch (err: any) {
      setError(err.message || 'Error recording transaction ledger item.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Invoice & Transaction" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5 text-xs text-zinc-300 max-h-[78vh] overflow-y-auto pr-1">
        {error && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/50 text-red-400 font-mono flex items-start gap-2 animate-in fade-in duration-200">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Core Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Subsidiary Target */}
          <div className="space-y-1.5">
            <label className="text-zinc-400 font-semibold font-sans">Target Entity</label>
            <select
              value={subsidiaryId}
              onChange={(e) => setSubsidiaryId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50"
            >
              <option value="common">Common (HQ Operations)</option>
              {activeSubs.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Transaction Type */}
          <div className="space-y-1.5">
            <label className="text-zinc-400 font-semibold font-sans">Ledger Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50"
            >
              <option value="Sale">Sale (Revenue Event)</option>
              <option value="Procurement">Procurement (Vendor Bill)</option>
              <option value="Investment">Investment (Funding Input)</option>
              <option value="Expense">Operating Expense</option>
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-zinc-400 font-semibold font-sans">Billing Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50"
            >
              <option value="Completed">Completed (Cleared)</option>
              <option value="Pending">Pending Approval</option>
              <option value="Failed">Failed (Rejected)</option>
            </select>
          </div>
        </div>

        {/* Bill Upload Simulator Block */}
        <div className="p-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/20 text-center space-y-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,application/pdf"
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center space-y-1.5">
            <div className="p-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-purple-400">
              <Upload size={16} />
            </div>
            <div>
              <p className="font-semibold text-zinc-200">Upload PDF Invoice / Receipt Bill</p>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Let AI Agent auto-extract tax structures and values</p>
            </div>
          </div>

          {isUploading && (
            <div className="text-[10px] text-purple-400 font-mono animate-pulse flex items-center justify-center gap-1.5">
              <span>Scanning document layers and auditing ledger codes...</span>
            </div>
          )}

          {uploadedFileName && !isUploading && (
            <div className="px-3 py-2 rounded-lg bg-zinc-900 border border-purple-500/20 text-[10px] font-mono text-zinc-300 flex items-center justify-between max-w-md mx-auto">
              <span className="flex items-center gap-1.5 truncate">
                <FileText size={12} className="text-purple-400 shrink-0" />
                {uploadedFileName}
              </span>
              <span className="text-[8px] bg-purple-950/80 border border-purple-500/30 text-purple-400 px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase shrink-0 font-bold tracking-tight">
                <Check size={8} /> Extracted
              </span>
            </div>
          )}

          {!uploadedFileName && !isUploading && (
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={triggerFileSelect}
              className="border-zinc-800 hover:border-zinc-700 font-semibold"
            >
              Select Bill Document
            </Button>
          )}
        </div>

        {/* Financial GST Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 animate-in fade-in duration-300">
            {/* Breakdown Inputs */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 font-mono uppercase tracking-widest border-b border-zinc-900/60 pb-1.5">
                Financial Breakdown
              </h4>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-medium font-sans">Base Subtotal (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={subtotal || ''}
                    onChange={(e) => setSubtotal(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="e.g. 10000"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-purple-500/50 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-medium font-sans">Discount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={discount || ''}
                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="0.00"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-purple-500/50 font-mono"
                  />
                </div>
              </div>

              {type !== 'Investment' && (
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-medium font-sans">GST Tax Rate Selector</label>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50"
                  >
                    <option value={18}>18% GST (Standard Services - 9% CGST, 9% SGST)</option>
                    <option value={5}>5% GST (Essential Services - 2.5% CGST, 2.5% SGST)</option>
                    <option value={12}>12% GST (6% CGST, 6% SGST)</option>
                    <option value={28}>28% GST (Luxury Items - 14% CGST, 14% SGST)</option>
                    <option value={0}>0% Tax (Exempt / Special Economic Zone)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Calculations Preview Card */}
            <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-900 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-zinc-500 font-mono block uppercase tracking-wider mb-2.5">GST Calculation Preview</span>
                <div className="space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Subtotal after discount:</span>
                    <span className="text-zinc-300">₹{Math.max(0, subtotal - discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  {type !== 'Investment' && taxRate > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">CGST ({(taxRate / 2)}%):</span>
                        <span className="text-zinc-300">₹{cgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">SGST ({(taxRate / 2)}%):</span>
                        <span className="text-zinc-300">₹{sgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between border-t border-zinc-900 pt-2 font-bold text-zinc-100 text-xs">
                    <span>GRAND TOTAL AMOUNT:</span>
                    <span>₹{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Amount paid/received input */}
              <div className="space-y-1.5 border-t border-zinc-900 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <label className="text-zinc-300 font-semibold font-sans">Actual Cash Paid/Received (₹)</label>
                  <span className="text-[10px] text-zinc-500 font-mono hover:text-zinc-400 cursor-pointer" onClick={() => setAmountPaidOrReceived(totalAmount)}>
                    Set to Grand Total
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amountPaidOrReceived || ''}
                  onChange={(e) => setAmountPaidOrReceived(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="₹0.00"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50 font-mono text-sm text-purple-400 font-bold"
                  required
                />
              </div>
            </div>
          </div>

        {/* Invoice Metadata (collapsible or grouped details) */}
        <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 space-y-3.5">
          <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 font-mono uppercase tracking-widest border-b border-zinc-900/60 pb-1.5">
            Invoice & Operations Metadata
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Reference Number */}
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-medium font-sans">Reference / Invoice Number</label>
              <input
                type="text"
                placeholder="e.g. INV-2026-9041"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-purple-500/50 font-mono"
              />
            </div>

            {/* Partner Name */}
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-medium font-sans">
                {type === 'Procurement' ? 'Vendor / Payee Name' : type === 'Sale' ? 'Customer / Client Name' : 'Contact / Partner Name'}
              </label>
              <input
                type="text"
                placeholder={type === 'Procurement' ? 'e.g. Amazon Web Services' : 'e.g. Aura Industries'}
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-purple-500/50 font-sans"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Processing Agent */}
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-medium font-sans flex items-center gap-1">
                Processed By AI Agent
                <span title="Which AI Agent extracted and audited this billing item">
                  <HelpCircle size={11} className="text-zinc-500 cursor-help" />
                </span>
              </label>
              <select
                value={processedByAgentId}
                onChange={(e) => setProcessedByAgentId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50"
              >
                <option value="">Manual Entry (No Agent Processing)</option>
                {subsidiaryAgents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-medium font-sans">Description / Ledger Narrative</label>
              <input
                type="text"
                placeholder="e.g. Monthly server rent charges"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-purple-500/50 font-sans"
                required
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2.5 pt-2 border-t border-zinc-900/60">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="border-zinc-800 hover:bg-zinc-900/60">
            Cancel
          </Button>
          <Button type="submit" variant="purple" size="sm" className="font-semibold px-5">
            Post Ledger Transaction
          </Button>
        </div>
      </form>
    </Modal>
  );
};
