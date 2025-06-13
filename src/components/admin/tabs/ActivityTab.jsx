import React from "react";
import { useData } from "@/contexts/DataContext";
import { ActiveShiftsList } from "@/components/admin/ActiveShiftsList";

export const ActivityTab = () => {
  const { activeShifts } = useData();

  return (
    <>
      <h2 className="text-md sm:text-lg font-semibold mb-3 sm:mb-4">Aktivitas Shift Saat Ini</h2>
      <ActiveShiftsList activeShifts={activeShifts} />
    </>
  );
};