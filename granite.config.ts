import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'fortunelab',
  brand: {
    displayName: '운세연구소', // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
    primaryColor: '#3182F6', // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    icon: 'https://iagjuubpbrafwiuoqgrr.supabase.co/storage/v1/object/public/assets/logo.png', // 화면에 노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
  },
  web: {
    host: 'localhost',
    port: 5174,
    commands: {
      dev: 'vite --host',
      build: 'tsc -b && vite build',
    },
  },
  permissions: [],
  outdir: 'dist',
});
