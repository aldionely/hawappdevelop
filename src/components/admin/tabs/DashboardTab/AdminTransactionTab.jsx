import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { formatNumberInput, parseFormattedNumber } from '@/lib/utils';
import { Settings, Download } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { downloadLocationAdminReport } from '@/lib/downloadHelper';

const processAllowancesForShifts = (shifts, allowances) => {
    const allowanceMap = new Map((allowances || []).map(a => [a.worker_username.toUpperCase(), a.amount]));
    const processedShifts = new Map();
    const paidAllowanceTracker = new Set(); 

    const sortedShifts = shifts.slice().sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    for (const shift of sortedShifts) {
        const date = new Date(shift.startTime);
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const trackerKey = `${shift.username.toUpperCase()}-${dateKey}`;

        let dailyAllowance = 0;
        if (!paidAllowanceTracker.has(trackerKey)) {
            dailyAllowance = allowanceMap.get(shift.username.toUpperCase()) || 0;
            if (dailyAllowance > 0) {
                paidAllowanceTracker.add(trackerKey);
            }
        }
        
        const finalFee = (shift.totalAdminFee || 0) - dailyAllowance;
        processedShifts.set(shift.id, { ...shift, calculatedAllowance: dailyAllowance, finalFee });
    }
    
    return shifts.map(s => processedShifts.get(s.id) || s);
};

