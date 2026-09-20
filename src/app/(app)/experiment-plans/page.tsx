import { redirect } from "next/navigation";
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
 const query=await searchParams;const target=new URL("/do-space/plans","http://local");
 for(const [key,value] of Object.entries(query)) if(typeof value==="string")target.searchParams.set(key,value);
 if(query.sourceId || query.readDraft) target.pathname="/do-space";
 redirect(target.pathname+target.search);
}
