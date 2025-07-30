import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TransactionHistoryDialog } from '@/components/shared/TransactionHistoryDialog';
import { BalanceHistoryDialog } from '@/components/shared/BalanceHistoryDialog';
import { appBalanceKeysAndNames } from '@/lib/shiftConstants';
import { useData } from '@/contexts/DataContext';
import { calculateProductAdminFee } from '@/lib/productAndBalanceHelper'; // Import helper

const AppBalancesDisplay = ({ balances, onShowHistory }) => {
  if (!balances || Object.keys(balances).length === 0) {
    return <p className="text-xs text-gray-500 mt-1">Saldo aplikasi tidak tersedia.</p>;
  }
  return (
    <div className="mt-2 pt-2 border-t">
      <div className="flex justify-between items-center mb-1">
          <h5 className="text-xs font-semibold">Saldo Aplikasi:</h5>
          <Button variant="link" size="sm" className="h-auto p-0 text-xs text-blue-600" onClick={onShowHistory}>
              <ListChecks size={12} className="mr-1"/>
              Lihat Riwayat Saldo
          </Button>
      </div>
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

const ActiveShiftItem = ({ shift, products }) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showBalanceHistory, setShowBalanceHistory] = useState(false);
  
  const kasAwal = shift.kasAwal || shift.kasawal || 0;
  const totalIn = shift.totalIn || shift.totalin || 0;
  const totalOut = shift.totalOut || shift.totalout || 0;
  const totalAdminFee = shift.totalAdminFee || shift.totaladminfee || 0;
  const uangTransaksi = totalIn - totalOut;
  const currentBalance = kasAwal + uangTransaksi;
  const recentTransactions = (shift.transactions || []).slice(-3).reverse();

  const totalInitialAppBalance = Object.values(shift.initial_app_balances || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
  const totalCurrentAppBalance = Object.values(shift.app_balances || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);

  const { totalAppIn, totalAppOut } = useMemo(() => {
    let appIn = 0;
    let appOut = 0;
    (shift.transactions || []).forEach(tx => {
        if (tx.type === 'out' && tx.saldoMasukAplikasi > 0) {
            appIn += tx.saldoMasukAplikasi;
        }
        if (tx.type === 'in' && tx.saldoKeluarAplikasi > 0) {
            appOut += tx.saldoKeluarAplikasi;
        }
        const productDetails = calculateProductAdminFee(tx, products);
        if (productDetails && productDetails.relatedAppKey) {
            const specialKeys = ['BERKAT', 'RITA', 'ISIMPEL', 'SIDOMPUL', 'DIGIPOS'];
            if (specialKeys.includes(productDetails.relatedAppKey.toUpperCase())) {
                appOut += productDetails.costPrice || 0;
            } else {
                appOut += productDetails.fee > 0 ? productDetails.fee : 0;
            }
        }
    });
    return { totalAppIn: appIn, totalAppOut: appOut };
  }, [shift.transactions, products]);


  return (
    <div className="p-3 border rounded-lg bg-white">
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsDetailsOpen(!isDetailsOpen)}
      >
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{shift.workerName || shift.workername}</h3>
          <p className="text-xs text-gray-500">
            Lokasi: {shift.lokasi || '-'} | Mulai: {new Date(shift.startTime || shift.starttime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </p>
        </div>
        <div className="flex items-center">
            {isDetailsOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
      </div>
      
      {/* --- PENAMBAHAN JUDUL "ARUS UANG" --- */}
      <div className="mt-3 pt-3 border-t">
        <h4 className="text-sm font-semibold mb-2 text-center text-gray-700">Arus Uang</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">Kas Awal</p>
                <p className="font-bold text-sm text-blue-900">Rp {kasAwal.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
                <p className="text-xs text-green-800">Uang Masuk</p>
                <p className="font-bold text-sm text-green-900">Rp {totalIn.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg">
                <p className="text-xs text-purple-800">Total Admin</p>
                <p className="font-bold text-sm text-purple-900">Rp {totalAdminFee.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
                <p className="text-xs text-gray-800">Aktual Kas</p>
                <p className="font-bold text-sm text-gray-900">Rp {currentBalance.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-red-50 rounded-lg">
                <p className="text-xs text-red-800">Uang Keluar</p>
                <p className="font-bold text-sm text-red-900">Rp {totalOut.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-sky-50 rounded-lg">
                <p className="text-xs text-sky-800">Uang Transaksi</p>
                <p className="font-bold text-sm text-sky-900">Rp {uangTransaksi.toLocaleString()}</p>
            </div>
        </div>
      </div>

      {/* --- PENAMBAHAN JUDUL "ARUS SALDO" --- */}
      <div className="mt-3 pt-3 border-t">
        <h4 className="text-sm font-semibold mb-2 text-center text-gray-700">Arus Saldo</h4>
        <div className="grid grid-cols-2 gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
                <p className="text-xs text-indigo-800">Total Saldo App Awal</p>
                <p className="font-bold text-sm text-indigo-900">Rp {totalInitialAppBalance.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-teal-50 rounded-lg">
                <p className="text-xs text-teal-800">Total Saldo App Saat Ini</p>
                <p className="font-bold text-sm text-teal-900">Rp {totalCurrentAppBalance.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg col-span-1">
                <p className="text-xs text-green-800">Saldo App Masuk</p>
                <p className="font-bold text-sm text-green-900">Rp {totalAppIn.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-red-50 rounded-lg col-span-1">
                <p className="text-xs text-red-800">Saldo App Keluar</p>
                <p className="font-bold text-sm text-red-900">Rp {totalAppOut.toLocaleString()}</p>
            </div>
        </div>
      </div>

      {isDetailsOpen && (
        <div className="mt-3 pt-3 border-t">
          <AppBalancesDisplay balances={shift.app_balances} onShowHistory={() => setShowBalanceHistory(true)} />
          <h4 className="text-xs font-semibold mb-1.5 sm:mb-2 mt-2">3 Transaksi Terkini:</h4>
          {recentTransactions.length > 0 ? (
            <div className="space-y-1.5">
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
        shiftDetails={shift}
        showDownloadButton={true}
      />
      <BalanceHistoryDialog
        isOpen={showBalanceHistory}
        onOpenChange={setShowBalanceHistory}
        shift={shift}
        products={products}
      />
    </div>
  );
};

export const ActiveShiftsList = ({ activeShifts }) => {
  const { products } = useData();

  if (!Array.isArray(activeShifts)) {
    return <p className="text-center text-gray-500 py-6 sm:py-8 text-xs sm:text-sm">Memuat data shift aktif...</p>;
  }
  return (
    <div className="space-y-3 sm:space-y-4">
      {activeShifts.length > 0 ? (
        activeShifts.map((shift) => (
          <ActiveShiftItem key={shift.id || shift.username} shift={shift} products={products} />
        ))
      ) : (
        <p className="text-center text-gray-500 py-6 sm:py-8 text-xs sm:text-sm">Tidak ada shift aktif saat ini</p>
      )}
    </div>
  );
};