// Общая конфигурация для всех API роутов
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Отключаем статическую генерацию для роутов с cookies
export const generateStaticParams = () => {
  return [];
};
