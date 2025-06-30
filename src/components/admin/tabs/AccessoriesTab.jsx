// File: src/components/admin/tabs/AccessoriesTab.jsx (Sudah Diperbaiki)

import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Edit3, PlusCircle, MoveRight, Box, Check, X, Info, DollarSign, Package, TrendingUp, Store } from 'lucide-react';
import { formatNumberInput, parseFormattedNumber } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Helper function untuk format tanggal
const formatDateTime = (dateString) => {
    if (!dateString) return { date: '-', time: '-' };
    const date = new Date(dateString);
    return {
        date: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
    };
};

const AccessoryForm = ({ accessory, onSave, onCancel }) => {
    const [itemCode, setItemCode] = useState(accessory ? accessory.item_code : '');
    const [name, setName] = useState(accessory ? accessory.name : '');
    const [category, setCategory] = useState(accessory ? accessory.category : '');
    const [brand, setBrand] = useState(accessory ? accessory.brand : '');
    const [model, setModel] = useState(accessory ? accessory.model : '');
    const [costPrice, setCostPrice] = useState(accessory ? String(accessory.cost_price || '') : '');
    const [sellPrice, setSellPrice] = useState(accessory ? String(accessory.sell_price || '') : '');
    const [warehouseStock, setWarehouseStock] = useState(accessory ? '' : '0');
    const { toast } = useToast();
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!itemCode.trim() || !name.trim()) { toast({ variant: "destructive", title: "Error", description: "Kode dan Nama harus diisi." }); return; }
        const numCostPrice = parseFloat(parseFormattedNumber(costPrice)) || 0;
        const numSellPrice = parseFloat(parseFormattedNumber(sellPrice)) || 0;
        const numWarehouseStock = parseInt(parseFormattedNumber(warehouseStock), 10) || 0;
        onSave({ item_code: itemCode.toUpperCase(), name, category: category.toUpperCase() || 'LAINNYA', brand: brand || '-', model: model || null, cost_price: numCostPrice, sell_price: numSellPrice, warehouse_stock: numWarehouseStock });
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <Input placeholder="Kode Barang (Unik)" value={itemCode} onChange={(e) => setItemCode(e.target.value.toUpperCase())} required disabled={!!accessory} />
            <Input placeholder="Nama Produk" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input placeholder="Kategori (e.g. CASING)" value={category} onChange={(e) => setCategory(e.target.value)} />
            <Input placeholder="Merek" value={brand} onChange={(e) => setBrand(e.target.value)} />
            <Input placeholder="Model (Opsional)" value={model} onChange={(e) => setModel(e.target.value)} />
            <Input type="text" placeholder="Harga Modal (Rp)" value={formatNumberInput(costPrice)} onChange={(e) => setCostPrice(parseFormattedNumber(e.target.value))} required />
            <Input type="text" placeholder="Harga Jual (Rp)" value={formatNumberInput(sellPrice)} onChange={(e) => setSellPrice(parseFormattedNumber(e.target.value))} required />
            {!accessory && (<Input type="text" placeholder="Stok Awal Gudang" value={formatNumberInput(warehouseStock)} onChange={(e) => setWarehouseStock(parseFormattedNumber(e.target.value))} required />)}
            <DialogFooter><DialogClose asChild><Button type="button" variant="outline" size="sm" onClick={onCancel}>Batal</Button></DialogClose><Button type="submit" size="sm">Simpan</Button></DialogFooter>
        </form>
    );
};

// Komponen untuk dashboard statistik

// DIUBAH: Komponen Dashboard Statistik sekarang menghitung lebih banyak data
const StatsCard = ({ title, value, icon, color }) => (
    <div className={`p-4 rounded-lg flex items-start ${color}`}>
        <div className="p-2 rounded-full mr-4 bg-white bg-opacity-50">{icon}</div>
        <div>
            <p className="text-sm font-medium text-gray-700">{title}</p>
            <p className="text-2xl font-bold">Rp {value.toLocaleString('id-ID')}</p>
        </div>
    </div>
);

