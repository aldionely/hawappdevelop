import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TransactionHistoryDialog } from '@/components/shared/TransactionHistoryDialog';
import { appBalanceKeysAndNames } from '@/components/worker/StartShiftForm';

const AppBalancesDisplay = ({ balances }) => {
  if (!balances || Object.keys(balances).length === 0) {
    return <p className="text-xs text-gray-500 mt-1">Saldo aplikasi tidak tersedia.</p>;
  }
  return (
    <div className="mt-2 pt-2 border-t">
      <h5 className="text-xs font-semibold mb-1">Saldo Aplikasi:</h5>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs">
        {appBalanceKeysAndNames.map(({ key, name }) => (
          balances[key] !== undefined && (
            <div key={key} className="p-1 bg-gray-50 rounded">
              <span className="text-gray-600">{name}: </span>
              <span className={`font-medium ${balances[key] < 0 ? 'text-red-600' : ''}`}>Rp {(balances[key] || 0).toLocaleString()}</span>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

const ActiveShiftItem = ({ shift }) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  
  const kasAwal = shift.kasAwal || shift.kasawal || 0;
  const totalIn = shift.totalIn || shift.totalin || 0;
  const totalOut = shift.totalOut || shift.totalout || 0;
  const totalAdminFee = shift.totalAdminFee || shift.totaladminfee || 0;
  const uangTransaksi = totalIn - totalOut;
  const currentBalance = kasAwal + uangTransaksi;
  
  const recentTransactions = (shift.transactions || []).slice(-3).reverse();

  return (
    <div
      className="p-2 sm:p-3 border rounded-lg bg-white"
    >
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsDetailsOpen(!isDetailsOpen)}
      >
        <div className="flex-1">
          <h3 className="font-semibold text-xs sm:text-sm">{shift.workerName || shift.workername}</h3>
          <p className="text-xs text-gray-500">
            Lokasi: {shift.lokasi || '-'} | Mulai: {new Date(shift.startTime || shift.starttime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </p>
           <p className={`text-xs font-semibold ${uangTransaksi >= 0 ? 'text-sky-600' : 'text-red-600'}`}>
              Uang Transaksi: Rp {uangTransaksi.toLocaleString()}
            </p>
        </div>
        <div className="flex items-center">
          <p className="text-xs sm:text-sm font-medium mr-2 sm:mr-3">
            Aktual Kas: Rp {currentBalance.toLocaleString()}
          </p>
          {isDetailsOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-2 text-xs">
        <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg">
          <p>Kas Awal</p>
          <p className="font-semibold">Rp {kasAwal.toLocaleString()}</p>
        </div>
        <div className="p-1.5 sm:p-2 bg-green-50 rounded-lg">
          <p>Uang Masuk</p>
          <p className="font-semibold text-green-600">Rp {totalIn.toLocaleString()}</p>
        </div>
        <div className="p-1.5 sm:p-2 bg-red-50 rounded-lg">
          <p>Uang Keluar</p>
          <p className="font-semibold text-red-600">Rp {totalOut.toLocaleString()}</p>
        </div>
         <div className="p-1.5 sm:p-2 bg-purple-50 rounded-lg">
          <p>Total Admin</p>
          <p className="font-semibold text-purple-600">Rp {totalAdminFee.toLocaleString()}</p>
        </div>
      </div>

      {isDetailsOpen && (
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t">
          <AppBalancesDisplay balances={shift.app_balances} />
          <h4 className="text-xs font-semibold mb-1.5 sm:mb-2 mt-2">3 Transaksi Terkini:</h4>
          {recentTransactions.length > 0 ? (
            <div className="space-y-1 sm:space-y-1.5">
              {recentTransactions.map((tx) => {
                const totalFee = (tx.adminFee || 0) + (tx.productAdminFee || 0);
                return (
                <div key={tx.id} className="text-xs flex justify-between items-center border-b pb-1 last:border-b-0">
                  <div>
                    <p className="font-medium">{tx.description}</p>
                    <p className="text-gray-500 text-xs">
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                      {totalFee > 0 && <span className="text-purple-500 ml-1">(Adm: Rp {totalFee.toLocaleString()})</span>}
                    </p>
                  </div>
                  <p className={tx.type === "in" ? "text-green-600" : "text-red-600"}>
                    {tx.type === "in" ? "+" : "-"} Rp {tx.amount.toLocaleString()}
                  </p>
                </div>
              )})}
               {(shift.transactions || []).length > 3 && (
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-xs h-auto p-0 mt-1" 
                  onClick={() => setShowAllTransactions(true)}
                >
                  Lihat Semua Transaksi ({(shift.transactions || []).length})
                </Button>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center py-2">Belum ada transaksi.</p>
          )}
        </div>
      )}
      <TransactionHistoryDialog 
        isOpen={showAllTransactions}
        onOpenChange={setShowAllTransactions}
        transactions={shift.transactions || []}
        shiftDetails={{
          workerName: shift.workerName || shift.workername, 
          startTime: shift.startTime || shift.starttime, 
          lokasi: shift.lokasi,
          app_balances: shift.app_balances
        }}
        showDownloadButton={true}
      />
    </div>
  );
};

export const ActiveShiftsList = ({ activeShifts }) => {
  if (!Array.isArray(activeShifts)) {
    return <p className="text-center text-gray-500 py-6 sm:py-8 text-xs sm:text-sm">Memuat data shift aktif...</p>;
  }
  return (
    <div className="space-y-3 sm:space-y-4">
      {activeShifts.length > 0 ? (
        activeShifts.map((shift) => (
          <ActiveShiftItem key={shift.id || shift.username} shift={shift} />
        ))
      ) : (
        <p className="text-center text-gray-500 py-6 sm:py-8 text-xs sm:text-sm">Tidak ada shift aktif saat ini</p>
      )}
    </div>
  );
};