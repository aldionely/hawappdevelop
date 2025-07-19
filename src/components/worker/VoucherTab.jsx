// src/components/worker/VoucherTab.jsx

import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus, Search, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { formatNumberInput, parseFormattedNumber } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadVoucherStockReport, downloadCategoryVoucherReport } from '@/lib/downloadHelper';

// Komponen-komponen ini tidak berubah
const AddStockDialog = ({ voucher, onConfirm }) => {
    const [quantity, setQuantity] = useState('');
    const [displayQuantity, setDisplayQuantity] = useState('');
    const [description, setDescription] = useState('');
    const { toast } = useToast();

    const handleConfirm = () => {
        const numQuantity = parseInt(parseFormattedNumber(quantity));
        if (isNaN(numQuantity) || numQuantity <= 0) {
            toast({ variant: "destructive", title: "Error", description: "Jumlah harus angka positif." });
            return;
        }
        if (!description.trim()) {
            toast({ variant: "destructive", title: "Error", description: "Deskripsi penambahan harus diisi." });
            return;
        }
        onConfirm(numQuantity, description);
        setQuantity('');
        setDisplayQuantity('');
        setDescription('');
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Tambah Stok: {voucher.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
                <p className="text-sm">Stok Saat Ini: <span className="font-bold">{voucher.current_stock}</span></p>
                <Input type="text" placeholder="Jumlah Diterima" value={displayQuantity} onChange={e => { setDisplayQuantity(formatNumberInput(e.target.value)); setQuantity(e.target.value); }} />
                <Input placeholder="Deskripsi (misal: 'Diterima dari Admin')" value={description} onChange={e => setDescription(e.target.value)} required />
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
                <DialogClose asChild><Button onClick={handleConfirm}>Konfirmasi</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
    );
};

const VoucherItem = ({ voucher, onSell, onAddStock }) => {
    const { toast } = useToast();
    const handleSellClick = () => {
        if (voucher.current_stock <= 0) {
            toast({ variant: 'destructive', title: 'Stok Habis', description: `Stok untuk ${voucher.name} sudah habis.` });
            return;
        }
        onSell(voucher);
    };
    return (
        <div className="p-3 border rounded-lg bg-white flex justify-between items-center">
            <div>
                <p className="font-semibold text-sm">{voucher.name}</p>
                {/* Menambahkan tampilan harga jual */}
                <p className="text-xs text-muted-foreground">Harga: Rp {voucher.sell_price.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{voucher.category}</p>
            </div>
            <div className="flex items-center space-x-2">
                <Button size="icon" variant="outline" className="h-8 w-8" onClick={handleSellClick} disabled={voucher.current_stock <= 0}>
                    <Minus size={16} />
                </Button>
                <span className="font-bold text-lg w-10 text-center">{voucher.current_stock}</span>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button size="icon" variant="outline" className="h-8 w-8 text-green-600 hover:text-green-700">
                            <Plus size={16} />
                        </Button>
                    </DialogTrigger>
                    <AddStockDialog voucher={voucher} onConfirm={onAddStock} />
                </Dialog>
            </div>
        </div>
    );
};

const VoucherHistoryList = ({ transactions }) => {
    const voucherSales = useMemo(() => {
        return transactions
            .filter(tx => tx.id && tx.id.includes('tx_vcr'))
            .slice()
            .reverse();
    }, [transactions]);
    const formatTime = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    };
    return (
        <div className="space-y-2">
            {voucherSales.length > 0 ? (
                voucherSales.map(tx => (
                    <div key={tx.id} className="text-xs flex justify-between items-center border-b pb-1.5 last:border-b-0">
                        <div>
                            <p className="font-medium">{tx.description}</p>
                            <p className="text-gray-500">{formatTime(tx.timestamp)}</p>
                        </div>
                        <div className="text-right">
                           <p className="font-semibold text-green-600">+ Rp {tx.amount.toLocaleString()}</p>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-center text-muted-foreground pt-4 text-sm">Belum ada penjualan voucher.</p>
            )}
        </div>
    );
};

// Fungsi pengurutan ini sudah benar
const sortVoucherItems = (a, b) => {
    const regex = /([\d.,]+)\s*GB/i;
    const matchA = a.name.match(regex);
    const matchB = b.name.match(regex);
    if (matchA && matchB) {
        const gbA = parseFloat(matchA[1].replace(',', '.'));
        const gbB = parseFloat(matchB[1].replace(',', '.'));
        if (gbA !== gbB) return gbA - gbB;
    }
    const daysRegex = /(\d+)\s*D/i;
    const daysMatchA = a.name.match(daysRegex);
    const daysMatchB = b.name.match(daysRegex);
    if (daysMatchA && daysMatchB) {
        const daysA = parseInt(daysMatchA[1], 10);
        const daysB = parseInt(daysMatchB[1], 10);
        if (daysA !== daysB) return daysA - daysB;
    }
    return a.name.localeCompare(b.name, undefined, { numeric: true });
};


// Komponen Utama VoucherTab
export const VoucherTab = ({ shiftLocation, activeShiftData }) => {
    const { vouchers, updateVoucherStock, sellVoucherAndUpdateShift } = useData();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

    // Perbaikan nama kategori "UNLIMITED" menjadi "UNL" agar konsisten
    const categoryOrder = [
        "VCR SMARTFREN HARIAN", "VCR SMARTFREN UNL", "VCR INDOSAT UNL",
        "VCR INDOSAT BULANAN", "VCR INDOSAT HARIAN", "VCR TRI BULANAN", "VCR TRI HARIAN",
        "VCR TSEL HARIAN", "VCR TSEL BULANAN", "VCR XL BULANAN", "VCR XL HARIAN",
        "VCR AXIS BULANAN", "VCR AXIS HARIAN", "KARTU SMARTFREN", "KARTU AXIS", "KARTU BYU",
        "KARTU ISAT", "KARTU TRI", "KARTU XL",
    ];

    const locationVouchers = useMemo(() => {
        if (!vouchers || !shiftLocation) return [];
        return vouchers.filter(v => v.location === shiftLocation && !v.is_archived);
    }, [vouchers, shiftLocation]);

    const filteredVouchers = useMemo(() => {
        if (!searchTerm) return locationVouchers;
        return locationVouchers.filter(v =>
            v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (v.category && v.category.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [locationVouchers, searchTerm]);

    const groupedVouchers = useMemo(() => {
        return filteredVouchers.reduce((acc, voucher) => {
            const category = voucher.category || 'Lainnya';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(voucher);
            return acc;
        }, {});
    }, [filteredVouchers]);

    const sortedGroupedVoucherKeys = useMemo(() => {
        const keys = Object.keys(groupedVouchers);
        return keys.sort((a, b) => {
            const indexA = categoryOrder.indexOf(a.toUpperCase());
            const indexB = categoryOrder.indexOf(b.toUpperCase());
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        });
    }, [groupedVouchers, categoryOrder]);

    const handleSellVoucher = async (voucher) => {
        const result = await sellVoucherAndUpdateShift(voucher);
        if(result.success) {
            toast({ title: 'Voucher Terjual!', description: `${voucher.name} telah terjual.` });
        } else {
             toast({ variant: 'destructive', title: 'Gagal Menjual', description: result.error?.message || 'Terjadi kesalahan.' });
        }
    };

    const handleAddStock = async (voucherId, quantity, description) => {
        const result = await updateVoucherStock(voucherId, quantity, 'PENAMBAHAN', description);
        if (result.success) {
            toast({ title: 'Stok Ditambahkan', description: description });
        } else {
            toast({ variant: 'destructive', title: 'Gagal', description: result.error?.message || 'Gagal memperbarui stok.' });
        }
    };

    const handleDownloadFullReport = () => {
        downloadVoucherStockReport(activeShiftData, vouchers, false);
    };

    // --- 1. INI ADALAH DEFINISI FUNGSI YANG HILANG ---
    const handleDownloadCategory = (categoryName, vouchersInCategory) => {
        downloadCategoryVoucherReport(activeShiftData, vouchersInCategory, categoryName, false);
    };

    return (
        <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
            <Tabs defaultValue="stok" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="stok">Stok Voucher</TabsTrigger>
                    <TabsTrigger value="riwayat">Riwayat Penjualan</TabsTrigger>
                </TabsList>
                <TabsContent value="stok">
                     <div className="flex gap-2 my-2">
                        <div className="relative flex-grow">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Cari voucher..."
                                className="w-full pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="sm" onClick={handleDownloadFullReport}>
                            <Download size={16} className="mr-2" />
                            Laporan
                        </Button>
                    </div>
                    <div className="space-y-4 mt-2">
                        {sortedGroupedVoucherKeys.length > 0 ? (
                            sortedGroupedVoucherKeys.map(category => (
                                <div key={category}>
                                    <div className="flex justify-between items-center mb-2 sticky top-0 bg-gradient-to-b from-purple-100 to-transparent py-1">
                                        <h3 className="font-bold text-md">{category}</h3>
                                        {/* 2. TOMBOL INI SEKARANG BISA MEMANGGIL FUNGSI DI ATAS */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-gray-500 hover:text-blue-600"
                                            onClick={() => handleDownloadCategory(category, groupedVouchers[category])}
                                            title={`Download laporan untuk ${category}`}
                                        >
                                            <Download size={20} />
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        {groupedVouchers[category]
                                            .sort(sortVoucherItems)
                                            .map(voucher => (
                                            <VoucherItem
                                                key={voucher.id}
                                                voucher={voucher}
                                                onSell={handleSellVoucher}
                                                onAddStock={(qty, desc) => handleAddStock(voucher.id, qty, desc)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground pt-10">
                                {searchTerm ? `Tidak ada voucher dengan kata kunci "${searchTerm}".` : `Tidak ada voucher untuk lokasi ${shiftLocation}.`}
                            </p>
                        )}
                    </div>
                </TabsContent>
                <TabsContent value="riwayat">
                    <div className="p-1 mt-2">
                       <VoucherHistoryList transactions={activeShiftData?.transactions || []} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};