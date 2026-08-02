import { DirectoryList } from "@/components/directory/DirectoryList";

export default function TeacherStudentsPage() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <DirectoryList 
        title="My Students" 
        description="Students you teach or have taught."
        endpoint="/chat/directory/students"
      />
    </div>
  );
}
