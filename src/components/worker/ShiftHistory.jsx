import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, FileText, Download } from 'lucide-react';
import { TransactionHistoryDialog } from '@/components/shared/TransactionHistoryDialog';
import { ShiftReportDialog } from '@/components/worker/ShiftReportDialog';
import { downloadTransactions } from '@/lib/downloadHelper';

const ShiftHistoryItem = ({ shift }) => {
  const [showTransactions, setShowTransactions] = useState(false);
  const [showReport, setShowReport] = useState(false);

  return (
    <>
      <div
        className="p-2 sm:p-3 border rounded-lg bg-white"
      >
        <div className="flex justify-between items-start mb-2 sm:mb-3">
          <div>
            <p className="text-xs text-gray-500">
              {new Date(shift.startTime || shift.starttime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} - 
              {new Date(shift.endTime || shift.endtime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
            </p>
            <p className="text-xs text-gray-500">Lokasi: {shift.lokasi || '-'}</p>
             <p className={`text-xs font-semibold ${(shift.uangTransaksi || shift.uangtransaksi || 0) >= 0 ? 'text-sky-600' : 'text-red-600'}`}>
                Uang Transaksi: Rp {(shift.uangTransaksi || shift.uangtransaksi || 0).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-indigo-600" onClick={() => setShowReport(true)} title="Lihat Laporan Akhir">
              <FileText size={14} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-blue-600" onClick={() => setShowTransactions(true)} title="Lihat Transaksi">
              <Eye size={14} />
            </Button>
             <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-green-600" onClick={() => downloadTransactions(shift, shift.workerName || shift.workername)} title="Download Transaksi">
              <Download size={14} />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3 text-xs">
          <div className="p-1.5 sm:p-2 bg-blue-50 rounded-md">
            <p>Kas Awal</p>
            <p className="font-semibold">Rp {(shift.kasAwal || shift.kasawal || 0).toLocaleString()}</p>
          </div>
          <div className="p-1.5 sm:p-2 bg-purple-50 rounded-md">
            <p>Kas Akhir Aktual</p>
            <p className="font-semibold">Rp {(shift.kasAkhir || shift.kasakhir || 0).toLocaleString()}</p>
          </div>
          <div className="p-1.5 sm:p-2 bg-green-50 rounded-md">
            <p>Uang Masuk</p>
            <p className="font-semibold text-green-600">Rp {(shift.totalIn || shift.totalin || 0).toLocaleString()}</p>
          </div>
          <div className="p-1.5 sm:p-2 bg-red-50 rounded-md">
            <p>Uang Keluar</p>
            <p className="font-semibold text-red-600">Rp {(shift.totalOut || shift.totalout || 0).toLocaleString()}</p>
          </div>
        </div>
        <div className={`p-1.5 sm:p-2 rounded-md text-xs ${(shift.selisih || 0) === 0 ? 'bg-gray-100 text-gray-700' : (shift.selisih || 0) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          <p>Selisih Kas</p>
          <p className={`font-semibold`}>
            Rp {Math.abs(shift.selisih || 0).toLocaleString()}
            {(shift.selisih || 0) === 0 ? ' (Sesuai)' : (shift.selisih || 0) > 0 ? ' (Lebih)' : ' (Kurang)'}
          </p>
        </div>
         {shift.notes && (
          <div className="mt-2 pt-2 border-t">
            <p className="text-xs font-semibold">Catatan:</p>
            <p className="text-xs text-gray-600 whitespace-pre-wrap">{shift.notes}</p>
          </div>
        )}
      </div>
      <TransactionHistoryDialog 
        isOpen={showTransactions}
        onOpenChange={setShowTransactions}
        transactions={shift.transactions || []}
        shiftDetails={{
          workerName: shift.workerName || shift.workername, 
          startTime: shift.startTime || shift.starttime, 
          endTime: shift.endTime || shift.endtime, 
          lokasi: shift.lokasi
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
    </>
  );
};


export const ShiftHistory = ({ shifts }) => {
  if (!shifts || shifts.length === 0) {
    return <p className="text-center text-gray-500 py-6 sm:py-8 text-xs sm:text-sm">Belum ada riwayat shift.</p>;
  }

  return (
    <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
      <h2 className="text-md sm:text-lg font-semibold mb-2 sm:mb-3">Riwayat Shift Anda</h2>
      {shifts.map((shift) => ( 
        <ShiftHistoryItem key={shift.id || shift.endTime || shift.endtime} shift={shift} />
      ))}
    </div>
  );
};