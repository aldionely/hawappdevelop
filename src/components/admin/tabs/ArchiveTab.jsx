import React from "react";
import { useData } from "@/contexts/DataContext";
import { ArchivedShiftsList } from "@/components/admin/ArchivedShiftsList";

export const ArchiveTab = () => {
  const { workers, shiftArchives, removeShiftArchive } = useData();

  return (
    <>
      <h2 className="text-md sm:text-lg font-semibold mb-3 sm:mb-4">Arsip Shift per User</h2>
      <ArchivedShiftsList workers={workers} shiftArchives={shiftArchives} onDeleteShift={removeShiftArchive} />
    </>
  );
};