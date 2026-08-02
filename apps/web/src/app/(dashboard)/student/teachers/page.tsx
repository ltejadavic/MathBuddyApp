import { DirectoryList } from "@/components/directory/DirectoryList";

export default function StudentTeachersPage() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <DirectoryList 
        title="My Teachers" 
        description="Teachers you are currently assigned to."
        endpoint="/chat/directory/teachers"
      />
    </div>
  );
}
