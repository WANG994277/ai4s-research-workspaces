import { notFound,redirect } from 'next/navigation';
export default async function LegacyRoute({params}:{params:Promise<{slug:string[]}>}){const {slug}=await params;if(slug[0]==='workbench')redirect('/workspace');if(slug[0]==='assets')redirect('/assets');notFound();}
