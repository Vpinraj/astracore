import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchStateRequest } from '../store/slices/coreSlice';
import { api } from '../api';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { ShoppingBag, Upload, Search, Check, AlertCircle, Trash2, Package, Layers, Plus } from 'lucide-react';
import type { CatalogItem, Agent } from '../types';

export const CatalogBoard: React.FC = () => {
  const dispatch = useAppDispatch();
  const subsidiaries = useAppSelector(state => state.subsidiaries.items);
  const agents = useAppSelector(state => state.agents.items);

  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSub, setFilterSub] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // File Upload State
  const [targetSubId, setTargetSubId] = useState(subsidiaries[0]?.id || 'common');
  const [targetAgentId, setTargetAgentId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressLog, setUploadProgressLog] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Item Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [pName, setPName] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pPrice, setPPrice] = useState(0);
  const [pSku, setPSku] = useState('');
  const [pCategory, setPCategory] = useState('General');
  const [isSaving, setIsSaving] = useState(false);

  // Load Catalog Items
  const loadCatalog = async () => {
    setLoading(true);
    try {
      const items = await api.fetchCatalog();
      setCatalogItems(items);
    } catch (err: any) {
      setError('Failed to load catalog database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  // Filter agents based on chosen subsidiary
  const subAgents = agents.filter(a => a.subsidiaryId === targetSubId);

  // Auto-select agent if subsidiary changes
  useEffect(() => {
    if (subAgents.length > 0) {
      setTargetAgentId(subAgents[0].id);
    } else {
      setTargetAgentId('');
    }
  }, [targetSubId, agents]);

  // Unique categories list for filters
  const categories = useMemo(() => {
    const cats = catalogItems.map(item => item.category || 'General');
    return Array.from(new Set(cats));
  }, [catalogItems]);

  // Apply filters
  const filteredCatalog = catalogItems.filter(item => {
    const matchSearch =
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSub = filterSub === 'all' || item.subsidiaryId === filterSub;
    const matchCat = filterCategory === 'all' || item.category === filterCategory;
    return matchSearch && matchSub && matchCat;
  });

  // Handle manual file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      setSuccessMsg('');
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Upload and Parse Catalog File
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a catalog file (text sheet, image receipt, docx, xlsx).');
      return;
    }

    setUploading(true);
    setError('');
    setSuccessMsg('');

    // Simulated log stream to show agent extraction progress in real-time
    const logs = [
      'Extracting document layer headers...',
      'Mapping unstructured entries to product schemas...',
      'Calling AI Agent logic engine...',
      'Auditing SKU uniqueness and extracting cost points...',
      'Formatting JSON payload structure...',
      'Verifying parsed catalog records against ledger...'
    ];

    let logIdx = 0;
    setUploadProgressLog(logs[0]);
    const logInterval = setInterval(() => {
      if (logIdx < logs.length - 1) {
        logIdx++;
        setUploadProgressLog(logs[logIdx]);
      }
    }, 1500);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('subsidiaryId', targetSubId);
      formData.append('agentId', targetAgentId);

      const response = await api.uploadCatalog(formData);

      clearInterval(logInterval);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setSuccessMsg(`Extracted successfully! ${response.items?.length || 0} products parsed and saved to ledger database.`);
      
      // Reload lists
      loadCatalog();
      dispatch(fetchStateRequest());
    } catch (err: any) {
      clearInterval(logInterval);
      setError(err.message || 'AI agent failed to parse the file. Ensure the content formatting is clear.');
    } finally {
      setUploading(false);
      setUploadProgressLog('');
    }
  };

  // Save manual catalog item
  const handleSaveManualItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) return;

    setIsSaving(true);
    setError('');

    const sub = subsidiaries.find(s => s.id === targetSubId);

    const manualItem = {
      productName: pName.trim(),
      description: pDesc.trim(),
      price: pPrice,
      sku: pSku.trim() || `SKU-MAN-${Math.floor(Math.random() * 90000) + 10000}`,
      category: pCategory.trim(),
      subsidiaryId: targetSubId,
      subsidiaryName: sub?.name || 'HQ Operations'
    };

    try {
      await api.addItem(manualItem);
      loadCatalog();
      dispatch(fetchStateRequest());
      setIsManualModalOpen(false);

      setPName('');
      setPDesc('');
      setPPrice(0);
      setPSku('');
      setPCategory('General');
    } catch (err: any) {
      setError('Failed to record manual item.');
    } finally {
      setIsSaving(false);
    }
  };

  // Clear Catalog Database
  const handleClearCatalog = async () => {
    if (!window.confirm('Are you sure you want to delete all catalog items? This cannot be undone.')) {
      return;
    }
    setLoading(true);
    try {
      await api.clearCatalog();
      loadCatalog();
      dispatch(fetchStateRequest());
      setSuccessMsg('Catalog database cleared successfully.');
    } catch (err: any) {
      setError('Failed to clear database catalog.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/50 text-red-400 font-mono flex items-start gap-2 animate-in fade-in duration-200">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 font-mono flex items-start gap-2 animate-in fade-in duration-200">
          <Check size={15} className="shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Upload Panel */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-bold font-mono text-purple-400 flex items-center gap-1.5 uppercase tracking-widest border-b border-zinc-900/80 pb-2">
              <Upload size={14} /> Agent Catalog submission
            </h4>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              {/* Target Subsidiary */}
              <div className="space-y-1">
                <label className="text-zinc-400 font-medium font-sans">Subsidiary Cluster</label>
                <select
                  value={targetSubId}
                  onChange={(e) => setTargetSubId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-150 focus:outline-none focus:border-purple-500/50 cursor-pointer"
                >
                  <option value="common">Common (HQ Operations)</option>
                  {subsidiaries.filter(s => s.id !== 'common').map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Processing Agent */}
              <div className="space-y-1">
                <label className="text-zinc-400 font-medium font-sans">AI Extraction Agent</label>
                <select
                  value={targetAgentId}
                  onChange={(e) => setTargetAgentId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-150 focus:outline-none focus:border-purple-500/50 cursor-pointer"
                  disabled={subAgents.length === 0}
                >
                  {subAgents.length === 0 ? (
                    <option value="">No active agents in selected cluster</option>
                  ) : (
                    subAgents.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                    ))
                  )}
                </select>
              </div>

              {/* File Select */}
              <div
                onClick={triggerFileSelect}
                className="border border-dashed border-zinc-850 hover:border-purple-500/40 bg-zinc-950/20 py-8 px-4 rounded-xl text-center space-y-2.5 cursor-pointer select-none transition-all duration-200"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".txt,.csv,.docx,.xlsx,.xls,.png,.jpg,.jpeg"
                  className="hidden"
                />
                <div className="p-2.5 rounded-full bg-zinc-900 border border-zinc-850 text-purple-400 w-fit mx-auto">
                  <Upload size={16} />
                </div>
                <div>
                  <p className="font-semibold text-zinc-200 text-xs">Drop or Click to Upload Catalog</p>
                  <p className="text-[9px] text-zinc-500 mt-1 font-mono leading-snug">
                    Accepts spreadsheet excel, word docs, receipt bills, text csv
                  </p>
                </div>

                {selectedFile && (
                  <div className="px-2 py-1.5 rounded-lg bg-zinc-900/80 border border-purple-500/20 text-[9px] font-mono text-zinc-350 truncate flex items-center justify-center gap-1.5 mx-auto max-w-[200px]">
                    <Package size={10} className="text-purple-400 shrink-0" />
                    {selectedFile.name}
                  </div>
                )}
              </div>

              {/* Upload Logs Spinner */}
              {uploading && (
                <div className="p-3 bg-zinc-950 rounded-lg border border-purple-500/10 space-y-2 text-center animate-pulse">
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-[9px] font-mono text-purple-400 leading-normal">{uploadProgressLog}</p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  variant="purple"
                  className="flex-1 font-semibold"
                  disabled={uploading || !selectedFile || subAgents.length === 0}
                >
                  {uploading ? 'Processing File...' : 'Dispatch Agent Extraction'}
                </Button>
              </div>
            </form>
          </div>

          {/* Quick Actions */}
          <div className="bg-zinc-950/20 border border-zinc-900/60 rounded-xl p-4 flex gap-2">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setIsManualModalOpen(true)}
              className="flex-1 border-zinc-800 font-semibold"
            >
              <Plus size={12} className="inline mr-1" /> Add Product
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={handleClearCatalog}
              className="flex-1 border-red-950 text-red-400 hover:bg-red-950/20 font-semibold"
              disabled={catalogItems.length === 0}
            >
              <Trash2 size={12} className="inline mr-1" /> Clear Catalog
            </Button>
          </div>
        </div>

        {/* Right Side: Grid of catalog items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 bg-zinc-950/20 p-4 border border-zinc-900 rounded-xl justify-between">
            <div className="flex flex-wrap items-start gap-3 flex-1">
              {/* Search */}
              <div className="space-y-1 flex-1 min-w-[130px] max-w-xs">
                <span className="text-[9px] text-zinc-500 font-mono block">SEARCH ITEMS</span>
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search by name or sku..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-7 pr-3 py-1 text-[11px] text-zinc-100 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>

              {/* Filter Subsidiary */}
              <div className="space-y-1 flex-1 min-w-[120px] max-w-[160px]">
                <span className="text-[9px] text-zinc-500 font-mono block">FILTER ENTITY</span>
                <select
                  value={filterSub}
                  onChange={(e) => setFilterSub(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-[11px] text-zinc-150 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Entities</option>
                  <option value="common">Common HQ</option>
                  {subsidiaries.filter(s => s.id !== 'common').map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Filter Category */}
              <div className="space-y-1 flex-1 min-w-[120px] max-w-[160px]">
                <span className="text-[9px] text-zinc-500 font-mono block">FILTER CATEGORY</span>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-[11px] text-zinc-150 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="text-[10px] text-zinc-500 font-mono pt-3 sm:pt-0">
              Showing {filteredCatalog.length} / {catalogItems.length} items
            </div>
          </div>

          {/* Grid display */}
          <div className="max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
            {loading ? (
              <div className="py-20 text-center font-mono text-xs text-purple-400 animate-pulse">
                Accessing catalog database layers...
              </div>
            ) : filteredCatalog.length === 0 ? (
              <div className="p-12 text-center text-xs text-zinc-650 bg-zinc-950/15 border border-dashed border-zinc-900 rounded-xl">
                <ShoppingBag className="mx-auto mb-2 text-zinc-800" size={32} />
                No catalog items found. Upload a file above to begin listing products.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredCatalog.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/30 hover:border-zinc-800/80 transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-[8px] font-mono leading-none tracking-tight font-semibold bg-zinc-900 border border-zinc-800 text-zinc-400">
                          {item.subsidiaryName || 'HQ Operations'}
                        </span>
                        <Badge variant="role" className="text-[8px] py-0.5 px-1.5 leading-none capitalize bg-indigo-950/20 border border-indigo-900/40 text-indigo-400">
                          {item.category || 'General'}
                        </Badge>
                      </div>

                      <h5 className="text-xs font-bold text-zinc-200 truncate" title={item.productName}>
                        {item.productName}
                      </h5>
                      <p className="text-[9px] text-zinc-500 mt-1.5 font-mono">
                        SKU: <span className="text-zinc-400">{item.sku}</span>
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed line-clamp-2">
                        {item.description || 'No product narrative available.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-900/60 flex justify-between items-center">
                      <span className="text-[10px] text-zinc-500 font-mono">Price:</span>
                      <span className="text-xs font-bold text-emerald-400 font-mono">
                        ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Record Manual Item Modal */}
      {isManualModalOpen && (
        <Modal
          isOpen={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
          title="Add Catalog Product"
        >
          <form onSubmit={handleSaveManualItem} className="space-y-4 text-xs text-zinc-300">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-zinc-400 font-semibold font-sans">Product Name</label>
              <input
                type="text"
                value={pName}
                onChange={(e) => setPName(e.target.value)}
                placeholder="e.g. Wireless Mechanical Keyboard"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-purple-500/50"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-zinc-400 font-semibold font-sans">Description</label>
              <textarea
                value={pDesc}
                onChange={(e) => setPDesc(e.target.value)}
                placeholder="Describe product details, traits..."
                rows={2}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-purple-500/50 resize-none font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Price */}
              <div className="space-y-1">
                <label className="text-zinc-400 font-semibold font-sans">Retail Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={pPrice || ''}
                  onChange={(e) => setPPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="e.g. 2999"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50 font-mono"
                  required
                />
              </div>

              {/* Sku */}
              <div className="space-y-1">
                <label className="text-zinc-400 font-semibold font-sans">SKU (optional)</label>
                <input
                  type="text"
                  value={pSku}
                  onChange={(e) => setPSku(e.target.value)}
                  placeholder="Auto-generated if empty"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-purple-500/50 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-1">
                <label className="text-zinc-400 font-semibold font-sans">Category</label>
                <input
                  type="text"
                  value={pCategory}
                  onChange={(e) => setPCategory(e.target.value)}
                  placeholder="e.g. Electronics, Office"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              {/* Subsidiary Selector */}
              <div className="space-y-1">
                <label className="text-zinc-400 font-semibold font-sans">Target Entity</label>
                <select
                  value={targetSubId}
                  onChange={(e) => setTargetSubId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-purple-500/50"
                >
                  <option value="common">Common HQ</option>
                  {subsidiaries.filter(s => s.id !== 'common').map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-900/60">
              <Button type="button" variant="outline" onClick={() => setIsManualModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="purple" disabled={isSaving}>
                {isSaving ? 'Saving Item...' : 'Save Product'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};


