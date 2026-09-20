import { redirect } from 'next/navigation';
export default async function LegacyComputeResult({params}:{params:Promise<{id:string}>}){const {id}=await params;const aliases:Record<string,string>={'1024':'SIM-20260920-008','1025':'SIM-20260921-003','DFT-2839':'SIM-20260919-004'};redirect(`/compute-space/tasks/${aliases[id]||id}`);}
