import { DirectoryList } from "@/components/directory/DirectoryList";

export default function AdminStudentsPage() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <DirectoryList 
        title="Students Directory" 
        description="All students registered in the platform."
        endpoint="/chat/directory/students"
      />
    </div>
  );
}
