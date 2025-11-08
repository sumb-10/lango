import { Metadata } from 'next';
import MaterialUploadForm from '@/components/MaterialUploadForm';

export const metadata: Metadata = {
  title: '교재 업로드 - Lango',
  description: '새로운 교재를 업로드하고 학습을 시작하세요',
};

export default function MaterialUploadPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">교재 업로드</h1>
        <p className="text-muted-foreground">
          TXT 파일을 업로드하면 자동으로 학습지가 생성됩니다
        </p>
      </div>
      <MaterialUploadForm />
    </div>
  );
}
