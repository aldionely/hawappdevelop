import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';
import { downloadShiftReport } from '@/lib/downloadHelper';
import { appBalanceKeysAndNames } from '@/lib/shiftConstants';

const AppBalancesReportDisplay = ({ balances }) => {
  if (!balances || Object.keys(balances).length === 0) {
    return null;
  }
  const relevantBalances = appBalanceKeysAndNames.filter(({key}) => balances[key] !== undefined);

  return (
    <div className="mt-2 pt-2 border-t">
      <h4 className="font-semibold mb-1">Saldo Aplikasi (Akhir Shift):</h4>
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 p-2 bg-gray-50 rounded">
        {relevantBalances.map(({ key, name }) => (
          <React.Fragment key={key}>
            <div>{name}:</div>
            <div className="font-semibold text-right">Rp {(balances[key] || 0).toLocaleString()}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};


export const ShiftReportDialog = ({ shift, isOpen, onOpenChange, showDownloadButton = false }) => {
  if (!shift) return null;

  const handleDownload = () => {
    downloadShiftReport(shift);
  };

  // --- PERUBAHAN DI SINI: Kalkulasi Admin Kotor ---
  const netAdminFee = shift.totalAdminFee || shift.totaladminfee || 0;
  const uangMakan = shift.uang_makan || 0;
  const grossAdminFee = netAdminFee - uangMakan;
  // --- AKHIR PERUBAHAN ---

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Laporan Akhir Shift</DialogTitle>
          <DialogDescription className="text-xs">
            Pekerja: {shift.workerName || shift.workername} <br />
            Lokasi: {shift.lokasi || '-'} <br />
            Waktu: {new Date(shift.startTime || shift.starttime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short', hour12: false })} - {new Date(shift.endTime || shift.endtime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short', hour12: false })}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto p-1 pr-2 text-xs space-y-2">
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 p-2 bg-gray-50 rounded">
            <div>Kas Awal:</div><div className="font-semibold text-right">Rp {(shift.kasAwal || shift.kasawal || 0).toLocaleString()}</div>
            <div>Total Uang Masuk:</div><div className="font-semibold text-right text-green-600">Rp {(shift.totalIn || shift.totalin || 0).toLocaleString()}</div>
            <div>Total Uang Keluar:</div><div className="font-semibold text-right text-red-600">Rp {(shift.totalOut || shift.totalout || 0).toLocaleString()}</div> 
            <div>Uang Transaksi:</div><div className="font-semibold text-right text-sky-600">Rp {(shift.uangTransaksi || shift.uangtransaksi || 0).toLocaleString()}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 p-2 bg-gray-50 rounded">
            <div>Total Uang Seharusnya:</div><div className="font-semibold text-right">Rp {(shift.expectedBalance || shift.expectedbalance || 0).toLocaleString()}</div>
            <div>Uang Aktual di Tangan:</div><div className="font-semibold text-right">Rp {(shift.kasAkhir || shift.kasakhir || 0).toLocaleString()}</div>
            <div>Selisih:</div>
            <div className={`font-semibold text-right ${(shift.selisih || 0) === 0 ? '' : (shift.selisih || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
              Rp {Math.abs(shift.selisih || 0).toLocaleString()} {(shift.selisih || 0) === 0 ? '(Sesuai)' : (shift.selisih || 0) > 0 ? '(Lebih)' : '(Kurang)'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1 p-2 bg-gray-50 rounded">
          <div>Total Admin Kotor:</div><div className="font-semibold text-right text-purple-600">Rp {netAdminFee.toLocaleString()}</div>
          {(uangMakan > 0) && (
            <React.Fragment>
              <div>Uang Makan:</div><div className="font-semibold text-right text-red-600">Rp {uangMakan.toLocaleString()}</div>
            </React.Fragment>
          )}
          <div>Total Akhir Admin:</div><div className="font-semibold text-right text-purple-600">Rp {grossAdminFee.toLocaleString()}</div>
          {/* --- AKHIR PERUBAHAN --- */}
          </div>

           <div className="p-2 bg-gray-50 rounded">
            <div>Jumlah Transaksi:</div><div className="font-semibold text-right">{shift.transactions ? shift.transactions.length : 0}</div>
          </div>

          <AppBalancesReportDisplay balances={shift.app_balances} />
          


          {shift.informasi_admin && (
            <div className="pt-2">
              <h4 className="font-semibold mb-1">Informasi untuk Admin:</h4>
              <p className="whitespace-pre-wrap p-2 bg-yellow-50 rounded text-yellow-800">{shift.informasi_admin}</p>
            </div>
          )}

          {shift.notes && (
            <div className="pt-2">
              <h4 className="font-semibold mb-1">Catatan Akhir Shift:</h4>
              <p className="whitespace-pre-wrap p-2 bg-gray-50 rounded">{shift.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter className="justify-between">
          {showDownloadButton && (
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="h-3 w-3 mr-1.5" />
              Download Laporan
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)} variant="outline" size="sm" className={!showDownloadButton ? 'ml-auto' : ''}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};