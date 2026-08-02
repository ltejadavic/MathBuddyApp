import { DirectoryList } from "@/components/directory/DirectoryList";

export default function AdminStaffPage() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <DirectoryList 
        title="Staff Directory" 
        description="Administrative and support staff."
        endpoint="/chat/directory/staff"
      />
    </div>
  );
}