const StatsDashboard = () => {
    const { accessories, inventoryLogs } = useData();

    const stats = useMemo(() => {
        // Nilai default jika data belum siap
        const defaultStats = {
            totalSales: 0, totalProfit: 0, lifetimeAssetValue: 0,
            totalCurrentStockValue: 0, gudangValue: 0, pipitanValue: 0, sadikValue: 0
        };

        if (!Array.isArray(accessories) || !Array.isArray(inventoryLogs)) {
            return defaultStats;
        }

        // --- NILAI HISTORIS (TETAP & TERUS BERTAMBAH) ---
        
        // 1. Total Modal Masuk (Sejarah): Menghitung semua penambahan stok dari log.
        const lifetimeAssetValue = inventoryLogs
            .filter(log => log.quantity_change > 0) // Hanya log penambahan stok (PENAMBAHAN AWAL, TERIMA STOK, dll)
            .reduce((sum, log) => sum + ((log.quantity_change || 0) * (log.cost_price || 0)), 0);

        // 2. Total Penjualan & Profit (dari log penjualan)
        const totalSales = inventoryLogs
            .filter(log => log.activity_type === 'PENJUALAN')
            .reduce((sum, log) => sum + (log.sell_price || 0), 0);
        const totalProfit = inventoryLogs
            .filter(log => log.activity_type === 'PENJUALAN')
            .reduce((sum, log) => sum + ((log.sell_price || 0) - (log.cost_price || 0)), 0);


        // --- NILAI DINAMIS (BERUBAH SESUAI STOK SAAT INI) ---

        // Fungsi untuk menghitung nilai stok SAAT INI di lokasi tertentu
        const calculateCurrentLocationValue = (locationName) => {
            return accessories.reduce((sum, acc) => {
                const inventory = acc.inventory.find(inv => inv.location === locationName);
                const stock = inventory ? inventory.stock : 0;
                return sum + (stock * acc.sell_price); // Dihitung dari harga jual
            }, 0);
        };

        const gudangValue = calculateCurrentLocationValue('GUDANG');
        const pipitanValue = calculateCurrentLocationValue('PIPITAN');
        const sadikValue = calculateCurrentLocationValue('SADIK');

        // Total Nilai Semua Stok SAAT INI
        const totalCurrentStockValue = gudangValue + pipitanValue + sadikValue;

        return {
            totalSales, totalProfit, lifetimeAssetValue,
            totalCurrentStockValue, gudangValue, pipitanValue, sadikValue
        };
    }, [accessories, inventoryLogs]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Kartu Statistik Historis */}
            <StatsCard title="Total Modal Masuk (Sejarah)" value={stats.lifetimeAssetValue} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-history"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>} color="bg-gray-100 text-gray-900" />
            <StatsCard title="Total Penjualan Kotor" value={stats.totalSales} icon={<DollarSign size={22}/>} color="bg-green-100 text-green-900" />
            <StatsCard title="Total Profit Penjualan" value={stats.totalProfit} icon={<TrendingUp size={22}/>} color="bg-blue-100 text-blue-900" />
            
            {/* Kartu Statistik Dinamis */}
            <StatsCard title="Total Nilai Stok (Saat Ini)" value={stats.totalCurrentStockValue} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-library-big"><rect width="8" height="18" x="3" y="3" rx="1"/><path d="M7 3v18"/><path d="M20.4 18.9c.2.5-.1 1.1-.6 1.3l-1.9.7c-.5.2-1.1-.1-1.3-.6L11.1 5.1c-.2-.5.1-1.1.6-1.3l1.9-.7c.5-.2 1.1.1 1.3.6z"/></svg>} color="bg-yellow-100 text-yellow-900" />
            <StatsCard title="Nilai Stok GUDANG" value={stats.gudangValue} icon={<Package size={22}/>} color="bg-orange-100 text-orange-900" />
            <StatsCard title="Nilai Stok PIPITAN" value={stats.pipitanValue} icon={<Store size={22}/>} color="bg-purple-100 text-purple-900" />
            <StatsCard title="Nilai Stok SADIK" value={stats.sadikValue} icon={<Store size={22}/>} color="bg-pink-100 text-pink-900" />
        </div>
    );
};

