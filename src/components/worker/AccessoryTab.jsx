import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export const AccessoryTab = () => {
    const { accessories, activeShift, sellAccessoryAndUpdateShift } = useData();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

    const locationName = activeShift?.lokasi;

    // Logika untuk memfilter aksesoris yang tersedia di lokasi pekerja
    const availableAccessories = useMemo(() => {
        if (!Array.isArray(accessories) || !locationName) return [];

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
            .filter(Boolean) // Hapus yang stoknya 0 atau tidak ada di lokasi
            .filter(acc => // Terapkan filter pencarian
                acc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                acc.item_code?.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [accessories, locationName, searchTerm]);

    const handleSell = async (accessory) => {
        if (!sellAccessoryAndUpdateShift) {
             toast({ variant: "destructive", title: 'Error', description: 'Fungsi penjualan belum siap.' });
             return;
        }
        const result = await sellAccessoryAndUpdateShift(accessory);
        if (result.success) {
            toast({ title: 'Aksesoris Terjual!', description: `${accessory.name} telah tercatat sebagai transaksi.` });
        } else {
            toast({ variant: "destructive", title: 'Gagal Menjual', description: result.error?.message || 'Terjadi kesalahan.' });
        }
    };

    return (
        <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
            <div className="relative flex-grow my-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Cari aksesoris..."
                    className="w-full pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="space-y-3 mt-4">
                {/* DIUBAH: Menggunakan variabel yang benar yaitu 'availableAccessories' */}
                {availableAccessories.length === 0 ? (
                    <p className="text-center text-gray-500 pt-10">Tidak ada aksesoris tersedia di lokasi ini.</p>
                ) : (
                    availableAccessories.map(acc => (
                        <div key={acc.id} className="p-3 border rounded-lg bg-white flex justify-between items-center">
                            <div className="text-sm">
                                <p className="font-semibold">{acc.name}</p>
                                <p className="text-xs text-gray-500">Sisa Stok: {acc.location_stock}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-sm">Rp {acc.sell_price.toLocaleString()}</p>
                                <Button size="sm" className="mt-1 h-8 text-xs" onClick={() => handleSell(acc)}>Jual</Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};