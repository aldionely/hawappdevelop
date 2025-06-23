import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Edit3, PlusCircle, MoveRight } from 'lucide-react';
import { formatNumberInput, parseFormattedNumber, formatDateTime } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AccessoryForm = ({ accessory, onSave, onCancel }) => {
    const [itemCode, setItemCode] = useState(accessory ? accessory.item_code : '');
    const [name, setName] = useState(accessory ? accessory.name : '');
    const [category, setCategory] = useState(accessory ? accessory.category : '');
    const [brand, setBrand] = useState(accessory ? accessory.brand : '');
    const [model, setModel] = useState(accessory ? accessory.model : '');
    const [costPrice, setCostPrice] = useState(accessory ? String(accessory.cost_price || '') : '');
    const [displayCostPrice, setDisplayCostPrice] = useState(accessory ? formatNumberInput(String(accessory.cost_price || '')) : '');
    const [sellPrice, setSellPrice] = useState(accessory ? String(accessory.sell_price || '') : '');
    const [displaySellPrice, setDisplaySellPrice] = useState(accessory ? formatNumberInput(String(accessory.sell_price || '')) : '');
    const [warehouseStock, setWarehouseStock] = useState(accessory ? String(accessory.warehouse_stock || '0') : '0');
    const [displayWarehouseStock, setDisplayWarehouseStock] = useState(accessory ? formatNumberInput(String(accessory.warehouse_stock || '0')) : '0');
    const { toast } = useToast();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!itemCode.trim() || !name.trim() || !category.trim() || !brand.trim()) { toast({ variant: "destructive", title: "Error", description: "Kode, Nama, Kategori, dan Merek harus diisi." }); return; }
        const numCostPrice = parseFloat(parseFormattedNumber(costPrice)) || 0;
        const numSellPrice = parseFloat(parseFormattedNumber(sellPrice)) || 0;
        const numWarehouseStock = parseInt(parseFormattedNumber(warehouseStock), 10) || 0;
        onSave({ item_code: itemCode.toUpperCase(), name, category: category.toUpperCase(), brand, model: model || null, cost_price: numCostPrice, sell_price: numSellPrice, warehouse_stock: numWarehouseStock });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <Input placeholder="Kode Barang (Unik)" value={itemCode} onChange={(e) => setItemCode(e.target.value.toUpperCase())} required disabled={!!accessory} />
            <Input placeholder="Nama Produk" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input placeholder="Kategori (e.g. CASING, KABEL)" value={category} onChange={(e) => setCategory(e.target.value)} required />
            <Input placeholder="Merek" value={brand} onChange={(e) => setBrand(e.target.value)} required />
            <Input placeholder="Model (Opsional)" value={model} onChange={(e) => setModel(e.target.value)} />
            <Input type="text" placeholder="Harga Modal (Rp)" value={displayCostPrice} onChange={(e) => { setCostPrice(e.target.value); setDisplayCostPrice(formatNumberInput(e.target.value)); }} required />
            <Input type="text" placeholder="Harga Jual (Rp)" value={displaySellPrice} onChange={(e) => { setSellPrice(e.target.value); setDisplaySellPrice(formatNumberInput(e.target.value)); }} required />
            <Input type="text" placeholder="Stok Gudang (Stok Awal)" value={displayWarehouseStock} onChange={(e) => { setWarehouseStock(e.target.value); setDisplayWarehouseStock(formatNumberInput(e.target.value)); }} required disabled={!!accessory} />
            <DialogFooter> <DialogClose asChild><Button type="button" variant="outline" size="sm" onClick={onCancel}>Batal</Button></DialogClose> <Button type="submit" size="sm">Simpan</Button> </DialogFooter>
        </form>
    );
};

