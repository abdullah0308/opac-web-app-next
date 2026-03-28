import { RootPage, generatePageMetadata } from "@payloadcms/next/views";
import { importMap } from "../importMap";
import config from "@payload-config";

type Args = {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] }>;
};

export const generateMetadata = ({ params }: Args) =>
  generatePageMetadata({ config, params });

export default async function Page({ params, searchParams }: Args) {
  return RootPage({ config, params, searchParams, importMap });
}
