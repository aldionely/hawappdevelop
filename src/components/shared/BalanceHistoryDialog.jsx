import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { appBalanceKeysAndNames } from '@/lib/shiftConstants';
import { calculateProductAdminFee } from '@/lib/productAndBalanceHelper';

// Fungsi ini kita ambil dari BalanceHistory.jsx yang sudah ada
const convertTxToBalanceLog = (tx, products) => {
    let balanceChange = 0;
    let appKey = null;
    let type = '';
    
    const productDetails = calculateProductAdminFee(tx, products);

    if (productDetails.relatedAppKey) {
        appKey = productDetails.relatedAppKey;
        const specialKeys = ['BERKAT', 'RITA', 'ISIMPEL', 'SIDOMPUL', 'DIGIPOS'];
        if (specialKeys.includes(appKey.toUpperCase())) {
            balanceChange = productDetails.costPrice;
        } else {
            balanceChange = productDetails.fee > 0 ? productDetails.fee : 0;
        }
        type = 'PENGURANGAN';
    } else if (tx.type === 'in' && tx.saldoKeluarAplikasi > 0) {
        balanceChange = tx.saldoKeluarAplikasi;
        type = 'PENGURANGAN';
    } else if (tx.type === 'out' && tx.saldoMasukAplikasi > 0) {
        balanceChange = tx.saldoMasukAplikasi;
        type = 'PENAMBAHAN';
    }

    if (!appKey) {
        const descUpper = tx.description.toUpperCase();
        const foundApp = appBalanceKeysAndNames.find(app => descUpper.includes(app.name.toUpperCase()));
        if (foundApp) appKey = foundApp.key;
    }
    
    if (balanceChange > 0 && appKey) {
        const appName = appBalanceKeysAndNames.find(app => app.key === appKey)?.name || appKey;
        return {
            id: `txlog_${tx.id}`,
            created_at: tx.timestamp,
            amount: balanceChange,
            type: type,
            app_key: appKey,
            app_name: appName,
            description: `[AUTO] ${tx.description}`,
            source: 'transaction'
        };
    }
    
    return null;
};


export const BalanceHistoryDialog = ({ isOpen, onOpenChange, shift, products }) => {
  const { fetchAppBalanceLogsAPI } = useData();
  const [manualLogs, setManualLogs] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && shift?.id) {
      const fetchLogs = async () => {
        setIsLoading(true);
        const result = await fetchAppBalanceLogsAPI(shift.id);
        if (result.success) {
          setManualLogs(result.data.map(log => ({ ...log, source: 'manual' })));
        } else {
          setManualLogs([]);
        }
        setIsLoading(false);
      };
      fetchLogs();
    }
  }, [isOpen, shift?.id, fetchAppBalanceLogsAPI]);

  const combinedLogs = useMemo(() => {
    const logsFromTransactions = (shift?.transactions || []).map(tx => convertTxToBalanceLog(tx, products)).filter(Boolean);
    const allLogs = [...manualLogs, ...logsFromTransactions];
    return allLogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [manualLogs, shift?.transactions, products]);

  const filteredLogs = useMemo(() => {
    if (filter === 'ALL') return combinedLogs;
    return combinedLogs.filter(log => log.app_key === filter);
  }, [filter, combinedLogs]);

  const formatTime = (dateString) => new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString([], { day: '2-digit', month: 'short' });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Riwayat Saldo Aplikasi</DialogTitle>
           <DialogDescription className="text-xs">
              Shift: {shift?.workerName || shift?.workername} | Lokasi: {shift?.lokasi || '-'}
            </DialogDescription>
        </DialogHeader>
        <div className="flex justify-between items-center py-2">
            <h3 className="font-semibold text-sm">Log Perubahan Saldo</h3>
            <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px] h-9 text-xs">
                <SelectValue placeholder="Filter Aplikasi" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="ALL">Semua Aplikasi</SelectItem>
                {appBalanceKeysAndNames.map(app => (
                <SelectItem key={app.key} value={app.key}>{app.name}</SelectItem>
                ))}
            </SelectContent>
            </Select>
        </div>
        <div className="flex-grow overflow-y-auto pr-2 space-y-2 text-xs border-t pt-2">
            {isLoading && <p className="text-center text-gray-500">Memuat riwayat...</p>}
            {!isLoading && filteredLogs.length === 0 && <p className="text-center text-gray-500 pt-4">Tidak ada riwayat untuk ditampilkan.</p>}
            {!isLoading && filteredLogs.map(log => (
            <div key={log.id} className="p-2 border rounded-md bg-gray-50">
                <div className="flex justify-between items-start">
                <div>
                    <p className={`font-semibold ${log.type === 'PENAMBAHAN' ? 'text-green-600' : 'text-red-600'}`}>
                    {log.type === 'PENAMBAHAN' ? '+' : '-'} Rp {log.amount.toLocaleString()}
                    </p>
                    <p className="font-medium text-gray-800">{log.app_name}</p>
                    <p className="text-gray-500">{log.description}</p>
                </div>
                <div className="text-right text-gray-500">
                    <p>{formatTime(log.created_at)}</p>
                    <p>{formatDate(log.created_at)}</p>
                </div>
                </div>
            </div>
            ))}
        </div>
        <DialogFooter>
            <Button onClick={() => onOpenChange(false)} variant="outline" size="sm">Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};