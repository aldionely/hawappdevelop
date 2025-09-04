import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Coins, Banknote, Wallet, Edit, CheckCircle, Upload } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { EditCashDialog } from './EditCashDialog';
import { DepositCashDialog } from './DepositCashDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Pastikan path ini benar

const StatsCard = ({ title, value, icon, color }) => (
    <div className={`p-4 rounded-lg flex items-start ${color}`}>
        <div className="p-2 rounded-full mr-4 bg-white bg-opacity-50">{icon}</div>
        <div>
            <p className="text-sm font-medium text-gray-700">{title}</p>
            <p className="text-2xl font-bold">Rp {value.toLocaleString('id-ID')}</p>
        </div>
    </div>
);

export const UangShiftTab = () => {
    const { shiftArchives } = useData();
    const [selectedLocation, setSelectedLocation] = useState('PIPITAN');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedDate, setSelectedDate] = useState('ALL');
    
    const [editingShift, setEditingShift] = useState(null);
    const [depositingShift, setDepositingShift] = useState(null);

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

        const filtered = shiftArchives.filter(shift => {
            if (shift.lokasi !== selectedLocation) return false;
            const date = new Date(shift.startTime);
            const yearMatch = date.getFullYear().toString() === selectedYear;
            const monthMatch = (date.getMonth() + 1).toString().padStart(2, '0') === selectedMonth;
            const dateMatch = selectedDate === 'ALL' || date.getDate().toString().padStart(2, '0') === selectedDate;
            return yearMatch && monthMatch && dateMatch;
        });

        // Urutkan dari yang terbaru
        return filtered.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    }, [shiftArchives, selectedLocation, selectedYear, selectedMonth, selectedDate]);

    const stats = useMemo(() => {
        const locationShifts = filteredShifts.filter(s => s.physical_cash_details);
        const totals = {
            totalSemuaUang: 0,
            totalKoin: 0,
            totalRibuan: 0,
            totalPuluhan: 0,
            totalRatusan: 0,
        };
        locationShifts.forEach(shift => {
            totals.totalSemuaUang += shift.kasAkhir || 0;
            totals.totalKoin += shift.physical_cash_details.koin || 0;
            totals.totalRibuan += shift.physical_cash_details.ribuan || 0;
            totals.totalPuluhan += shift.physical_cash_details.puluhan || 0;
            totals.totalRatusan += shift.physical_cash_details.ratusan || 0;
        });
        return totals;
    }, [filteredShifts]);

    const handleYearChange = (year) => { setSelectedYear(year); setSelectedMonth(''); setSelectedDate('ALL'); };
    const handleMonthChange = (month) => { setSelectedMonth(month); setSelectedDate('ALL'); };
    const isFilterActive = selectedYear && selectedMonth;

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">Laporan Uang Fisik Shift</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 border rounded-md">
                <Select value={selectedYear} onValueChange={handleYearChange}><SelectTrigger><SelectValue placeholder="Pilih Tahun..." /></SelectTrigger><SelectContent>{filterOptions.years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select>
                <Select value={selectedMonth} onValueChange={handleMonthChange} disabled={!selectedYear}><SelectTrigger><SelectValue placeholder="Pilih Bulan..." /></SelectTrigger><SelectContent>{(filterOptions.months[selectedYear] || []).map(m => <SelectItem key={m} value={m}>{monthNames[parseInt(m, 10) - 1]}</SelectItem>)}</SelectContent></Select>
                <Select value={selectedDate} onValueChange={setSelectedDate} disabled={!selectedMonth}><SelectTrigger><SelectValue placeholder="Pilih Tanggal..." /></SelectTrigger><SelectContent><SelectItem value="ALL">Semua Tanggal</SelectItem>{(filterOptions.dates[`${selectedYear}-${selectedMonth}`] || []).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
            </div>

            {!isFilterActive ? (<div className="text-center text-gray-500 py-10"><p>Silakan pilih tahun dan bulan untuk menampilkan data.</p></div>) : (
                <Tabs defaultValue="PIPITAN" className="w-full" onValueChange={setSelectedLocation}>
                    <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="PIPITAN">PIPITAN</TabsTrigger><TabsTrigger value="SADIK">SADIK</TabsTrigger></TabsList>
                    <TabsContent value={selectedLocation} className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                            <StatsCard title="Total Semua Uang" value={stats.totalSemuaUang} icon={<Wallet size={22}/>} color="bg-blue-100" />
                            <StatsCard title="Total Ratusan" value={stats.totalRatusan} icon={<Banknote size={22}/>} color="bg-red-100" />
                            <StatsCard title="Total Puluhan" value={stats.totalPuluhan} icon={<Banknote size={22}/>} color="bg-yellow-100" />
                            <StatsCard title="Total Ribuan" value={stats.totalRibuan} icon={<Banknote size={22}/>} color="bg-green-100" />
                            <StatsCard title="Total Koin" value={stats.totalKoin} icon={<Coins size={22}/>} color="bg-gray-100" />
                        </div>
                        
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Waktu Shift</TableHead>
                                        <TableHead>Nama Shift</TableHead>
                                        <TableHead>Rincian Uang</TableHead>
                                        <TableHead className="text-right">Total Setor</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-center">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredShifts.length > 0 ? filteredShifts.map(shift => {
                                        const details = shift.physical_cash_details;
                                        const isSettled = shift.cash_status === 'SUDAH DISETOR';
                                        return (
                                            <TableRow key={shift.id} className={isSettled ? 'bg-green-50' : 'bg-white'}>
                                                <TableCell className="text-xs">
                                                    {new Date(shift.startTime).toLocaleString('id-ID', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'})}
                                                </TableCell>
                                                <TableCell className="font-medium">{shift.workerName}</TableCell>
                                                <TableCell className="text-xs">
                                                    {details ? (
                                                        <>
                                                            R: Rp {(details.ratusan || 0).toLocaleString()}<br/>
                                                            P: Rp {(details.puluhan || 0).toLocaleString()}<br/>
                                                            Rb: Rp {(details.ribuan || 0).toLocaleString()}<br/>
                                                            K: Rp {(details.koin || 0).toLocaleString()}
                                                        </>
                                                    ) : "Tidak ada data rincian."}
                                                </TableCell>
                                                <TableCell className="font-semibold text-right">Rp {(shift.kasAkhir || 0).toLocaleString()}</TableCell>
                                                <TableCell className="text-center">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isSettled ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                                                        {isSettled ? 'Disetor' : 'Belum Disetor'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex justify-center space-x-1">
                                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setEditingShift(shift)} disabled={isSettled} title="Edit Rincian">
                                                            <Edit size={14} />
                                                        </Button>
                                                        <Button variant="default" size="icon" className="h-7 w-7" onClick={() => setDepositingShift(shift)} disabled={isSettled} title="Setor Uang">
                                                            <Upload size={14} />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    }) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                                Tidak ada data untuk filter ini di lokasi {selectedLocation}.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                    </TabsContent>
                </Tabs>
            )}
            
            <EditCashDialog isOpen={!!editingShift} onOpenChange={() => setEditingShift(null)} shift={editingShift} />
            <DepositCashDialog isOpen={!!depositingShift} onOpenChange={() => setDepositingShift(null)} shift={depositingShift} />
        </div>
    );
};
