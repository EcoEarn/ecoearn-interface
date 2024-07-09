'use client';

import dynamic from 'next/dynamic';
export default dynamic(() => import('pageComponents/privacy-policy'), { ssr: false });
