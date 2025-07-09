import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search } from 'lucide-react';
import { downloadTransactions } from '@/lib/downloadHelper';


export const TransactionHistoryDialog = ({ isOpen, onOpenChange, transactions, shiftDetails, isArchived = false, showDownloadButton = false }) => {
  
  const [searchTerm, setSearchTerm] = useState('');

  const handleDownload = () => {
    if (shiftDetails) {
      const shiftDataForDownload = {
        ...shiftDetails,
        transactions: transactions
      };
      downloadTransactions(shiftDataForDownload, shiftDetails.workerName);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString([], { dateStyle: 'medium' });
  };

  // --- BLOK LOGIKA YANG DIPERBARUI ---
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (!searchTerm.trim()) {
      return transactions;
    }
    
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    
    // Coba ubah input menjadi angka (setelah menghapus titik/pemisah ribuan)
    const searchNumber = parseInt(lowercasedSearchTerm.replace(/\./g, ''), 10);
    const isNumericSearch = !isNaN(searchNumber);

    return transactions.filter(tx => {
      // Jika input adalah angka, cari berdasarkan nominal
      if (isNumericSearch) {
        return tx.amount === searchNumber;
      }
      // Jika bukan angka, cari berdasarkan deskripsi
      else {
        return tx.description.toLowerCase().includes(lowercasedSearchTerm);
      }
    });
  }, [transactions, searchTerm]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Riwayat Transaksi Lengkap</DialogTitle>
          {shiftDetails && (
            <DialogDescription className="text-xs">
              Shift: {shiftDetails.workerName} <br/>
              Lokasi: {shiftDetails.lokasi || '-'} <br/>
              Mulai: {formatDate(shiftDetails.startTime)} {formatTime(shiftDetails.startTime)}
              {isArchived && shiftDetails.endTime && (
                <> | Selesai: {formatDate(shiftDetails.endTime)} {formatTime(shiftDetails.endTime)}</>
              )}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="relative my-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                // Ubah placeholder untuk memberi tahu pengguna
                placeholder="Cari deskripsi atau nominal..."
                className="w-full pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        <div className="flex-grow overflow-y-auto p-1 pr-2">
          {filteredTransactions && filteredTransactions.length > 0 ? (
            <div className="space-y-2">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="text-xs flex justify-between items-start border-b pb-1.5 last:border-b-0">
                  <div>
                    <p className="font-medium">{tx.description}</p>
                    <p className="text-gray-500">
                      {formatTime(tx.timestamp)} - {formatDate(tx.timestamp)}
                       {tx.adminFee > 0 && <span className="text-purple-600 ml-1">(Admin: Rp {tx.adminFee.toLocaleString()})</span>}
                    </p>
                  </div>
                  <p className={`font-semibold ${tx.type === "in" ? "text-green-600" : "text-red-600"}`}>
                    {tx.type === "in" ? "+" : "-"} Rp {tx.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center py-4">
              {searchTerm ? `Tidak ada transaksi yang cocok dengan "${searchTerm}".` : "Belum ada transaksi."}
            </p>
          )}
        </div>
        <DialogFooter className="justify-between">
          {showDownloadButton && transactions && transactions.length > 0 && (
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="h-3 w-3 mr-1.5" />
              Download Transaksi
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)} variant="outline" size="sm" className={!showDownloadButton || !transactions || transactions.length === 0  ? 'ml-auto' : ''}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};