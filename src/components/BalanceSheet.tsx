import React, { useState, useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Search, ChevronDown, ChevronUp, SlidersHorizontal, X, FileText, Globe } from 'lucide-react';
import type { Transaction } from '../types';

interface BalanceSheetProps {
  subsidiaryId?: string; // If passed, limits entries to this subsidiary and hides subsidiary filter
}

export const BalanceSheet: React.FC<BalanceSheetProps> = ({ subsidiaryId }) => {
  const transactions = useAppSelector(state => state.finance.transactions);
  const subsidiaries = useAppSelector(state => state.subsidiaries.items);
  const agents = useAppSelector(state => state.agents.items);

  // Filters State
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedSub, setSelectedSub] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [showAdvanceFilters, setShowAdvanceFilters] = useState<boolean>(false);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  // List of active business subsidiaries (excluding common)
  const activeSubsidiaries = useMemo(() => {
    return subsidiaries.filter(s => s.id !== 'common');
  }, [subsidiaries]);

  // Expand / Collapse details row
  const toggleExpand = (id: string) => {
    setExpandedTxId(expandedTxId === id ? null : id);
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedType('All');
    setSelectedSub('All');
    setSearchQuery('');
    setMinAmount('');
    setMaxAmount('');
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Subsidiary scope filter
      if (subsidiaryId) {
        if (tx.subsidiaryId !== subsidiaryId) return false;
      } else if (selectedSub !== 'All') {
        if (tx.subsidiaryId !== selectedSub) return false;
      }

      // 2. Transaction Type filter
      if (selectedType !== 'All') {
        if (tx.type.toLowerCase() !== selectedType.toLowerCase()) return false;
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesDesc = tx.description.toLowerCase().includes(query);
        const matchesRef = tx.referenceNumber?.toLowerCase().includes(query);
        const matchesPartner = tx.partnerName?.toLowerCase().includes(query);
        if (!matchesDesc && !matchesRef && !matchesPartner) return false;
      }

      // 4. Min/Max Amount filter (filters on amountPaidOrReceived)
      const amt = tx.amountPaidOrReceived;
      if (minAmount && !isNaN(parseFloat(minAmount))) {
        if (amt < parseFloat(minAmount)) return false;
      }
      if (maxAmount && !isNaN(parseFloat(maxAmount))) {
        if (amt > parseFloat(maxAmount)) return false;
      }

      return true;
    });
  }, [transactions, subsidiaryId, selectedType, selectedSub, searchQuery, minAmount, maxAmount]);

  // Color mappings for transaction types
  const getTypeBadgeVariant = (type: string) => {
    switch (type.toLowerCase()) {
      case 'investment':
        return 'info';
      case 'expense':
        return 'danger';
      case 'profit':
      case 'sale':
        return 'success';
      case 'procurement':
        return 'warning';
      case 'lead':
        return 'role';
      default:
        return 'pending';
    }
  };

  return (
    <Card className="bg-zinc-950/30 border-zinc-800/80 p-4 md:p-5 flex flex-col space-y-4">
      {/* Header Area */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h3 className="text-sm font-bold text-zinc-200">Balance Sheet Ledger</h3>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
            {subsidiaryId ? 'Workspace Audit Ledger Index' : 'Consolidated Enterprise Ledger Balance Sheet'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvanceFilters(!showAdvanceFilters)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors ${
              showAdvanceFilters || selectedType !== 'All' || selectedSub !== 'All' || minAmount || maxAmount
                ? 'bg-purple-950/30 border-purple-500/30 text-purple-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <SlidersHorizontal size={13} />
            Filters {(selectedType !== 'All' || selectedSub !== 'All' || minAmount || maxAmount) && '•'}
          </button>
          {(selectedType !== 'All' || selectedSub !== 'All' || searchQuery || minAmount || maxAmount) && (
            <button
              onClick={resetFilters}
              className="px-2 py-1.5 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/50 text-[10px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
            >
              <X size={10} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Basic Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search Input */}
        <div className="sm:col-span-2 relative">
          <Search size={14} className="absolute left-3 top-2.5 text-zinc-600" />
          <input
            type="text"
            placeholder="Search by description, invoice #, partner name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
          />
        </div>

        {/* Quick Type Selector */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-500/50"
        >
          <option value="All">All Types</option>
          <option value="Investment">Investment</option>
          <option value="Expense">Expense</option>
          <option value="Profit">Profit / Revenue</option>
          <option value="Sale">Sales Ledger</option>
          <option value="Procurement">Procurement</option>
        </select>
      </div>

      {/* Advanced Filters */}
      {showAdvanceFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-lg bg-zinc-950/40 border border-zinc-900/80 animate-in slide-in-from-top-2 duration-200">
          {/* Subsidiary Filter (only shown if subsidiaryId is undefined) */}
          {!subsidiaryId && (
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 font-mono uppercase">Target Entity</label>
              <select
                value={selectedSub}
                onChange={(e) => setSelectedSub(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500/50"
              >
                <option value="All">All Entities</option>
                <option value="common">Common (Global HQ)</option>
                {activeSubsidiaries.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Amount range filters */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 font-mono uppercase">Min Cash Paid/Received (₹)</label>
            <input
              type="number"
              placeholder="e.g. 5000"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 font-mono uppercase">Max Cash Paid/Received (₹)</label>
            <input
              type="number"
              placeholder="e.g. 100000"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>
      )}

      {/* Ledger Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-900 bg-zinc-950/20">
        <table className="w-full min-w-[650px] text-left border-collapse text-xs select-text">
          <thead>
            <tr className="bg-zinc-950/50 border-b border-zinc-900 text-zinc-500 font-mono text-[9px] uppercase tracking-wider">
              <th className="p-3 pl-4">TIMESTAMP</th>
              {!subsidiaryId && <th className="p-3">ENTITY</th>}
              <th className="p-3">TYPE</th>
              <th className="p-3">REF NUMBER</th>
              <th className="p-3">PARTNER / CLIENT</th>
              <th className="p-3 text-right">CASH PAID/RCVD</th>
              <th className="p-3 pr-4 text-center">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/60 font-mono">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={subsidiaryId ? 6 : 7} className="p-8 text-center text-zinc-600 italic">
                  No matching transaction ledger items recorded.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx: Transaction) => {
                const isExpanded = expandedTxId === tx.id;
                const formattedTime = new Date(tx.timestamp).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                });

                // Display formatting (positive for income/investments, negative for expenses/procurements)
                const isIncome = ['sale', 'profit', 'investment'].includes(tx.type.toLowerCase());
                const prefixSymbol = isIncome ? '+' : '-';
                const colorClass = isIncome ? 'text-emerald-400 font-bold' : 'text-rose-400';

                // Find agent name if processed by an agent
                const processingAgent = agents.find(a => a.id === tx.processedByAgentId);

                return (
                  <React.Fragment key={tx.id}>
                    {/* Normal Row */}
                    <tr
                      onClick={() => toggleExpand(tx.id)}
                      className={`hover:bg-zinc-900/20 cursor-pointer transition-colors ${
                        isExpanded ? 'bg-zinc-900/10' : ''
                      }`}
                    >
                      <td className="p-3 pl-4 text-zinc-400 whitespace-nowrap">{formattedTime}</td>
                      {!subsidiaryId && (
                        <td className="p-3 font-sans font-bold text-zinc-300">
                          {tx.subsidiaryId === 'common' ? (
                            <span className="flex items-center gap-1.5 text-zinc-400">
                              <Globe size={11} className="text-zinc-500" /> HQ
                            </span>
                          ) : (
                            tx.subsidiaryName
                          )}
                        </td>
                      )}
                      <td className="p-3">
                        <Badge variant={getTypeBadgeVariant(tx.type) as any}>{tx.type.toUpperCase()}</Badge>
                      </td>
                      <td className="p-3 text-zinc-400">{tx.referenceNumber || <span className="text-zinc-600">N/A</span>}</td>
                      <td className="p-3 text-zinc-300 truncate max-w-[140px]" title={tx.partnerName}>
                        {tx.partnerName || <span className="text-zinc-600">N/A</span>}
                      </td>
                      <td className={`p-3 text-right ${colorClass}`}>
                        {prefixSymbol}₹{tx.amountPaidOrReceived.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <button className="p-1 rounded hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition-colors">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Details Row */}
                    {isExpanded && (
                      <tr className="bg-zinc-950/40 border-t border-b border-zinc-900">
                        <td colSpan={subsidiaryId ? 6 : 7} className="p-4 pl-8 select-text">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-zinc-400 font-sans leading-relaxed">
                            {/* Description and metadata */}
                            <div className="space-y-2">
                              <div>
                                <span className="text-[10px] text-zinc-600 font-mono block">TRANSACTION DESCRIPTION</span>
                                <span className="text-zinc-200 font-medium text-sm">{tx.description}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-mono">
                                <div>
                                  <span className="text-zinc-600">STATUS:</span>{' '}
                                  <span className={tx.status === 'Completed' ? 'text-emerald-400 font-bold' : 'text-amber-500'}>
                                    {tx.status?.toUpperCase() || 'COMPLETED'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-zinc-600">AGENT AUDIT:</span>{' '}
                                  <span className="text-zinc-300">
                                    {processingAgent ? `Processed by ${processingAgent.name} (${processingAgent.role})` : 'Manual Posting'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-zinc-600">REF NUMBER:</span>{' '}
                                  <span className="text-zinc-300">{tx.referenceNumber || 'None'}</span>
                                </div>
                                <div>
                                  <span className="text-zinc-600">PARTNER:</span>{' '}
                                  <span className="text-zinc-300">{tx.partnerName || 'None'}</span>
                                </div>
                              </div>
                              {tx.documentUrl && (
                                <div className="pt-2">
                                  <a
                                    href={tx.documentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-[10px] text-purple-400 font-mono inline-flex items-center gap-1.5 transition-colors"
                                  >
                                    <FileText size={11} /> View Processed Bill Document
                                  </a>
                                </div>
                              )}
                            </div>

                            {/* Detailed GST breakdown calculation */}
                            <div className="bg-zinc-950/60 p-3.5 rounded-lg border border-zinc-900/80 font-mono text-[11px] space-y-2 shrink-0">
                              <span className="text-[9px] text-zinc-600 uppercase block tracking-wider">GST Audit breakdown</span>
                              <div className="space-y-1.5">
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">BASE SUB-TOTAL:</span>
                                  <span className="text-zinc-300">₹{(tx.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">DISCOUNT APPLIED:</span>
                                  <span className="text-rose-500">-₹{(tx.discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between border-t border-zinc-900/60 pt-1.5">
                                  <span className="text-zinc-500">CENTRAL GST (CGST 9%):</span>
                                  <span className="text-zinc-300">₹{(tx.cgst || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">STATE GST (SGST 9%):</span>
                                  <span className="text-zinc-300">₹{(tx.sgst || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between border-t border-zinc-900 pt-1.5 font-bold text-zinc-200">
                                  <span>GRAND TOTAL:</span>
                                  <span>₹{(tx.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between border-t border-dashed border-zinc-800 pt-1.5 text-xs text-zinc-100 font-bold">
                                  <span className="text-purple-400">ACTUAL CASH PAID/RCVD:</span>
                                  <span className={isIncome ? 'text-emerald-400' : 'text-rose-400'}>
                                    {prefixSymbol}₹{(tx.amountPaidOrReceived || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