const ShiftAdminItem = ({ shift }) => {
    return (
        <div className="p-3 border rounded-lg bg-white mb-2 last:mb-0">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-semibold">{shift.workerName}</p>
                    <p className="text-xs text-gray-500">{new Date(shift.startTime).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
                <div>
                    <p className="font-semibold text-gray-700 text-right">Rp {(shift.totalAdminFee || 0).toLocaleString()}</p>
                    <p className="text-xs text-red-500 text-right">(- Rp {(shift.calculatedAllowance || 0).toLocaleString()})</p>
                </div>
            </div>
            <div className="border-t mt-2 pt-2 flex justify-between items-center">
                <span className="text-sm font-medium">Total Final:</span>
                <span className="font-bold text-green-600 text-base">Rp {(shift.finalFee || 0).toLocaleString()}</span>
            </div>
        </div>
    );
};

const DailyAllowanceManager = ({ workers, currentAllowances, onSave }) => {
    const [allowances, setAllowances] = useState({});
    const [displayAllowances, setDisplayAllowances] = useState({});

    useEffect(() => {
        const initialAllowances = {};
        const initialDisplay = {};
        (currentAllowances || []).forEach(allowance => {
            initialAllowances[allowance.worker_username.toUpperCase()] = allowance.amount;
            initialDisplay[allowance.worker_username.toUpperCase()] = formatNumberInput(String(allowance.amount));
        });
        setAllowances(initialAllowances);
        setDisplayAllowances(initialDisplay);
    }, [currentAllowances]);

    const handleAllowanceChange = (username, value) => {
        const numericValue = parseFormattedNumber(value);
        setAllowances(prev => ({ ...prev, [username.toUpperCase()]: numericValue }));
        setDisplayAllowances(prev => ({ ...prev, [username.toUpperCase()]: formatNumberInput(value) }));
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Pengaturan Uang Harian</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4">
                {workers.map(worker => (
                    <div key={worker.id} className="grid grid-cols-3 items-center gap-4">
                        <label className="font-medium">{worker.name} ({worker.username})</label>
                        <Input
                            type="text"
                            placeholder="Jumlah (Rp)"
                            value={displayAllowances[worker.username.toUpperCase()] || ''}
                            onChange={(e) => handleAllowanceChange(worker.username, e.target.value)}
                            className="col-span-2"
                        />
                    </div>
                ))}
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Batal</Button></DialogClose>
                <DialogClose asChild><Button onClick={() => onSave(allowances)}>Simpan Pengaturan</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
    );
};

const LocationAdminStats = ({ shifts, location, onDownload }) => {
    const [openAccordion, setOpenAccordion] = useState();

    const totalFinalAdminFee = useMemo(() => {
        return shifts.reduce((acc, shift) => acc + (shift.finalFee || 0), 0);
    }, [shifts]);

    const groupedShifts = useMemo(() => {
        return shifts.reduce((acc, shift) => {
            const date = new Date(shift.startTime);
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(shift);
            return acc;
        }, {});
    }, [shifts]);

    const sortedDates = useMemo(() => {
        if (!groupedShifts) return [];
        return Object.keys(groupedShifts).sort((a, b) => new Date(a) - new Date(b));
    }, [groupedShifts]);

    return (
        <div>
            <div className="p-4 bg-gray-100 rounded-lg mb-4 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold">ADMIN {location}</h3>
                    <p className="text-xl font-bold text-blue-600">Rp {totalFinalAdminFee.toLocaleString()}</p>
                </div>
                <Button onClick={onDownload} disabled={shifts.length === 0}>
                    <Download className="mr-2 h-4 w-4" /> Unduh
                </Button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto pr-2">
                <Accordion type="single" collapsible className="w-full space-y-3" value={openAccordion} onValueChange={setOpenAccordion}>
                    {sortedDates.map(date => (
                        <AccordionItem value={date} key={date} className="border-b-0">
                            <AccordionTrigger className="p-4 border rounded-lg bg-white font-bold text-base hover:bg-gray-50 data-[state=open]:rounded-b-none">
                                {new Date(date.replace(/-/g, '/')).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </AccordionTrigger>
                            <AccordionContent className="p-4 border border-t-0 rounded-b-lg bg-white/60">
                                {groupedShifts[date].map(shift => (
                                    <ShiftAdminItem key={shift.id} shift={shift} />
                                ))}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
                {shifts.length === 0 && <p className="text-center text-gray-500 py-4">Tidak ada data untuk filter ini.</p>}
            </div>
        </div>
    );
};


export const AdminTransactionTab = () => {
  const { shiftArchives, workers, dailyAllowances, updateAllowance } = useData();
  const { toast } = useToast();

  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedDate, setSelectedDate] = useState('ALL');
  
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const filterOptions = useMemo(() => {
    const options = { years: new Set(), months: {}, dates: {} };
    if (!shiftArchives) return { years: [], months: {}, dates: {} };

    shiftArchives.forEach(s => {
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
  }, [shiftArchives]);

  const filteredShifts = useMemo(() => {
      if (!shiftArchives || !selectedYear || !selectedMonth) return [];

      return shiftArchives.filter(shift => {
          const date = new Date(shift.startTime);
          const yearMatch = date.getFullYear().toString() === selectedYear;
          const monthMatch = (date.getMonth() + 1).toString().padStart(2, '0') === selectedMonth;
          const dateMatch = selectedDate === 'ALL' || date.getDate().toString().padStart(2, '0') === selectedDate;
          return yearMatch && monthMatch && dateMatch;
      });
  }, [shiftArchives, selectedYear, selectedMonth, selectedDate]);
  
  const handleYearChange = (year) => { setSelectedYear(year); setSelectedMonth(''); setSelectedDate('ALL'); }
  const handleMonthChange = (month) => { setSelectedMonth(month); setSelectedDate('ALL'); }

  const processedShifts = useMemo(() => {
      if (!filteredShifts || !dailyAllowances) return [];
      return processAllowancesForShifts(filteredShifts, dailyAllowances);
  }, [filteredShifts, dailyAllowances]);
  
  const grandTotalFinalAdminFee = useMemo(() => {
    return processedShifts.reduce((acc, shift) => acc + (shift.finalFee || 0), 0);
  }, [processedShifts]);
  
  const isFilterActive = selectedYear && selectedMonth;

  const handleSaveAllowances = async (allowancesToSave) => {
    for (const username in allowancesToSave) {
        const amount = parseFloat(allowancesToSave[username]) || 0;
        await updateAllowance(username.toUpperCase(), amount);
    }
    toast({ title: "Berhasil", description: "Pengaturan uang harian telah disimpan." });
  };
  
  const getDateRangeText = () => {
    if (!isFilterActive) return "Semua Waktu";
    const monthName = monthNames[parseInt(selectedMonth, 10) - 1];
    if (selectedDate !== 'ALL') {
        return `${selectedDate} ${monthName} ${selectedYear}`;
    }
    return `${monthName} ${selectedYear}`;
  };

  if (!shiftArchives || !workers) {
    return <p>Loading...</p>;
  }

  return (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Admin Transaksi</h2>
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <Settings className="mr-2 h-4 w-4" />
                        Pengaturan
                    </Button>
                </DialogTrigger>
                <DailyAllowanceManager workers={workers} currentAllowances={dailyAllowances} onSave={handleSaveAllowances} />
            </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 border rounded-md">
            <Select value={selectedYear} onValueChange={handleYearChange}>
                <SelectTrigger><SelectValue placeholder="Pilih Tahun..." /></SelectTrigger>
                <SelectContent>{filterOptions.years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedMonth} onValueChange={handleMonthChange} disabled={!selectedYear}>
                <SelectTrigger><SelectValue placeholder="Pilih Bulan..." /></SelectTrigger>
                <SelectContent>{(filterOptions.months[selectedYear] || []).map(m => <SelectItem key={m} value={m}>{monthNames[parseInt(m, 10) - 1]}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedDate} onValueChange={setSelectedDate} disabled={!selectedMonth}>
                <SelectTrigger><SelectValue placeholder="Pilih Tanggal..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">Semua Tanggal</SelectItem>
                    {(filterOptions.dates[`${selectedYear}-${selectedMonth}`] || []).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
        
        {!isFilterActive ? (
            <div className="text-center text-gray-500 py-10">
                <p>Silakan pilih tahun dan bulan untuk menampilkan data.</p>
            </div>
        ) : (
            <>
                <div className="p-4 bg-blue-50 rounded-lg">
                    <h2 className="text-xl font-bold">GRAND TOTAL</h2>
                    <p className="text-xl font-bold text-blue-700">Rp {grandTotalFinalAdminFee.toLocaleString()}</p>
                </div>

                <Tabs defaultValue="pipitan" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pipitan">PIPITAN</TabsTrigger>
                        <TabsTrigger value="sadik">SADIK</TabsTrigger>
                    </TabsList>
                    <TabsContent value="pipitan">
                        <LocationAdminStats 
                            shifts={processedShifts.filter(s => s.lokasi === 'PIPITAN')} 
                            location="PIPITAN" 
                            onDownload={() => downloadLocationAdminReport(processedShifts.filter(s => s.lokasi === 'PIPITAN'), 'PIPITAN', getDateRangeText(), dailyAllowances)}
                        />
                    </TabsContent>
                    <TabsContent value="sadik">
                        <LocationAdminStats 
                            shifts={processedShifts.filter(s => s.lokasi === 'SADIK')} 
                            location="SADIK"
                            onDownload={() => downloadLocationAdminReport(processedShifts.filter(s => s.lokasi === 'SADIK'), 'SADIK', getDateRangeText(), dailyAllowances)}
                        />
                    </TabsContent>
                </Tabs>
            </>
        )}
    </div>
  );
};