const WarehouseTab = ({ onEdit }) => {
    const { accessories, removeAccessory, user, transferStock, addStockToWarehouse } = useData();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("ALL");
    const [transferTarget, setTransferTarget] = useState(null);
    const [transferQuantity, setTransferQuantity] = useState("");
    const [transferLocation, setTransferLocation] = useState("PIPITAN");
    const [receiveTarget, setReceiveTarget] = useState(null);
    const [receiveQuantity, setReceiveQuantity] = useState("");

    useEffect(() => { if (transferTarget) setTransferQuantity(""); }, [transferTarget]);
    useEffect(() => { if (receiveTarget) setReceiveQuantity(""); }, [receiveTarget]);

    const categories = useMemo(() => Array.from(new Set((accessories || []).map(p => p.category || 'LAINNYA'))).sort(), [accessories]);
    const filteredAccessories = useMemo(() => { if (!Array.isArray(accessories)) return []; return accessories.filter(acc => (filterCategory === "ALL" || (acc.category || 'LAINNYA') === filterCategory) && (acc.name?.toLowerCase().includes(search.toLowerCase()) || acc.item_code?.toLowerCase().includes(search.toLowerCase()))); }, [accessories, filterCategory, search]);
    const getStockByLocation = (accessory, location) => { if (!accessory || !Array.isArray(accessory.inventory)) return 0; const inventory = accessory.inventory.find(inv => inv.location === location); return inventory?.stock || 0; };
    
    const handleTransferStock = async () => { if (!transferTarget || !transferQuantity || parseInt(transferQuantity, 10) <= 0) { toast({ variant: "destructive", title: "Error", description: "Jumlah transfer tidak valid." }); return; } const result = await transferStock({ accessory_id: transferTarget.id, from_location: 'GUDANG', to_location: transferLocation, quantity: parseInt(transferQuantity, 10), transferred_by: user?.name || 'ADMIN' }); if (result.success) { toast({ title: "Berhasil", description: `Stok ditransfer ke ${transferLocation}` }); setTransferTarget(null); } else { toast({ variant: "destructive", title: "Gagal Transfer", description: result.error?.message }); } };
    const handleReceiveStock = async () => { if (!receiveTarget || !receiveQuantity || parseInt(receiveQuantity, 10) <= 0) { toast({ variant: "destructive", title: "Error", description: "Jumlah tidak valid." }); return; } const result = await addStockToWarehouse({ accessory_id: receiveTarget.id, quantity: parseInt(receiveQuantity, 10), actor: user?.name || 'ADMIN' }); if (result.success) { toast({ title: "Berhasil", description: "Stok baru telah ditambahkan ke gudang." }); setReceiveTarget(null); } else { toast({ variant: "destructive", title: "Gagal", description: result.error?.message }); } };
    const handleDelete = async (id) => { await removeAccessory(id); toast({ title: "Berhasil", description: "Aksesoris telah dihapus." }); };

    return (
        <div className="space-y-6 pt-4">
            <div className="flex flex-wrap gap-2 items-center p-2 border-b"><Select value={filterCategory} onValueChange={setFilterCategory}><SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter Kategori..." /></SelectTrigger><SelectContent><SelectItem value="ALL">Semua Kategori</SelectItem>{categories.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent></Select><Input placeholder="Cari nama atau kode barang..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" /></div>
            <div className="space-y-2">
                {filteredAccessories.map(acc => (
                    <div key={acc.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                        <div><p className="font-semibold">{acc.name} <span className="text-xs font-normal text-gray-500">({acc.brand})</span></p><p className="text-xs text-gray-600">Kode: {acc.item_code} | Kategori: {acc.category}</p><p className="text-xs text-gray-500">Modal: Rp {(acc.cost_price || 0).toLocaleString()} | Jual: Rp {(acc.sell_price || 0).toLocaleString()}</p><p className="text-sm text-blue-600 font-medium">Stok Gudang: {getStockByLocation(acc, 'GUDANG').toLocaleString()}</p></div>
                        <div className="flex items-center space-x-1"><Button variant="outline" size="sm" className="h-7 px-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100" onClick={() => setReceiveTarget(acc)}><Box size={14} className="mr-1" /> Terima Stok</Button><Button variant="outline" size="sm" className="h-7 px-2" onClick={() => setTransferTarget(acc)}><MoveRight size={14} className="mr-1" /> Oper Stok</Button><Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onEdit(acc)}><Edit3 size={14} /></Button><AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="icon" className="h-7 w-7"><Trash2 size={14} /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus Barang?</AlertDialogTitle><AlertDialogDescription>Yakin ingin menghapus "{acc.name}"?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(acc.id)} className="bg-red-600 hover:bg-red-700">Hapus</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>
                    </div>
                ))}
            </div>
            <Dialog open={!!transferTarget} onOpenChange={(isOpen) => !isOpen && setTransferTarget(null)}><DialogContent><DialogHeader><DialogTitle>Oper Stok: {transferTarget?.name}</DialogTitle><DialogDescription>Stok Gudang Saat Ini: {transferTarget ? getStockByLocation(transferTarget, 'GUDANG').toLocaleString() : 0}</DialogDescription></DialogHeader><div className="space-y-3 py-2"><Input type="number" placeholder="Jumlah transfer" value={transferQuantity} onChange={(e) => setTransferQuantity(e.target.value)} /><Select value={transferLocation} onValueChange={setTransferLocation}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PIPITAN">PIPITAN</SelectItem><SelectItem value="SADIK">SADIK</SelectItem></SelectContent></Select></div><DialogFooter><Button variant="outline" onClick={() => setTransferTarget(null)}>Batal</Button><Button onClick={handleTransferStock}>Transfer</Button></DialogFooter></DialogContent></Dialog>
            <Dialog open={!!receiveTarget} onOpenChange={(isOpen) => !isOpen && setReceiveTarget(null)}><DialogContent><DialogHeader><DialogTitle>Terima Stok: {receiveTarget?.name}</DialogTitle><DialogDescription>Stok Gudang Saat Ini: {receiveTarget ? getStockByLocation(receiveTarget, 'GUDANG').toLocaleString() : 0}</DialogDescription></DialogHeader><div className="py-2"><Input type="number" placeholder="Jumlah stok yang diterima" value={receiveQuantity} onChange={(e) => setReceiveQuantity(e.target.value)} /></div><DialogFooter><Button variant="outline" onClick={() => setReceiveTarget(null)}>Batal</Button><Button onClick={handleReceiveStock}>Tambah ke Gudang</Button></DialogFooter></DialogContent></Dialog>
        </div>
    );
};

