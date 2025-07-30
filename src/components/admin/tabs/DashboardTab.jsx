import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminTransactionTab } from "./DashboardTab/AdminTransactionTab";
import { VoucherDashboardTab } from "./DashboardTab/VoucherDashboardTab"; // Impor komponen baru

export const DashboardTab = () => {
  return (
    <Tabs defaultValue="admin-transaksi" className="w-full">
      {/* Tambahkan grid-cols-2 untuk membagi tab menjadi dua */}
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="admin-transaksi">Admin Transaksi</TabsTrigger>
        <TabsTrigger value="voucher-dashboard">Dashboard Voucher</TabsTrigger> {/* Trigger baru */}
      </TabsList>
      <TabsContent value="admin-transaksi">
        <AdminTransactionTab />
      </TabsContent>
      <TabsContent value="voucher-dashboard">
        <VoucherDashboardTab /> {/* Konten baru */}
      </TabsContent>
    </Tabs>
  );
};