import React, { useState, useMemo } from 'react';
import { Trash2, Eye, FileText, Download, Ticket, ListChecks, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { TransactionHistoryDialog } from '@/components/shared/TransactionHistoryDialog';
import { ShiftReportDialog } from '@/components/worker/ShiftReportDialog';
import { BalanceHistoryDialog } from '@/components/shared/BalanceHistoryDialog';
import { downloadTransactions, downloadVoucherStockReport } from '@/lib/downloadHelper';
import { useData } from '@/contexts/DataContext';
import { formatDateTime } from '@/lib/utils';
import { calculateProductAdminFee } from '@/lib/productAndBalanceHelper';

// Komponen untuk Konten Dialog Rincian Stok
const VoucherStockDetailsDialog = ({ shift, details, isOpen, onOpenChange }) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Rincian Stok Voucher</DialogTitle>
          <DialogDescription>
            Mencocokkan stok untuk shift {shift?.workerName} pada {formatDateTime(shift?.startTime).date}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 pr-2 py-2 max-h-[60vh] overflow-y-auto">
          {details.length > 0 ? details.map(item => (
            <div key={item.name} className={`p-3 rounded-md text-sm ${item.discrepancy !== 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <p className={`font-bold ${item.discrepancy !== 0 ? 'text-red-800' : 'text-green-800'}`}>{item.name}</p>
              <div className="grid grid-cols-2 gap-x-4 mt-1">
                <span>Stok Awal: {item.initial}</span>
                <span>Terjual Tercatat: {item.sold}</span>
                <span>Stok Seharusnya: {item.expected}</span>
                <span>Stok Akhir Fisik: {item.final}</span>
              </div>
              {item.discrepancy !== 0 && (
                <p className="font-bold text-red-700 border-t border-red-200 mt-2 pt-2">
                  Selisih: {item.discrepancy}
                </p>
              )}
            </div>
          )) : (
            <p className="text-center text-gray-500 py-4">Tidak ada data stok voucher untuk shift ini.</p>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Tutup</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
  </Dialog>
);


const ArchivedShiftItem = React.memo(({ shift, products, vouchers, onShowReport, onShowBalanceHistory, onShowTransactions, onDownloadVoucher, onDelete, onShowStockDetails }) => {
  const selisih = shift.selisih || 0;
  const kasAwal = shift.kasAwal || 0;
  const kasAkhir = shift.kasAkhir || 0;
  const totalIn = shift.totalIn || 0;
  const totalOut = shift.totalOut || 0;
  const netAdminFee = shift.totalAdminFee || 0;

  const totalInitialAppBalance = Object.values(shift.initial_app_balances || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
  const totalFinalAppBalance = Object.values(shift.app_balances || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);

  const { totalAppIn, totalAppOut } = useMemo(() => {
    let appIn = 0;
    let appOut = 0;
    (shift.transactions || []).forEach(tx => {
        if (tx.type === 'out' && tx.saldoMasukAplikasi > 0) appIn += tx.saldoMasukAplikasi;
        if (tx.type === 'in' && tx.saldoKeluarAplikasi > 0) appOut += tx.saldoKeluarAplikasi;
        
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

  const voucherStockDetails = useMemo(() => {
    if (!shift.initial_voucher_stock || !vouchers) return [];
    const details = [];
    const salesCount = (shift.transactions || [])
      .filter(tx => tx.id && tx.id.includes('tx_vcr'))
      .reduce((acc, tx) => {
        acc[tx.description] = (acc[tx.description] || 0) + 1;
        return acc;
      }, {});

    for (const voucherId in shift.initial_voucher_stock) {
      const voucherInfo = vouchers.find(v => v.id === voucherId);
      if (voucherInfo) {
        const initialStock = shift.initial_voucher_stock[voucherId] || 0;
        const sold = salesCount[voucherInfo.name] || 0;
        const expectedStock = initialStock - sold;
        const finalStock = shift.final_voucher_stock ? (shift.final_voucher_stock[voucherId] ?? 0) : 0;
        const discrepancy = finalStock - expectedStock;

        details.push({
          name: voucherInfo.name,
          initial: initialStock, sold, expected: expectedStock,
          final: finalStock, discrepancy,
        });
      }
    }
    return details.sort((a, b) => a.name.localeCompare(b.name));
  }, [shift, vouchers]);
  
  const totalDiscrepancies = voucherStockDetails.filter(v => v.discrepancy !== 0).length;

  return (
    <div className="p-4 border rounded-lg bg-gray-50 mb-3 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-bold text-sm text-gray-800">{shift.workerName}</p>
          <p className="text-xs text-gray-500">{formatDateTime(shift.startTime).time} - {formatDateTime(shift.endTime).time}</p>
        </div>
        <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-indigo-600" onClick={() => onShowReport(shift)} title="Laporan Akhir"><FileText size={14} /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-cyan-600" onClick={() => onShowBalanceHistory(shift)} title="Riwayat Saldo App"><ListChecks size={14} /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-blue-600" onClick={() => onShowTransactions(shift)} title="Riwayat Transaksi"><Eye size={14} /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-green-600" onClick={() => downloadTransactions(shift, shift.workerName)} title="Unduh Transaksi"><Download size={14} /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-orange-600" onClick={() => onDownloadVoucher(shift)} title="Unduh Laporan Voucher"><Ticket size={14} /></Button>
            <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-red-600" title="Hapus"><Trash2 size={14} /></Button></AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Hapus Arsip?</AlertDialogTitle><AlertDialogDescription>Yakin ingin menghapus arsip ini?</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(shift.id)} className="bg-red-600">Hapus</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>
      
      <div className="pt-2">
        <h4 className="text-sm font-semibold mb-2 text-center text-gray-700">Arus Uang</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><p className="text-xs text-blue-800">Kas Awal</p><p className="font-bold text-sm text-blue-900">Rp {kasAwal.toLocaleString()}</p></div>
            <div className="p-2 bg-green-50 rounded-lg"><p className="text-xs text-green-800">Uang Masuk</p><p className="font-bold text-sm text-green-900">Rp {totalIn.toLocaleString()}</p></div>
            <div className="p-2 bg-purple-50 rounded-lg"><p className="text-xs text-purple-800">Total Final Admin</p><p className="font-bold text-sm text-purple-900">Rp {netAdminFee.toLocaleString()}</p></div>
            <div className="p-2 bg-gray-100 rounded-lg"><p className="text-xs text-gray-800">Kas Akhir</p><p className="font-bold text-sm text-gray-900">Rp {kasAkhir.toLocaleString()}</p></div>
            <div className="p-2 bg-red-50 rounded-lg"><p className="text-xs text-red-800">Uang Keluar</p><p className="font-bold text-sm text-red-900">Rp {totalOut.toLocaleString()}</p></div>
            <div className={`p-2 rounded-lg font-semibold ${selisih === 0 ? 'bg-green-100 text-green-800' : selisih > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}><p className="text-xs">Selisih Kas</p><p className="text-sm">Rp {Math.abs(selisih).toLocaleString()} {selisih === 0 ? '(Sesuai)' : selisih > 0 ? '(Lebih)' : '(Kurang)'}</p></div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t">
        <h4 className="text-sm font-semibold mb-2 text-center text-gray-700">Arus Saldo</h4>
        <div className="grid grid-cols-2 gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg"><p className="text-xs text-indigo-800">Total Saldo App Awal</p><p className="font-bold text-sm text-indigo-900">Rp {totalInitialAppBalance.toLocaleString()}</p></div>
            <div className="p-2 bg-teal-50 rounded-lg"><p className="text-xs text-teal-800">Total Saldo App Akhir</p><p className="font-bold text-sm text-teal-900">Rp {totalFinalAppBalance.toLocaleString()}</p></div>
            <div className="p-2 bg-green-50 rounded-lg col-span-1"><p className="text-xs text-green-800">Saldo App Masuk</p><p className="font-bold text-sm text-green-900">Rp {totalAppIn.toLocaleString()}</p></div>
            <div className="p-2 bg-red-50 rounded-lg col-span-1"><p className="text-xs text-red-800">Saldo App Keluar</p><p className="font-bold text-sm text-red-900">Rp {totalAppOut.toLocaleString()}</p></div>
        </div>
      </div>

      {shift.notes && (<div className="mt-3 pt-3 border-t border-gray-200"><p className="text-xs font-semibold mb-1">Catatan Shift:</p><p className="text-xs text-gray-700 whitespace-pre-wrap bg-white p-2 border rounded-md">{shift.notes}</p></div>)}
      
      {voucherStockDetails.length > 0 && (
         <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onShowStockDetails(shift.id)}
            className={`w-full mt-3 text-xs ${totalDiscrepancies > 0 ? 'border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700' : ''}`}
        >
          <Package size={14} className="mr-2"/>
          Lihat Rincian Stok Voucher ({totalDiscrepancies} Selisih)
        </Button>
      )}
    </div>
  );
});


export const ArchivedShiftsList = ({ workers, shiftArchives }) => {
    const { toast } = useToast();
    const { removeShiftArchive, vouchers, products } = useData();
    const [selectedLocation, setSelectedLocation] = useState('PIPITAN');
    const [selectedYear, setSelectedYear] = useState(''); 
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedDate, setSelectedDate] = useState('ALL');
    const [openAccordion, setOpenAccordion] = useState();
    
    // State diangkat ke komponen induk
    const [stockDetailsShiftId, setStockDetailsShiftId] = useState(null);

    const [dialogState, setDialogState] = useState({
      transactions: { isOpen: false, shift: null },
      report: { isOpen: false, shift: null },
      balanceHistory: { isOpen: false, shift: null },
    });

    // Logika untuk mendapatkan data dialog yang aktif
    const activeStockDetailsShift = useMemo(() => {
        if (!stockDetailsShiftId) return null;
        return shiftArchives.find(s => s.id === stockDetailsShiftId);
    }, [stockDetailsShiftId, shiftArchives]);

    const activeVoucherStockDetails = useMemo(() => {
      if (!activeStockDetailsShift || !activeStockDetailsShift.initial_voucher_stock || !vouchers) return [];
      const details = [];
      const salesCount = (activeStockDetailsShift.transactions || [])
        .filter(tx => tx.id && tx.id.includes('tx_vcr'))
        .reduce((acc, tx) => {
          acc[tx.description] = (acc[tx.description] || 0) + 1;
          return acc;
        }, {});
      for (const voucherId in activeStockDetailsShift.initial_voucher_stock) {
        const voucherInfo = vouchers.find(v => v.id === voucherId);
        if (voucherInfo) {
          const initialStock = activeStockDetailsShift.initial_voucher_stock[voucherId] || 0;
          const sold = salesCount[voucherInfo.name] || 0;
          const expectedStock = initialStock - sold;
          const finalStock = activeStockDetailsShift.final_voucher_stock ? (activeStockDetailsShift.final_voucher_stock[voucherId] ?? 0) : 0;
          const discrepancy = finalStock - expectedStock;
          details.push({ name: voucherInfo.name, initial: initialStock, sold, expected: expectedStock, final: finalStock, discrepancy });
        }
      }
      return details.sort((a, b) => a.name.localeCompare(b.name));
    }, [activeStockDetailsShift, vouchers]);


    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const filterOptions = useMemo(() => {
        const options = { years: new Set(), months: {}, dates: {} };
        if (!shiftArchives) return { years: [], months: {}, dates: {} };

        shiftArchives.filter(s => s.lokasi === selectedLocation).forEach(s => {
            const date = new Date(s.startTime);
            const year = date.getFullYear().toString();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');

            options.years.add(year);
            if (!options.months[year]) options.months[year] = new Set();
            options.months[year].add(month);
            
            const monthKey = `${year}-${month}`;
            if (!options.dates[monthKey]) options.dates[monthKey] = new Set();
            options.dates[monthKey].add(day);
        });

        return {
            years: Array.from(options.years).sort((a, b) => b - a),
            months: Object.keys(options.months).reduce((acc, year) => ({...acc, [year]: Array.from(options.months[year]).sort((a,b) => b-a) }), {}),
            dates: Object.keys(options.dates).reduce((acc, monthKey) => ({...acc, [monthKey]: Array.from(options.dates[monthKey]).sort((a,b) => parseInt(a) - parseInt(b)) }), {})
        };
    }, [shiftArchives, selectedLocation]);

    const groupedShifts = useMemo(() => {
        if (!selectedYear || !selectedMonth) return {};
        const filtered = shiftArchives.filter(shift => {
            if (shift.lokasi !== selectedLocation) return false;
            const date = new Date(shift.startTime);
            const yearMatch = date.getFullYear().toString() === selectedYear;
            const monthMatch = (date.getMonth() + 1).toString().padStart(2, '0') === selectedMonth;
            const dateMatch = selectedDate === 'ALL' || date.getDate().toString().padStart(2, '0') === selectedDate;
            return yearMatch && monthMatch && dateMatch;
        });
        return filtered.reduce((acc, shift) => {
            const date = new Date(shift.startTime);
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const dayOfMonth = date.getDate().toString().padStart(2, '0');
            const groupingKey = `${year}-${month}-${dayOfMonth}`;
            if (!acc[groupingKey]) acc[groupingKey] = [];
            acc[groupingKey].push(shift);
            return acc;
        }, {});
    }, [shiftArchives, selectedLocation, selectedYear, selectedMonth, selectedDate]);
    
    const sortedDates = Object.keys(groupedShifts).sort((a, b) => new Date(b) - new Date(a));
    
    const handleOpenDialog = (type, shift) => setDialogState(prev => ({ ...prev, [type]: { isOpen: true, shift }}));
    const handleCloseDialog = (type) => setDialogState(prev => ({ ...prev, [type]: { isOpen: false, shift: null }}));
    const handleDelete = async (shiftId) => {
      const result = await removeShiftArchive(shiftId);
      if (result.success) toast({ title: "Shift Dihapus" });
      else toast({ variant: "destructive", title: "Gagal Menghapus", description: result.error?.message });
    };
    const handleDownloadVoucher = (shift) => downloadVoucherStockReport(shift, vouchers, true);
    const handleYearChange = (year) => { setSelectedYear(year); setSelectedMonth(''); setSelectedDate('ALL'); setOpenAccordion(undefined); }
    const handleMonthChange = (month) => { setSelectedMonth(month); setSelectedDate('ALL'); setOpenAccordion(undefined); }
    const handleDateChange = (date) => { setSelectedDate(date); setOpenAccordion(undefined); }

    if (!Array.isArray(workers) || !Array.isArray(shiftArchives)) return <p className="text-center text-gray-500 py-8">Memuat data arsip...</p>;

    const LocationView = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Select value={selectedYear} onValueChange={handleYearChange}><SelectTrigger><SelectValue placeholder="Pilih Tahun..." /></SelectTrigger><SelectContent>{filterOptions.years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select>
                <Select value={selectedMonth} onValueChange={handleMonthChange} disabled={!selectedYear}><SelectTrigger><SelectValue placeholder="Pilih Bulan..." /></SelectTrigger><SelectContent>{(filterOptions.months[selectedYear] || []).map(m => <SelectItem key={m} value={m}>{monthNames[parseInt(m, 10) - 1]}</SelectItem>)}</SelectContent></Select>
                <Select value={selectedDate} onValueChange={handleDateChange} disabled={!selectedMonth}><SelectTrigger><SelectValue placeholder="Pilih Tanggal..." /></SelectTrigger><SelectContent><SelectItem value="ALL">Semua Tanggal</SelectItem>{(filterOptions.dates[`${selectedYear}-${selectedMonth}`] || []).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
            </div>
            {(!selectedYear || !selectedMonth) ? (<p className="text-center text-gray-500 py-8">Pilih tahun dan bulan untuk melihat arsip.</p>) : 
             sortedDates.length === 0 ? (<p className="text-center text-gray-500 py-8">Tidak ada data untuk periode ini.</p>) : 
             (<Accordion type="single" collapsible className="w-full space-y-3" value={openAccordion} onValueChange={setOpenAccordion}>
                {sortedDates.map(date => (
                    <AccordionItem value={date} key={date} className="border-b-0">
                        <AccordionTrigger className="p-4 border rounded-lg bg-white font-bold text-base hover:bg-gray-50 data-[state=open]:rounded-b-none">{new Date(date.replace(/-/g, '/')).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</AccordionTrigger>
                        <AccordionContent className="p-4 border border-t-0 rounded-b-lg bg-white/60">
                            {groupedShifts[date].map(shift => (
                                <ArchivedShiftItem 
                                  key={shift.id} 
                                  shift={shift} 
                                  products={products}
                                  vouchers={vouchers}
                                  onShowReport={() => handleOpenDialog('report', shift)}
                                  onShowBalanceHistory={() => handleOpenDialog('balanceHistory', shift)}
                                  onShowTransactions={() => handleOpenDialog('transactions', shift)}
                                  onDownloadVoucher={handleDownloadVoucher}
                                  onDelete={handleDelete}
                                  onShowStockDetails={setStockDetailsShiftId}
                                />
                            ))}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>)}
        </div>
    )

    return (
        <>
            <Tabs defaultValue="PIPITAN" className="w-full" onValueChange={setSelectedLocation}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="PIPITAN">PIPITAN</TabsTrigger>
                    <TabsTrigger value="SADIK">SADIK</TabsTrigger>
                </TabsList>
                <TabsContent value="PIPITAN" className="mt-4"><LocationView /></TabsContent>
                <TabsContent value="SADIK" className="mt-4"><LocationView /></TabsContent>
            </Tabs>

            <ShiftReportDialog 
              shift={dialogState.report.shift} 
              isOpen={dialogState.report.isOpen} 
              onOpenChange={() => handleCloseDialog('report')} 
              showDownloadButton={true} 
            />
            <TransactionHistoryDialog 
              isOpen={dialogState.transactions.isOpen}
              onOpenChange={() => handleCloseDialog('transactions')}
              transactions={dialogState.transactions.shift?.transactions || []}
              shiftDetails={dialogState.transactions.shift}
              isArchived={true}
              showDownloadButton={true}
            />
            <BalanceHistoryDialog
              isOpen={dialogState.balanceHistory.isOpen}
              onOpenChange={() => handleCloseDialog('balanceHistory')}
              shift={dialogState.balanceHistory.shift}
              products={products}
            />

            <VoucherStockDetailsDialog 
                shift={activeStockDetailsShift}
                details={activeVoucherStockDetails}
                isOpen={!!stockDetailsShiftId}
                onOpenChange={(open) => !open && setStockDetailsShiftId(null)}
            />
        </>
    );
};