import { DirectoryList } from "@/components/directory/DirectoryList";

export default function AdminTeachersPage() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <DirectoryList 
        title="Teachers Directory" 
        description="All teachers registered in the platform."
        endpoint="/chat/directory/teachers"
      />
    </div>
  );
}
