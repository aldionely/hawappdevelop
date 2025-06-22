import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const ProductTab = () => {
    const { products, sellProductAndUpdateShift, appBalanceKeysAndNames } = useData();
    const { toast } = useToast();
    const [filterCategory, setFilterCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const getAppName = (appKey) => {
        if (!appKey) return 'Tidak Ada';
        const app = appBalanceKeysAndNames.find(a => a.key === appKey);
        return app ? app.name : 'Tidak Diketahui';
    };

    const categories = useMemo(() => {
        if (!products) return [];
        const uniqueCategories = new Set(products.map(p => p.category || 'Lainnya'));
        return Array.from(uniqueCategories).sort();
    }, [products]);

    const filteredProducts = useMemo(() => {
        if (!filterCategory) return [];
        let results = products.filter(p => (p.category || 'Lainnya') === filterCategory);
        if (searchTerm) {
            results = results.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.keyword.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return results;
    }, [products, filterCategory, searchTerm]);

    const sortProducts = (a, b) => {
        const getNumberFromName = (name) => {
            const match = name.match(/\d+$/);
            return match ? parseInt(match[0], 10) : Infinity;
        };
        const numA = getNumberFromName(a.name);
        const numB = getNumberFromName(b.name);
        if (numA !== numB) return numA - numB;
        return a.name.localeCompare(b.name);
    };

    const handleSellProduct = async (product) => {
        const result = await sellProductAndUpdateShift(product);
        if (result.success) {
            toast({ title: 'Produk Terjual!', description: `${product.name} telah tercatat sebagai transaksi.` });
        } else {
            toast({ variant: 'destructive', title: 'Gagal Menjual', description: result.error || 'Terjadi kesalahan.' });
        }
    };

    return (
        <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
            <div className="flex gap-2 my-2">
                <Select value={filterCategory} onValueChange={(value) => { setFilterCategory(value); setSearchTerm(""); }}>
                    <SelectTrigger className="w-full text-xs sm:text-sm">
                        <SelectValue placeholder="Pilih Kategori Produk..." />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Cari produk..."
                    className="w-full pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={!filterCategory}
                />
            </div>
            <div className="space-y-3 mt-4">
                {!filterCategory ? (
                    <p className="text-center text-gray-500 pt-10">Pilih kategori untuk melihat produk.</p>
                ) : filteredProducts.length === 0 ? (
                    <p className="text-center text-gray-500 pt-10">Tidak ada produk yang cocok.</p>
                ) : (
                    filteredProducts.sort(sortProducts).map(product => (
                        <div key={product.id} className="p-3 border rounded-lg bg-white flex justify-between items-center">
                            <div className="text-sm">
                                <p className="font-semibold">{product.name}</p>
                                <p className="text-xs text-gray-500">Kata Kunci : {product.keyword}</p>
                                <p className="text-xs text-gray-500">Aplikasi : {getAppName(product.related_app_key)}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-sm">Rp {product.sell_price.toLocaleString()}</p>
                                <Button size="sm" className="mt-1 h-8 text-xs" onClick={() => handleSellProduct(product)}>Jual</Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};