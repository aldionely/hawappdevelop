// FILE: src/components/admin/tabs/VoucherTab.jsx (SUDAH DIPERBAIKI)

import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PlusCircle, Eye, Trash2, Edit, Plus } from 'lucide-react';
import { formatNumberInput, parseFormattedNumber } from '@/lib/utils';

// Komponen VoucherForm dan AddStockDialog tidak perlu diubah, jadi kita biarkan.
const VoucherForm = ({ voucher, onSave, onCancel, locations }) => {
    // ... (kode dari file Anda, tidak ada perubahan)
    const [name, setName] = useState(voucher ? voucher.name : '');
    const [category, setCategory] = useState(voucher ? voucher.category : '');
    const [location, setLocation] = useState(voucher ? voucher.location : locations[0] || '');
    const [costPrice, setCostPrice] = useState(voucher ? String(voucher.cost_price) : '');
    const [displayCostPrice, setDisplayCostPrice] = useState(voucher ? formatNumberInput(String(voucher.cost_price)) : '');
    const [sellPrice, setSellPrice] = useState(voucher ? String(voucher.sell_price) : '');
    const [displaySellPrice, setDisplaySellPrice] = useState(voucher ? formatNumberInput(String(voucher.sell_price)) : '');
    const [currentStock, setCurrentStock] = useState(voucher ? String(voucher.current_stock) : '0');
    const [displayCurrentStock, setDisplayCurrentStock] = useState(voucher ? formatNumberInput(String(voucher.current_stock)) : '0');

    const { toast } = useToast();
    const isEditing = !!voucher;
    const profit = (parseFormattedNumber(sellPrice) || 0) - (parseFormattedNumber(costPrice) || 0);

    const handleSubmit = (e) => {
        e.preventDefault();
        const numCostPrice = parseFormattedNumber(costPrice) || 0;
        const numSellPrice = parseFormattedNumber(sellPrice) || 0;
        const numCurrentStock = parseInt(parseFormattedNumber(currentStock), 10) || 0;

        if (!name || !category || !location) {
            toast({ variant: "destructive", title: "Error", description: "Nama, kategori, dan lokasi harus diisi." });
            return;
        }

        const payload = { name, category: category.toUpperCase(), location, cost_price: numCostPrice, sell_price: numSellPrice, current_stock: numCurrentStock };
        if (!isEditing) {
            payload.initial_stock = numCurrentStock;
        }

        onSave(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <Input placeholder="Nama Voucher" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input placeholder="Kategori (e.g. VCR AXIS HARIAN)" value={category} onChange={(e) => setCategory(e.target.value)} required />
             <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full p-2 border rounded-md text-sm bg-background">
                {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
            <Input 
                type="text" 
                placeholder="Stok Saat Ini" 
                value={displayCurrentStock} 
                onChange={(e) => {
                    setDisplayCurrentStock(formatNumberInput(e.target.value)); 
                    setCurrentStock(e.target.value);
                }} 
                required 
            />
            <Input type="text" placeholder="Harga Modal (Rp)" value={displayCostPrice} onChange={(e) => { setDisplayCostPrice(formatNumberInput(e.target.value)); setCostPrice(e.target.value); }} />
            <Input type="text" placeholder="Harga Jual (Rp)" value={displaySellPrice} onChange={(e) => { setDisplaySellPrice(formatNumberInput(e.target.value)); setSellPrice(e.target.value); }}/>
            <div className="text-sm p-2 bg-gray-100 rounded-md">
                Profit: <span className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>Rp {profit.toLocaleString('id-ID')}</span>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" size="sm" onClick={onCancel}>Batal</Button>
                <Button type="submit" size="sm">Simpan</Button>
            </DialogFooter>
        </form>
    );
};

const AddStockDialog = ({ voucher, onAddStock }) => {
    // ... (kode dari file Anda, tidak ada perubahan)
    const [quantity, setQuantity] = useState('');
    const [displayQuantity, setDisplayQuantity] = useState('');
    const [description, setDescription] = useState('');
    const { toast } = useToast();

    const handleAdd = () => {
        const numQuantity = parseInt(parseFormattedNumber(quantity));
        if (isNaN(numQuantity) || numQuantity <= 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Jumlah harus angka positif.' });
            return;
        }
        onAddStock(numQuantity, description || 'Penambahan stok oleh admin');
    };
    
    return (
        <DialogContent>
            <DialogHeader><DialogTitle>Tambah Stok: {voucher.name}</DialogTitle></DialogHeader>
            <div className="space-y-3">
                <p className="text-sm">Stok Saat Ini: <span className="font-bold">{voucher.current_stock}</span></p>
                <Input type="text" placeholder="Jumlah Penambahan" value={displayQuantity} onChange={e => { setDisplayQuantity(formatNumberInput(e.target.value)); setQuantity(e.target.value); }} />
                <Input placeholder="Deskripsi (Opsional)" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
                <DialogClose asChild><Button onClick={handleAdd}>Tambah Stok</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
    );
};

const VoucherLogsDialog = ({ voucher, logs }) => (
    // ... (kode dari file Anda, tidak ada perubahan)
    <DialogContent className="max-h-[80vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Riwayat Stok: {voucher.name}</DialogTitle>
            <p className="text-sm text-muted-foreground">{voucher.category} - {voucher.location}</p>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-4">
            <div className="space-y-3">
                {logs.length > 0 ? logs.map(log => (
                    <div key={log.id} className="text-sm border-b pb-2">
                        <div className="flex justify-between items-center">
                            <p className={`font-bold ${log.transaction_type === 'PENAMBAHAN' ? 'text-green-600' : 'text-red-600'}`}>
                                {log.transaction_type} ({log.quantity_changed})
                            </p>
                            <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
                        </div>
                        <p>Stok: {log.previous_stock} &rarr; {log.new_stock}</p>
                        <p className="text-xs">Oleh: {log.username}</p>
                        {log.description && <p className="text-xs italic">"{log.description}"</p>}
                    </div>
                )) : <p className="text-center text-muted-foreground">Tidak ada riwayat.</p>}
            </div>
        </div>
        <DialogFooter><DialogClose asChild><Button variant="outline">Tutup</Button></DialogClose></DialogFooter>
    </DialogContent>
);


export const VoucherTab = () => {
    // Ambil semua data voucher dari context, tidak perlu fetching manual di sini
    const { vouchers, addVoucher, updateVoucher, deleteVoucher, updateVoucherStock, fetchVoucherLogsAPI } = useData();
    const { toast } = useToast();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState(null);
    const [filterLocation, setFilterLocation] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [search, setSearch] = useState("");
    const [selectedVoucherForLogs, setSelectedVoucherForLogs] = useState(null);
    const [voucherLogs, setVoucherLogs] = useState([]);

    const locations = ['PIPITAN', 'SADIK'];

    // Ambil daftar kategori unik dari semua voucher yang ada
    const categories = useMemo(() => {
        if (!filterLocation) return [];
        const uniqueCategories = new Set(
            vouchers
                .filter(v => v.location === filterLocation)
                .map(v => v.category || 'Lainnya')
        );
        return Array.from(uniqueCategories).sort();
    }, [vouchers, filterLocation]);
    
    // Filter voucher di sisi client berdasarkan state filter
    const groupedVouchers = useMemo(() => {
        if (!filterLocation || !filterCategory) return {};
        
        let filtered = vouchers
            .filter(v => v.location === filterLocation && (v.category || 'Lainnya') === filterCategory);

        if (search) {
            filtered = filtered.filter(v =>
                v.name.toLowerCase().includes(search.toLowerCase())
            );
        }

        return filtered.reduce((acc, voucher) => {
            const category = voucher.category || 'Lainnya';
            if (!acc[category]) acc[category] = [];
            acc[category].push(voucher);
            return acc;
        }, {});
    }, [vouchers, filterLocation, filterCategory, search]);

    const handleFormOpen = (voucher) => {
        setEditingVoucher(voucher);
        setIsFormOpen(true);
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setEditingVoucher(null);
    };

    const handleSaveVoucher = async (data) => {
        const result = editingVoucher ? await updateVoucher(editingVoucher.id, data) : await addVoucher(data);
        if (result.success) {
            toast({ title: "Berhasil", description: `Voucher ${editingVoucher ? 'diperbarui' : 'ditambahkan'}.` });
            handleFormClose();
        } else {
            toast({ variant: "destructive", title: "Gagal", description: result.error?.message || "Terjadi kesalahan." });
        }
    };
    
    const handleDeleteVoucher = async (voucherId) => {
        const result = await deleteVoucher(voucherId);
        if (result.success) {
            toast({ title: 'Voucher Dihapus' });
        } else {
            toast({ variant: 'destructive', title: 'Gagal', description: result.error?.message || 'Gagal menghapus voucher.' });
        }
    };

    const handleShowLogs = async (voucher) => {
        setSelectedVoucherForLogs(voucher);
        const result = await fetchVoucherLogsAPI(voucher.id);
        if (result.success) setVoucherLogs(result.data);
        else toast({ variant: 'destructive', title: 'Gagal', description: 'Tidak dapat memuat riwayat.' });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Manajemen Voucher</h2>
                <Button size="sm" onClick={() => handleFormOpen(null)}><PlusCircle size={16} className="mr-2" /> Tambah Voucher</Button>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
                <select
                    value={filterLocation}
                    onChange={e => {
                        setFilterLocation(e.target.value);
                        setFilterCategory("");
                        setSearch("");
                    }}
                    className="border rounded px-2 py-1 text-sm"
                >
                    <option value="">Pilih Lokasi</option>
                    {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
                <select
                    value={filterCategory}
                    onChange={e => setSearch("") & setFilterCategory(e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                    disabled={!filterLocation}
                >
                    <option value="">Pilih Kategori</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <Input
                    placeholder="Cari nama voucher..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="max-w-xs"
                    disabled={!filterLocation || !filterCategory}
                />
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent onEscapeKeyDown={handleFormClose} onPointerDownOutside={handleFormClose}>
                    <DialogHeader><DialogTitle>{editingVoucher ? 'Edit Voucher' : 'Tambah Voucher Baru'}</DialogTitle></DialogHeader>
                    <VoucherForm voucher={editingVoucher} onSave={handleSaveVoucher} onCancel={handleFormClose} locations={locations} />
                </DialogContent>
            </Dialog>

            <div className="mt-4">
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                    {(!filterLocation || !filterCategory) ? (
                        <p className="text-center py-8 text-gray-500">Pilih lokasi dan kategori untuk menampilkan voucher.</p>
                    ) : (
                        Object.keys(groupedVouchers).length > 0 ? Object.keys(groupedVouchers).sort().map(category => (
                            <div key={category}>
                                <h3 className="font-bold text-md mb-2">{category}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {groupedVouchers[category].map(v => (
                                        <div key={v.id} className="p-3 border rounded-lg bg-white space-y-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold">{v.name}</p>
                                                    <p className="text-xs text-gray-500">Profit: Rp {(v.sell_price - v.cost_price).toLocaleString()}</p>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <Dialog>
                                                        <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6" title="Tambah Stok"><Plus size={14} /></Button></DialogTrigger>
                                                        <AddStockDialog voucher={v} onAddStock={(qty, desc) => updateVoucherStock(v.id, qty, 'PENAMBAHAN', desc)} />
                                                    </Dialog>
                                                    <Dialog>
                                                        <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6" title="Lihat Riwayat" onClick={() => handleShowLogs(v)}><Eye size={14} /></Button></DialogTrigger>
                                                        {selectedVoucherForLogs && <VoucherLogsDialog voucher={selectedVoucherForLogs} logs={voucherLogs} />}
                                                    </Dialog>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" title="Edit Voucher" onClick={() => handleFormOpen(v)}><Edit size={14} /></Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600" title="Hapus Voucher"><Trash2 size={14} /></Button></AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader><AlertDialogTitle>Hapus Voucher?</AlertDialogTitle><AlertDialogDescription>Anda yakin ingin menghapus {v.name}? Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader>
                                                            <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteVoucher(v.id)} className="bg-red-600 hover:bg-red-700">Hapus</AlertDialogAction></AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span>Stok Saat Ini:</span>
                                                <span className="font-bold text-lg">{v.current_stock}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )) : <p className="text-center py-8 text-gray-500">Tidak ada voucher untuk filter ini.</p>
                    )}
                </div>
            </div>
        </div>
    );
};