const WarehouseTab = () => {
    const { accessories, addAccessory, updateAccessory, removeAccessory, user, transferStock } = useData();
    const { toast } = useToast();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAccessory, setEditingAccessory] = useState(null);
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("ALL");
    const [transferTarget, setTransferTarget] = useState(null);
    const [transferQuantity, setTransferQuantity] = useState("");
    const [transferLocation, setTransferLocation] = useState("PIPITAN");

    if (!Array.isArray(accessories)) {
        return <p className="text-center text-gray-500 py-10">Memuat data aksesoris...</p>;
    }

    const categories = useMemo(() => {
        const uniqueCategories = new Set(accessories.map(p => p.category || 'TANPA KATEGORI'));
        return Array.from(uniqueCategories).sort();
    }, [accessories]);

    const filteredAccessories = useMemo(() => {
        return accessories
            .filter(acc => (filterCategory === "ALL" || (acc.category || 'TANPA KATEGORI') === filterCategory))
            .filter(acc => acc.name.toLowerCase().includes(search.toLowerCase()) || acc.item_code.toLowerCase().includes(search.toLowerCase()));
    }, [accessories, filterCategory, search]);
    
    const handleSave = async (data) => {
        const result = editingAccessory ? await updateAccessory(editingAccessory.id, data) : await addAccessory(data);
        if (result.success) {
            toast({ title: "Berhasil", description: `Aksesoris telah ${editingAccessory ? 'diperbarui' : 'ditambahkan'}.` });
            setIsFormOpen(false);
            setEditingAccessory(null);
        } else {
            toast({ variant: "destructive", title: "Gagal", description: result.error?.message || "Terjadi kesalahan." });
        }
    };

    const handleDelete = async (id) => {
        const result = await removeAccessory(id);
        if (result.success) {
            toast({ title: "Berhasil", description: "Aksesoris telah dihapus." });
        } else {
            toast({ variant: "destructive", title: "Gagal", description: result.error?.message });
        }
    };

    const getWarehouseStock = (accessory) => {
        // Langsung cari stok di dalam data inventory dengan lokasi GUDANG
        if (!accessory || !Array.isArray(accessory.inventory)) {
            return 0;
        }
        const warehouseInventory = accessory.inventory.find(inv => inv.location === 'GUDANG');
        return warehouseInventory?.stock || 0; // Kembalikan stoknya, atau 0 jika tidak ada
    };

    const handleTransferStock = async () => {
        if (!transferTarget || !transferQuantity || parseInt(transferQuantity, 10) <= 0) {
            toast({ variant: "destructive", title: "Error", description: "Pastikan jumlah transfer valid dan lebih dari 0." });
            return;
        }

        const details = {
            accessory_id: transferTarget.id,
            from_location: 'GUDANG',
            to_location: transferLocation,
            quantity: parseInt(transferQuantity, 10),
            transferred_by: user?.name || 'admin'
        };

        const result = await transferStock(details);

        if (result.success) {
            toast({ title: "Berhasil", description: `Stok berhasil ditransfer ke ${transferLocation}` });
            setTransferTarget(null);
            setTransferQuantity("");
        } else {
            toast({ variant: "destructive", title: "Gagal Transfer", description: result.error?.message || "Terjadi kesalahan." });
        }
    };

    return (
        <div className="space-y-6 pt-4">
             <div className="flex justify-between items-center">
                 <h3 className="text-lg font-semibold">Gudang (Master Data)</h3>
                 <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                     <DialogTrigger asChild><Button size="sm" onClick={() => { setEditingAccessory(null); setIsFormOpen(true); }}><PlusCircle size={16} className="mr-2" /> Tambah Barang Baru</Button></DialogTrigger>
                     <DialogContent><DialogHeader><DialogTitle>{editingAccessory ? 'Edit' : 'Tambah'} Barang Baru</DialogTitle></DialogHeader><AccessoryForm accessory={editingAccessory} onSave={handleSave} onCancel={() => setIsFormOpen(false)} /></DialogContent>
                 </Dialog>
             </div>
            
             <div className="flex flex-wrap gap-2 items-center p-2 border-b">
                 <Select value={filterCategory} onValueChange={setFilterCategory}>
                     <SelectTrigger className="w-[200px] text-xs sm:text-sm"><SelectValue placeholder="Filter Kategori..." /></SelectTrigger>
                     <SelectContent>
                         <SelectItem value="ALL">Semua Kategori</SelectItem>
                         {categories.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                     </SelectContent>
                 </Select>
                 <Input type="text" placeholder="Cari nama atau kode barang..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs text-xs sm:text-sm" />
             </div>

             <div className="space-y-2">
                 {filteredAccessories.map(acc => (
                     <div key={acc.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                         <div>
                             <p className="font-semibold">{acc.name} <span className="text-xs font-normal text-gray-500">({acc.brand})</span></p>
                             <p className="text-xs text-gray-600">Kode: {acc.item_code} | Kategori: {acc.category}</p>
                             <p className="text-sm text-blue-600 font-medium">Stok Gudang: {getWarehouseStock(acc).toLocaleString()}</p>
                         </div>
                         <div className="flex items-center space-x-1">
                             <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => setTransferTarget(acc)}><MoveRight size={14} className="mr-1" /> Oper Stok</Button>
                             <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => { setEditingAccessory(acc); setIsFormOpen(true); }}><Edit3 size={14} /></Button>
                             <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="destructive" size="icon" className="h-7 w-7"><Trash2 size={14} /></Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Hapus Barang?</AlertDialogTitle><AlertDialogDescription>Yakin ingin menghapus "{acc.name}" dari master data?</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(acc.id)} className="bg-red-600 hover:bg-red-700">Hapus</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                         </div>
                     </div>
                 ))}
                 {filteredAccessories.length === 0 && <p className="text-center text-gray-500 py-4">Tidak ada barang yang cocok dengan filter.</p>}
             </div>

             <Dialog open={!!transferTarget} onOpenChange={(isOpen) => !isOpen && setTransferTarget(null)}>
                 <DialogContent>
                     <DialogHeader>
                         <DialogTitle>Oper Stok: {transferTarget?.name}</DialogTitle>
                         <DialogDescription>Stok Gudang Saat Ini: {transferTarget ? getWarehouseStock(transferTarget).toLocaleString() : 0}</DialogDescription>
                     </DialogHeader>
                     <div className="space-y-3 py-2">
                         <Input type="number" placeholder="Jumlah yang akan ditransfer" value={transferQuantity} onChange={(e) => setTransferQuantity(e.target.value)} />
                         <Select value={transferLocation} onValueChange={setTransferLocation}>
                             <SelectTrigger><SelectValue placeholder="Pilih Lokasi Tujuan..." /></SelectTrigger>
                             <SelectContent>
                                 <SelectItem value="PIPITAN">PIPITAN</SelectItem>
                                 <SelectItem value="SADIK">SADIK</SelectItem>
                             </SelectContent>
                         </Select>
                     </div>
                     <DialogFooter>
                         <Button variant="outline" onClick={() => setTransferTarget(null)}>Batal</Button>
                         <Button onClick={handleTransferStock}>Transfer</Button>
                     </DialogFooter>
                 </DialogContent>
             </Dialog>
        </div>
     );
};

