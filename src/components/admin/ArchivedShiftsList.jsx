import React, { useState, useMemo } from 'react';
import { ChevronDown, Trash2, Eye, FileText, Download, Ticket, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { TransactionHistoryDialog } from '@/components/shared/TransactionHistoryDialog';
import { ShiftReportDialog } from '@/components/worker/ShiftReportDialog';
import { BalanceHistoryDialog } from '@/components/shared/BalanceHistoryDialog';
import { AppBalancesDisplay } from '@/components/worker/AppBalancesDisplay';
import { downloadTransactions, downloadVoucherStockReport } from '@/lib/downloadHelper';
import { useData } from '@/contexts/DataContext';
import { formatDateTime } from '@/lib/utils';

// --- PERUBAHAN 1: Buat ArchivedShiftItem menjadi komponen 'bodoh' ---
// Ia tidak lagi memiliki state sendiri, hanya menerima data dan fungsi dari props.
const ArchivedShiftItem = React.memo(({ shift, onShowReport, onShowBalanceHistory, onShowTransactions, onDownloadVoucher, onDelete }) => {
  const selisih = shift.selisih || 0;
  const uangTransaksi = shift.uangTransaksi || 0;
  const kasAwal = shift.kasAwal || 0;
  const kasAkhir = shift.kasAkhir || 0;
  const totalIn = shift.totalIn || 0;
  const totalOut = shift.totalOut || 0;
  const totalAdminFee = shift.totalAdminFee || 0;
  const appBalances = shift.app_balances;

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
       <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-gray-100 rounded-md"><p>Kas Awal</p><p className="font-bold text-sm">Rp {kasAwal.toLocaleString()}</p></div>
        <div className="p-2 bg-blue-100 rounded-md"><p>Uang Transaksi</p><p className="font-bold text-sm text-blue-700">Rp {uangTransaksi.toLocaleString()}</p></div>
          <div className="p-2 bg-green-100 rounded-md"><p>Uang Masuk</p><p className="font-bold text-sm text-green-700">Rp {totalIn.toLocaleString()}</p></div>
          <div className="p-2 bg-red-100 rounded-md"><p>Uang Keluar</p><p className="font-bold text-sm text-red-700">Rp {totalOut.toLocaleString()}</p></div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 bg-purple-100 rounded-md"><p>Total Admin</p><p className="font-bold text-sm text-purple-700">Rp {totalAdminFee.toLocaleString()}</p></div>
          <div className="p-2 bg-white rounded-md"><p>Kas Akhir Aktual</p><p className="font-bold text-sm">Rp {kasAkhir.toLocaleString()}</p></div>
      </div>
      <div className={`mt-2 p-2 rounded-md text-sm font-semibold ${selisih === 0 ? 'bg-green-100 text-green-800' : selisih > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        Selisih Kas: Rp {Math.abs(selisih).toLocaleString()} {selisih === 0 ? '(Sesuai)' : selisih > 0 ? '(Lebih)' : '(Kurang)'}
      </div>
      {shift.notes && (
          <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-md font-semibold mb-1">Catatan Shift:</p>
              <p className="text-md text-gray-700 whitespace-pre-wrap bg-white p-2 border rounded-md">{shift.notes}</p>
          </div>
      )}
      {appBalances && (
          <div className="mt-3 pt-3 border-t border-gray-200">
              <AppBalancesDisplay balances={appBalances} title="Saldo Aplikasi (Akhir Shift)" />
          </div>
      )}
    </div>
  );
});


export const ArchivedShiftsList = ({ workers, shiftArchives }) => {
    const { toast } = useToast();
    const { removeShiftArchive, vouchers, products } = useData();

    // State untuk filter
    const [selectedLocation, setSelectedLocation] = useState('PIPITAN');
    const [selectedYear, setSelectedYear] = useState(''); 
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedDate, setSelectedDate] = useState('ALL');
    
    // State untuk kontrol akordeon
    const [openAccordion, setOpenAccordion] = useState();

    // --- PERUBAHAN 2: State untuk semua dialog dipindahkan ke sini ---
    const [dialogState, setDialogState] = useState({
      transactions: { isOpen: false, shift: null },
      report: { isOpen: false, shift: null },
      balanceHistory: { isOpen: false, shift: null },
    });

    // Logika filter dan pengelompokan (tidak berubah)
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
    
    // Handler untuk membuka dialog
    const handleOpenDialog = (type, shift) => {
      setDialogState(prev => ({ ...prev, [type]: { isOpen: true, shift }}));
    };
    
    // Handler untuk menutup dialog
    const handleCloseDialog = (type) => {
      setDialogState(prev => ({ ...prev, [type]: { isOpen: false, shift: null }}));
    };

    // Handler untuk aksi hapus dan unduh
    const handleDelete = async (shiftId) => {
      const result = await removeShiftArchive(shiftId);
      if (result.success) toast({ title: "Shift Dihapus" });
      else toast({ variant: "destructive", title: "Gagal Menghapus", description: result.error?.message });
    };

    const handleDownloadVoucher = (shift) => {
      downloadVoucherStockReport(shift, vouchers, true);
    };
    
    // Handler untuk filter
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
                                  onShowReport={() => handleOpenDialog('report', shift)}
                                  onShowBalanceHistory={() => handleOpenDialog('balanceHistory', shift)}
                                  onShowTransactions={() => handleOpenDialog('transactions', shift)}
                                  onDownloadVoucher={handleDownloadVoucher}
                                  onDelete={handleDelete}
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

            {/* --- PERUBAHAN 3: Render semua dialog di sini, di luar mapping --- */}
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
        </>
    );
};