const LocationStockTab = ({ locationName }) => {
    const { accessories } = useData();
    const [search, setSearch] = useState("");
    const locationAccessories = useMemo(() => { if (!Array.isArray(accessories)) return []; return accessories.map(acc => { const locationInv = acc.inventory?.find(inv => inv.location === locationName); if (locationInv && locationInv.stock > 0) { return { ...acc, location_stock: locationInv.stock }; } return null; }).filter(Boolean).filter(acc => acc.name?.toLowerCase().includes(search.toLowerCase()) || acc.item_code?.toLowerCase().includes(search.toLowerCase())); }, [accessories, locationName, search]);
    return ( <div className="space-y-6 pt-4"><div className="flex justify-between items-center"><h3 className="text-lg font-semibold">Daftar Stok: {locationName}</h3><Input type="text" placeholder="Cari nama atau kode barang..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs text-xs sm:text-sm" /></div><div className="space-y-2">{locationAccessories.length > 0 ? (locationAccessories.map(acc => (<div key={acc.id} className="flex items-center justify-between p-3 border rounded-lg bg-white"><div><p className="font-semibold">{acc.name} <span className="text-xs font-normal text-gray-500">({acc.brand})</span></p><p className="text-xs text-gray-600">Kode: {acc.item_code} | Kategori: {acc.category}</p></div><div><p className="text-sm font-medium">Stok Saat Ini: <span className="text-lg font-bold text-blue-600">{acc.location_stock.toLocaleString()}</span></p></div></div>))) : (<p className="text-center text-gray-500 py-10">Tidak ada barang dengan stok di lokasi ini.</p>)}</div></div>);
};

