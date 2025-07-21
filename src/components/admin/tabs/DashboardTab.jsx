import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminTransactionTab } from "./DashboardTab/AdminTransactionTab";

export const DashboardTab = () => {
  return (
    <Tabs defaultValue="admin-transaksi" className="w-full">
      <TabsList>
        <TabsTrigger value="admin-transaksi">Admin Transaksi</TabsTrigger>
      </TabsList>
      <TabsContent value="admin-transaksi">
        <AdminTransactionTab />
      </TabsContent>
    </Tabs>
  );
};