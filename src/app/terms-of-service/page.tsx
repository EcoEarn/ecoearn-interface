'use client';

import dynamic from 'next/dynamic';
export default dynamic(() => import('pageComponents/terms-of-service'), { ssr: false });
