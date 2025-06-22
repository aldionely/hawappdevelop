import React, { useState } from 'react';
// BARU: Tambahkan ListChecks
import { ChevronDown, ChevronRight, Trash2, Eye, FileText, Download, Ticket, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { TransactionHistoryDialog } from '@/components/shared/TransactionHistoryDialog';
import { ShiftReportDialog } from '@/components/worker/ShiftReportDialog';
import { downloadTransactions, downloadVoucherStockReport } from '@/lib/downloadHelper'; 
import { useData } from '@/contexts/DataContext';
import { AppBalancesDisplay } from '@/components/worker/AppBalancesDisplay';
// BARU: Impor komponen dialog yang sudah kita buat
import { BalanceHistoryDialog } from '@/components/shared/BalanceHistoryDialog'; 

const ArchivedShiftItem = ({ shift }) => {
  const [showTransactions, setShowTransactions] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  // BARU: State untuk mengontrol dialog riwayat saldo
  const [showBalanceHistory, setShowBalanceHistory] = useState(false); 
  const { toast } = useToast();
  // DIUBAH: Tambahkan 'products' ke dalam data yang diambil
  const { removeShiftArchive, initialAppBalances, vouchers, products } = useData();

  const handleDelete = async () => {
    const result = await removeShiftArchive(shift.id);
    if (result.success) {
      toast({
        title: "Shift Dihapus",
        description: `Arsip shift untuk ${shift.workerName || shift.workername} pada ${new Date(shift.startTime || shift.starttime).toLocaleDateString()} telah dihapus.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Gagal Menghapus",
        description: result.error || "Terjadi kesalahan saat menghapus arsip.",
      });
    }
  };
  
  const handleDownloadVoucherReport = () => {
    downloadVoucherStockReport(shift, vouchers, true);
  };

  const uangTransaksi = shift.uangTransaksi || shift.uangtransaksi || 0;
  const kasAwal = shift.kasAwal || shift.kasawal || 0;
  const kasAkhir = shift.kasAkhir || shift.kasakhir || 0;
  const totalIn = shift.totalIn || shift.totalin || 0;
  const totalOut = shift.totalOut || shift.totalout || 0;
  const totalAdminFee = shift.totalAdminFee || shift.totaladminfee || 0;
  const selisih = shift.selisih || 0;
  const appBalances = shift.app_balances || initialAppBalances;


  return (
    <div
      className="p-2 sm:p-3 border rounded-lg bg-white mb-2"
    >
       <div className="flex justify-between items-start">
        <div className="flex-1 cursor-pointer" onClick={() => setIsDetailsOpen(!isDetailsOpen)}>
            <p className="text-xs text-gray-500">
                {new Date(shift.startTime || shift.starttime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short', hour12: false })} - 
                {new Date(shift.endTime || shift.endtime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short', hour12: false })}
            </p>
            <p className="text-xs text-gray-500">Lokasi: {shift.lokasi || '-'}</p>
            <p className={`text-xs font-semibold ${uangTransaksi >= 0 ? 'text-sky-600' : 'text-red-600'}`}>
                Uang Transaksi: Rp {uangTransaksi.toLocaleString()}
            </p>
        </div>
        <div className="flex items-center space-x-1">
           <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-indigo-600" onClick={() => setShowReport(true)} title="Lihat Laporan Akhir">
            <FileText size={14} />
          </Button>
          {/* BARU: Tombol untuk menampilkan riwayat saldo */}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-cyan-600" onClick={() => setShowBalanceHistory(true)} title="Riwayat Saldo App">
            <ListChecks size={14} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-blue-600" onClick={() => setShowTransactions(true)} title="Lihat Transaksi">
            <Eye size={14} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-green-600" onClick={() => downloadTransactions(shift, shift.workerName || shift.workername)} title="Download Transaksi">
            <Download size={14} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-orange-600" onClick={handleDownloadVoucherReport} title="Download Laporan Voucher">
            <Ticket size={14} />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-red-600" title="Hapus Arsip">
                <Trash2 size={14} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini akan menghapus arsip shift secara permanen. Data tidak dapat dikembalikan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Hapus</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
           <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500" onClick={() => setIsDetailsOpen(!isDetailsOpen)}>
             {isDetailsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
           </Button>
        </div>
      </div>
      
      {isDetailsOpen && (
        <div className="mt-2 pt-2 border-t">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3 text-xs">
              <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg">
              <p>Kas Awal</p>
              <p className="font-semibold">Rp {kasAwal.toLocaleString()}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-purple-50 rounded-lg">
              <p>Kas Akhir Aktual</p>
              <p className="font-semibold">Rp {kasAkhir.toLocaleString()}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-green-50 rounded-lg">
              <p>Uang Masuk</p>
              <p className="font-semibold text-green-600">Rp {totalIn.toLocaleString()}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-red-50 rounded-lg">
              <p>Uang Keluar</p>
              <p className="font-semibold text-red-600">Rp {totalOut.toLocaleString()}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-indigo-50 rounded-lg">
              <p>Total Admin</p>
              <p className="font-semibold text-indigo-600">Rp {totalAdminFee.toLocaleString()}</p>
              </div>
          </div>
          <div className={`p-1.5 sm:p-2 rounded-lg text-xs ${selisih === 0 ? 'bg-gray-100 text-gray-700' : selisih > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <p>Selisih Kas</p>
              <p className={`font-semibold`}>
              Rp {Math.abs(selisih).toLocaleString()}
              {selisih === 0 ? ' (Sesuai)' : selisih > 0 ? ' (Lebih)' : ' (Kurang)'}
              </p>
          </div>
           {shift.notes && (
              <div className="mt-2 pt-2 border-t">
              <p className="text-xs font-semibold">Catatan:</p>
              <p className="text-xs text-gray-600 whitespace-pre-wrap">{shift.notes}</p>
              </div>
          )}
          <div className="mt-2">
              <AppBalancesDisplay balances={appBalances} title="Saldo Aplikasi (Akhir Shift)" />
          </div>
        </div>
      )}

      <TransactionHistoryDialog 
        isOpen={showTransactions}
        onOpenChange={setShowTransactions}
        transactions={shift.transactions || []}
        shiftDetails={{
            workerName: shift.workerName || shift.workername, 
            startTime: shift.startTime || shift.starttime, 
            endTime: shift.endTime || shift.endtime, 
            lokasi: shift.lokasi,
            app_balances: appBalances
        }}
        isArchived={true}
        showDownloadButton={true}
      />
      <ShiftReportDialog
        shift={shift} 
        isOpen={showReport}
        onOpenChange={setShowReport}
        showDownloadButton={true}
      />
      {/* BARU: Render komponen dialog riwayat saldo */}
      <BalanceHistoryDialog
        isOpen={showBalanceHistory}
        onOpenChange={setShowBalanceHistory}
        shift={shift}
        products={products}
      />
    </div>
  );
};

const WorkerArchive = ({ worker, shifts }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { initialAppBalances } = useData();

  if (shifts.length === 0) {
    return null; 
  }

  const sortedShifts = shifts.sort((a, b) => new Date(b.endTime || b.endtime) - new Date(a.endTime || a.endtime));


  return (
    <div 
      className="p-2 sm:p-3 border rounded-lg bg-gray-50"
    >
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-semibold text-xs sm:text-sm">{worker.name} ({shifts.length} arsip)</h3>
        {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </div>
      
      {isOpen && (
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar">
          {sortedShifts.map(shift => (
            <ArchivedShiftItem 
              key={shift.id || shift.endTime || shift.endtime} 
              shift={{...shift, app_balances: shift.app_balances || initialAppBalances}} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const ArchivedShiftsList = ({ workers, shiftArchives }) => {
   if (!Array.isArray(workers) || !Array.isArray(shiftArchives)) {
    return <p className="text-center text-gray-500 py-6 sm:py-8 text-xs sm:text-sm">Memuat data arsip...</p>;
  }
  return (
    <div className="space-y-3 sm:space-y-4">
      {workers.length > 0 ? (
        workers.map(worker => {
          const workerShifts = shiftArchives.filter(archive => archive.username === worker.username);
          if (workerShifts.length === 0) return null;
          return <WorkerArchive key={worker.id || worker.username} worker={worker} shifts={workerShifts} />;
        }).filter(Boolean)
      ) : (
         <p className="text-center text-gray-500 py-6 sm:py-8 text-xs sm:text-sm">Belum ada user pekerja.</p>
      )}
      {workers.length > 0 && shiftArchives.length === 0 && (
         <p className="text-center text-gray-500 py-6 sm:py-8 text-xs sm:text-sm">Belum ada arsip shift untuk user manapun.</p>
      )}
    </div>
  );
};