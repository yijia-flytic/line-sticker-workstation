import './globals.css';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'LINE 貼圖工作站',
  description: '一站式 LINE 貼圖設計、生成、管理工具',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontFamily: '"M PLUS Rounded 1c", sans-serif',
              borderRadius: '12px',
            },
          }}
        />
      </body>
    </html>
  );
}
