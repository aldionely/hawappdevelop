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

// DIKEMBALIKAN: Komponen ini sekarang berisi semua informasi detail dan tombol
const ArchivedShiftItem = ({ shift }) => {
  const [showTransactions, setShowTransactions] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showBalanceHistory, setShowBalanceHistory] = useState(false);
  const { toast } = useToast();
  const { removeShiftArchive, vouchers, products, initialAppBalances } = useData();

  const handleDelete = async () => {
    const result = await removeShiftArchive(shift.id);
    if (result.success) {
      toast({ title: "Shift Dihapus" });
    } else {
      toast({ variant: "destructive", title: "Gagal Menghapus", description: result.error?.message });
    }
  };
  
  const handleDownloadVoucherReport = () => {
    downloadVoucherStockReport(shift, vouchers, true);
  };

  const selisih = shift.selisih || 0;
  const uangTransaksi = shift.uangTransaksi || 0;
  const kasAwal = shift.kasAwal || 0;
  const kasAkhir = shift.kasAkhir || 0;
  const totalIn = shift.totalIn || 0;
  const totalOut = shift.totalOut || 0;
  const totalAdminFee = shift.totalAdminFee || 0;
  const appBalances = shift.app_balances || initialAppBalances;

  return (
    <div className="p-4 border rounded-lg bg-gray-50 mb-3 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-bold text-sm text-gray-800">{shift.workerName}</p>
          <p className="text-xs text-gray-500">{formatDateTime(shift.startTime).time} - {formatDateTime(shift.endTime).time}</p>
        </div>
        <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-indigo-600" onClick={() => setShowReport(true)} title="Laporan Akhir"><FileText size={14} /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-cyan-600" onClick={() => setShowBalanceHistory(true)} title="Riwayat Saldo App"><ListChecks size={14} /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-blue-600" onClick={() => setShowTransactions(true)} title="Riwayat Transaksi"><Eye size={14} /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-green-600" onClick={() => downloadTransactions(shift, shift.workerName)} title="Unduh Transaksi"><Download size={14} /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-orange-600" onClick={handleDownloadVoucherReport} title="Unduh Laporan Voucher"><Ticket size={14} /></Button>
            <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-red-600" title="Hapus"><Trash2 size={14} /></Button></AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Hapus Arsip?</AlertDialogTitle><AlertDialogDescription>Yakin ingin menghapus arsip ini?</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600">Hapus</AlertDialogAction></AlertDialogFooter>
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

      <TransactionHistoryDialog isOpen={showTransactions} onOpenChange={setShowTransactions} transactions={shift.transactions || []} shiftDetails={shift} isArchived={true} showDownloadButton={true} />
      <ShiftReportDialog shift={shift} isOpen={showReport} onOpenChange={setShowReport} showDownloadButton={true} />
      <BalanceHistoryDialog isOpen={showBalanceHistory} onOpenChange={setShowBalanceHistory} shift={shift} products={products}/>
    </div>
  );
};


// Komponen utama dengan filter dan struktur Tab (TETAP SAMA)
export const ArchivedShiftsList = ({ workers, shiftArchives }) => {
    // ... (seluruh kode di sini tetap sama seperti respons sebelumnya)
    const [selectedLocation, setSelectedLocation] = useState('PIPITAN');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));

    const { years, months, groupedByDate } = useMemo(() => {
        if (!shiftArchives) return { years: [], months: {}, groupedByDate: {} };

        const filteredShifts = shiftArchives.filter(s => s.lokasi === selectedLocation);
        const yearsSet = new Set();
        const monthsMap = {};
        
        filteredShifts.forEach(s => {
            const date = new Date(s.startTime);
            const year = date.getFullYear().toString();
            monthsMap[year] = monthsMap[year] || new Set();
            monthsMap[year].add((date.getMonth() + 1).toString().padStart(2, '0'));
            yearsSet.add(year);
        });

        const grouped = filteredShifts
            .filter(s => {
                const date = new Date(s.startTime);
                return date.getFullYear().toString() === selectedYear && (date.getMonth() + 1).toString().padStart(2, '0') === selectedMonth;
            })
            .reduce((acc, shift) => {
                const day = shift.startTime.split('T')[0];
                if (!acc[day]) acc[day] = [];
                acc[day].push(shift);
                return acc;
            }, {});

        return {
            years: Array.from(yearsSet).sort((a, b) => b - a),
            months: Object.keys(monthsMap).reduce((acc, year) => ({...acc, [year]: Array.from(monthsMap[year]).sort((a,b) => b-a) }), {}),
            groupedByDate: grouped
        };
    }, [shiftArchives, selectedLocation, selectedYear, selectedMonth]);

    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));
    
    if (!Array.isArray(workers) || !Array.isArray(shiftArchives)) {
        return <p className="text-center text-gray-500 py-8">Memuat data arsip...</p>;
    }

    const LocationView = ({ location }) => (
        <div className="space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger><SelectValue placeholder="Pilih Tahun" /></SelectTrigger>
                    <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger><SelectValue placeholder="Pilih Bulan" /></SelectTrigger>
                    <SelectContent>{(months[selectedYear] || []).map(m => <SelectItem key={m} value={m}>{monthNames[parseInt(m, 10) - 1]}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            
            {sortedDates.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Tidak ada data untuk periode ini di lokasi {location}.</p>
            ) : (
                <Accordion type="single" collapsible className="w-full space-y-3">
                    {sortedDates.map(date => (
                        <AccordionItem value={date} key={date} className="border-b-0">
                            <AccordionTrigger className="p-4 border rounded-lg bg-white font-bold text-base hover:bg-gray-50 data-[state=open]:rounded-b-none">
                                {new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </AccordionTrigger>
                            <AccordionContent className="p-4 border border-t-0 rounded-b-lg bg-white/60">
                                {groupedByDate[date].map(shift => (
                                    <ArchivedShiftItem key={shift.id} shift={shift} />
                                ))}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
        </div>
    )

    return (
        <Tabs defaultValue="PIPITAN" className="w-full" onValueChange={setSelectedLocation}>
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="PIPITAN">PIPITAN</TabsTrigger>
                <TabsTrigger value="SADIK">SADIK</TabsTrigger>
            </TabsList>
            <TabsContent value="PIPITAN" className="mt-4">
                <LocationView location="PIPITAN" />
            </TabsContent>
            <TabsContent value="SADIK" className="mt-4">
                <LocationView location="SADIK" />
            </TabsContent>
        </Tabs>
    );
};