const LocationStockTab = ({ locationName }) => {
    const { accessories } = useData();
    const [search, setSearch] = useState("");

    // Filter aksesoris yang memiliki stok di lokasi ini
    const locationAccessories = useMemo(() => {
        if (!Array.isArray(accessories)) return [];

        return accessories
            .map(acc => {
                const locationInv = acc.inventory?.find(inv => inv.location === locationName);
                // Hanya sertakan barang jika ada entri inventaris & stok > 0 untuk lokasi ini
                if (locationInv && locationInv.stock > 0) {
                    return {
                        ...acc,
                        location_stock: locationInv.stock,
                    };
                }
                return null;
            })
            .filter(Boolean) // Hapus semua hasil null dari array
            .filter(acc => // Terapkan filter pencarian
                acc.name.toLowerCase().includes(search.toLowerCase()) ||
                acc.item_code.toLowerCase().includes(search.toLowerCase())
            );
    }, [accessories, locationName, search]);

    return (
        <div className="space-y-6 pt-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Daftar Stok: {locationName}</h3>
                <Input 
                    type="text" 
                    placeholder="Cari nama atau kode barang..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    className="max-w-xs text-xs sm:text-sm"
                />
            </div>

            <div className="space-y-2">
                {locationAccessories.length > 0 ? (
                    locationAccessories.map(acc => (
                        <div key={acc.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                            <div>
                                <p className="font-semibold">{acc.name} <span className="text-xs font-normal text-gray-500">({acc.brand})</span></p>
                                <p className="text-xs text-gray-600">Kode: {acc.item_code} | Kategori: {acc.category}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Stok Saat Ini: <span className="text-lg font-bold text-blue-600">{acc.location_stock.toLocaleString()}</span></p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500 py-10">Tidak ada barang dengan stok di lokasi ini.</p>
                )}
            </div>
        </div>
    );
};

const RequestsTab = () => <div className="p-4 bg-gray-100 rounded-lg"><h3 className="font-semibold text-lg">Permintaan & Aktivitas</h3><p className="text-sm text-gray-600">Daftar permintaan stok dan barang retur dari pekerja akan ditampilkan di sini.</p></div>;
const ActivityLogTab = () => {
    const { inventoryLogs } = useData();
    const [search, setSearch] = useState("");

    const filteredLogs = useMemo(() => {
        if (!Array.isArray(inventoryLogs)) return [];
        if (!search) return inventoryLogs;
        
        const lowercasedSearch = search.toLowerCase();
        return inventoryLogs.filter(log =>
            log.accessories?.name?.toLowerCase().includes(lowercasedSearch) ||
            log.actor?.toLowerCase().includes(lowercasedSearch) ||
            log.activity_type?.toLowerCase().includes(lowercasedSearch) ||
            log.location?.toLowerCase().includes(lowercasedSearch)
        );
    }, [inventoryLogs, search]);

    const getActivityColor = (type) => {
        if (type.includes('JUAL')) return 'text-red-600';
        if (type.includes('MASUK')) return 'text-green-600';
        if (type.includes('KELUAR')) return 'text-yellow-600';
        return 'text-gray-500';
    };

    return (
        <div className="space-y-6 pt-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Riwayat Aktivitas Inventaris</h3>
                <Input
                    type="text"
                    placeholder="Cari aktivitas, barang, atau aktor..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="max-w-xs text-xs sm:text-sm"
                />
            </div>
            <div className="space-y-2">
                {filteredLogs.length > 0 ? (
                    filteredLogs.map(log => (
                        <div key={log.id} className="grid grid-cols-5 gap-4 p-3 border rounded-lg bg-white items-center">
                            <div className="col-span-1">
                                <p className="font-semibold text-sm">{formatDateTime(log.created_at).date}</p>
                                <p className="text-xs text-gray-500">{formatDateTime(log.created_at).time}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="font-bold text-sm">{log.accessories?.name || 'N/A'}</p>
                                <p className="text-xs text-gray-600">Oleh: {log.actor} | Lokasi: {log.location}</p>
                            </div>
                            <div className="col-span-2 text-right">
                                <p className={`font-semibold ${getActivityColor(log.activity_type)}`}>{log.activity_type}</p>
                                <p className="text-sm">Jumlah: {log.quantity_change > 0 ? `+${log.quantity_change}` : log.quantity_change}</p>
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


export const AdminAccessoriesTab = () => {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">Manajemen Inventaris Aksesoris</h2>
            <Tabs defaultValue="gudang" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="gudang">Gudang</TabsTrigger>
                    <TabsTrigger value="pipitan">Stok PIPITAN</TabsTrigger>
                    <TabsTrigger value="sadik">Stok SADIK</TabsTrigger>
                    <TabsTrigger value="requests">Permintaan</TabsTrigger>
                    <TabsTrigger value="sales">Aktivitas Penjualan</TabsTrigger>
                </TabsList>
                <TabsContent value="gudang">
                    <WarehouseTab />
                </TabsContent>
                <TabsContent value="pipitan">
                    <LocationStockTab locationName="PIPITAN" />
                </TabsContent>
                <TabsContent value="sadik">
                    <LocationStockTab locationName="SADIK" />
                </TabsContent>
                <TabsContent value="requests">
                    <RequestsTab />
                </TabsContent>
                <TabsContent value="sales">
                    <ActivityLogTab />
                </TabsContent>
            </Tabs>
        </div>
    );
};