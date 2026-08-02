import { DirectoryList } from "@/components/directory/DirectoryList";

export default function TeacherTeachersPage() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <DirectoryList 
        title="Teachers Directory" 
        description="Other teachers in the platform."
        endpoint="/chat/directory/teachers"
      />
    </div>
  );
}