const ActivityLogTab = () => {
    const { inventoryLogs } = useData();
    const [search, setSearch] = useState("");
    if (!inventoryLogs) { return <p className="text-center text-gray-500 py-10">Memuat riwayat...</p>; }
    const filteredLogs = useMemo(() => { if (!Array.isArray(inventoryLogs)) return []; if (!search) return inventoryLogs; const lowercasedSearch = search.toLowerCase(); return inventoryLogs.filter(log => log.accessories?.name?.toLowerCase().includes(lowercasedSearch) || log.actor?.toLowerCase().includes(lowercasedSearch) || log.activity_type?.toLowerCase().includes(lowercasedSearch) || log.location?.toLowerCase().includes(lowercasedSearch)); }, [inventoryLogs, search]);
    const getActivityColor = (type) => { if (type.includes('JUAL')) return 'text-red-500'; if (type.includes('AWAL')) return 'text-green-600'; if (type.includes('OPER STOK')) return 'text-blue-600'; if (type.includes('RETUR')) return 'text-purple-600'; return 'text-gray-500'; };
    return (
        <div className="space-y-6 pt-4">
            <div className="flex justify-between items-center"><h3 className="text-lg font-semibold">Riwayat Aktivitas Inventaris</h3><Input type="text" placeholder="Cari aktivitas atau barang..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs text-xs sm:text-sm" /></div>
            <div className="space-y-2">
                {filteredLogs.length > 0 ? (
                    filteredLogs.map(log => (
                        <div key={log.id} className="grid grid-cols-3 gap-4 p-3 border rounded-lg bg-white items-center">
                            <div className="col-span-1">
                                <p className="font-semibold text-sm">{formatDateTime(log.created_at).date}</p>
                                <p className="text-xs text-gray-500">{formatDateTime(log.created_at).time} - Oleh: {log.actor}</p>
                            </div>
                            <div className="col-span-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-sm">{log.accessories?.name || '(Barang Dihapus)'}</p>
                                        {log.activity_type === 'OPER STOK' ? (
                                            <p className="text-xs text-gray-500">
                                                {log.from_location} <MoveRight className="inline-block h-3 w-3" /> {log.to_location}
                                            </p>
                                        ) : log.activity_type === 'RETUR DITERIMA' ? (
                                            <p className="text-xs text-purple-600">
                                                Diterima di: {log.location}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-gray-500">Lokasi: {log.location}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-semibold ${getActivityColor(log.activity_type)}`}>{log.activity_type}</p>
                                        <p className="text-sm">Jumlah: {log.quantity_change > 0 ? `+${log.quantity_change}` : log.quantity_change}</p>
                                    </div>
                                </div>
                                {log.notes && (
                                    <p className="text-xs italic text-gray-500 mt-1 pt-1 border-t">
                                        Catatan: {log.notes}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500 py-10">Tidak ada riwayat aktivitas.</p>
                )}
            </div>
        </div>
    );
};

const RequestsTab = () => {
    const { stockRequests, approveStockRequest, rejectStockRequest } = useData();
    const { toast } = useToast();
    const [filterStatus, setFilterStatus] = useState("PENDING");
    const [isSubmitting, setIsSubmitting] = useState(null);

    const filteredRequests = useMemo(() => { if (!Array.isArray(stockRequests)) return []; return stockRequests.filter(req => req.status === filterStatus); }, [stockRequests, filterStatus]);
    const handleApprove = async (request) => { setIsSubmitting(request.id); const result = await approveStockRequest(request); if (result.success) { toast({ title: 'Berhasil', description: 'Permintaan telah disetujui.' }); } else { toast({ variant: 'destructive', title: 'Gagal', description: result.error?.message }); } setIsSubmitting(null); };
    const handleReject = async (requestId) => { setIsSubmitting(requestId); const result = await rejectStockRequest(requestId); if (result.success) { toast({ title: 'Berhasil', description: 'Permintaan telah ditolak.' }); } else { toast({ variant: 'destructive', title: 'Gagal', description: result.error?.message }); } setIsSubmitting(null); };
    const getStatusColor = (status) => { switch (status) { case 'APPROVED': return 'text-green-600 bg-green-50'; case 'REJECTED': return 'text-red-600 bg-red-50'; default: return 'text-yellow-600 bg-yellow-50'; } };

    return (
        <div className="space-y-6 pt-4">
            <div className="flex justify-between items-center"><h3 className="text-lg font-semibold">Daftar Permintaan dari Pekerja</h3><Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PENDING">Pending</SelectItem><SelectItem value="APPROVED">Disetujui</SelectItem><SelectItem value="REJECTED">Ditolak</SelectItem></SelectContent></Select></div>
            <div className="space-y-3">
                {filteredRequests.length > 0 ? (filteredRequests.map(req => (<div key={req.id} className="p-4 border rounded-lg bg-white"><div className="flex justify-between items-start"><div><p className="font-bold">{req.accessories?.name || '(Barang Dihapus)'}</p><p className="text-sm text-gray-500">Oleh: {req.worker_username} di {req.location}</p><p className="text-xs text-gray-400">{formatDateTime(req.created_at).date} - {formatDateTime(req.created_at).time}</p></div><div className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(req.status)}`}>{req.status}</div></div><div className="mt-3 pt-3 border-t"><div className="flex justify-between items-center"><div><p className="text-sm font-medium">Jenis: <span className="font-bold">{req.request_type === 'REQUEST_STOCK' ? 'Permintaan Stok' : 'Retur Barang'}</span></p><p className="text-sm">Jumlah: <span className="font-bold">{req.quantity}</span></p></div>{req.status === 'PENDING' && (<div className="flex items-center space-x-2"><Button size="sm" variant="destructive" onClick={() => handleReject(req.id)} disabled={isSubmitting === req.id}>{isSubmitting === req.id ? '...' : <><X size={16} className="mr-1"/> Tolak</>}</Button><Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(req)} disabled={isSubmitting === req.id}>{isSubmitting === req.id ? '...' : <><Check size={16} className="mr-1"/> Setujui</>} </Button></div>)}</div>{req.description && (<div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-md"><p className="font-semibold flex items-center"><Info size={12} className="mr-1.5"/>Alasan/Deskripsi:</p><p>{req.description}</p></div>)}</div></div>))) : (<p className="text-center text-gray-500 py-10">Tidak ada permintaan dengan status "{filterStatus}".</p>)}
            </div>
        </div>
    );
};

export const AdminAccessoriesTab = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAccessory, setEditingAccessory] = useState(null);
    const { addAccessory, updateAccessory } = useData();
    const { toast } = useToast();

    const handleEdit = (accessory) => {
        setEditingAccessory(accessory);
        setIsFormOpen(true);
    };

    const handleSave = async (data) => {
        const result = editingAccessory ? await updateAccessory(editingAccessory.id, data) : await addAccessory(data);
        if (result.success) {
            toast({ title: "Berhasil", description: `Aksesoris telah ${editingAccessory ? 'diperbarui' : 'ditambahkan'}.` });
            setIsFormOpen(false); setEditingAccessory(null);
        } else {
            toast({ variant: "destructive", title: "Gagal", description: result.error?.message });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Manajemen Inventaris Aksesoris</h2><Button size="sm" onClick={() => { setEditingAccessory(null); setIsFormOpen(true); }}><PlusCircle size={16} className="mr-2" /> Tambah Barang Baru</Button></div>
            <StatsDashboard />
            <Tabs defaultValue="gudang" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="gudang">Gudang</TabsTrigger>
                    <TabsTrigger value="pipitan">Stok PIPITAN</TabsTrigger>
                    <TabsTrigger value="sadik">Stok SADIK</TabsTrigger>
                    <TabsTrigger value="requests">Permintaan</TabsTrigger>
                    <TabsTrigger value="sales">Riwayat Aktivitas</TabsTrigger>
                </TabsList>
                <TabsContent value="gudang"><WarehouseTab onEdit={handleEdit} /></TabsContent>
                <TabsContent value="pipitan"><LocationStockTab locationName="PIPITAN" /></TabsContent>
                <TabsContent value="sadik"><LocationStockTab locationName="SADIK" /></TabsContent>
                <TabsContent value="requests"><RequestsTab /></TabsContent>
                <TabsContent value="sales"><ActivityLogTab /></TabsContent>
            </Tabs>
            <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingAccessory(null); setIsFormOpen(isOpen); }}><DialogContent><DialogHeader><DialogTitle>{editingAccessory ? 'Edit' : 'Tambah'} Barang Baru</DialogTitle></DialogHeader><AccessoryForm accessory={editingAccessory} onSave={handleSave} onCancel={() => { setIsFormOpen(false); setEditingAccessory(null); }} /></DialogContent></Dialog>
        </div>
    );
};